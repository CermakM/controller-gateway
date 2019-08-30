/**
 * Kebechet controller to reconcile registered Git Hub webhooks
 */


import { Request } from 'express'
import http        from 'http'
import _           from 'lodash'

import k8s = require('@kubernetes/client-node')

import * as k8sutil from '../../common/k8sutil'
import * as webhookv1 from '../../api/github/webhook'

import { Job } from './resource'


// Kubernetes client

const kubeConfig = new k8s.KubeConfig()
// either load incluster config or search for local config in ~/.kube/config
kubeConfig.loadFromDefault()

const k8sApi = kubeConfig.makeApiClient(k8s.BatchV1Api)

// Kubernetes Resources

export class Reconciler {
    constructor() { }

    public reconcile(req: Request) {
        console.log('[Kebechet] Reconciling.')

        const event: string | undefined = req.header('X-GitHub-Event')
        if (_.isUndefined(event)) {
            console.error('Invalid request.', req)
            return
        }
        const repository: webhookv1.Repository = req.body.repository

        return this.createJobForRepository(event, repository)
            .then( () => {
                console.log('[Kebechet] Successfully reconciled.')  
            })
            .catch((err) => console.error('[Kebechet] Error:', err.response.toJSON()))
    }

    private createJobForRepository(event: string, repository: webhookv1.Repository) {
        // Create a copy of the Job object
        const job = Object.assign({}, Job)

        job.metadata = Object.assign(job.metadata || {}, {
            annotations: {
                'kebechet/event': event,
                'kebechet/repository.id': String(repository.id),
                'kebechet/repository.url': repository.url
            },
            name: `kebechet-${repository.id}`,
        })

        // @ts-ignore
        job.spec.template.spec.containers[0].env.push({
            name : 'KEBECHET_REPO_URL',
            value: repository.url,
        })  

        return this.createJob(job)
    }

    private createJob(job: k8s.V1Job): Promise<{ response: http.IncomingMessage; body: k8s.V1Job }> {
        const namespace = process.env['KEBECHET_NAMESPACE'] || k8sutil.getCurrentNamespace()
        if (_.isUndefined(namespace)) {
            throw Error('Namespace is not defined and cannot be determined.')
        }

        // @ts-ignore
        const jobName: string = job.metadata.name

        // check that the job doesn't exist in the namespace
        return k8sApi.readNamespacedJob(jobName, namespace)
            .then( ({response, body}: {response: http.IncomingMessage; body: k8s.V1Job}) => {
                // Job already exists, check if the status the status
                console.log('[Kebechet] Job already exists.')

                if (!_.isUndefined(body.status)) {
                    const status: k8s.V1JobStatus = body.status
                    console.log('[Kebechet] Job status:', status)

                    // If the job is active or succeded, leave it as is
                    if (status.active || status.succeeded) {
                        return {response: response, body: body}
                    }
                }
                // Otherwise attempt to patch it and run again
                console.log('[Kebechet] Patching job in namespace', namespace)
                return k8sApi.patchNamespacedJob(jobName, namespace, job)
            })
            .catch( (err) => {
                const resp = err.response.body
                if (resp.reason != 'AlreadyExists' && resp.reason != 'NotFound') {
                    console.error(err.response.toJSON())
                    throw err
                }

                // Aight, create it
                console.log('[Kebechet] Creating job in namespace', namespace)
                return k8sApi.createNamespacedJob(namespace, job)
            })
    }
}
