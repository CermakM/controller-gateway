import k8s     from '@kubernetes/client-node'
import process from 'process'


const envDefault: k8s.V1EnvVar[] = [
    {
        name: 'KEBECHET_VERBOSE',
        value : process.env['KEBECHET_VERBOSE'] || '1',
    },
    {
        name: 'PIPENV_NOSPIN',
        value : process.env['PIPENV_NOSPIN'] || '1',
    },
    {
        name: 'PIPENV_COLORBLIND',
        value : process.env['PIPENV_COLORBLIND'] || '1',
    },
    {
        name: 'PIPENV_HIDE_EMOJIS',
        value : process.env['PIPENV_HIDE_EMOJIS'] || '1',
    },
    {
        name: 'KEBECHET_SUBCOMMAND',
        value : process.env['KEBECHET_SUBCOMMAND'] || 'run-url',
    }
]

export const Job: k8s.V1Job = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
        name: 'kebechet',
        labels: {
            app: 'thoth',
            component: 'kebechet',
            mark: 'cleanup'
        }
    },
    spec: {
        template: {
            metadata: {
                labels: {
                    app: 'kebechet'
                }
            },
            spec: {
                restartPolicy: 'Never',
                containers: [
                    {
                        image: 'kebechet-job:latest',
                        name: 'kebechet',
                        volumeMounts: [
                            {
                                name: 'ssh-config',
                                mountPath: '/home/user/.ssh',
                                readOnly: true
                            }
                        ],
                        env: [
                            {
                                name: 'GITHUB_KEBECHET_TOKEN',
                                valueFrom: {
                                    secretKeyRef: {
                                        key: 'github-oauth-token',
                                        name: 'kebechet-secret'
                                    }
                                }
                            },
                            ...envDefault
                        ]
                    }
                ],
                volumes: [
                    {
                        name: 'ssh-config',
                        secret: {
                            secretName: 'kebechet-secret',
                            items: [
                                {
                                    key: 'ssh-privatekey',
                                    path: 'id_rsa',
                                    mode: 0o0600
                                }
                            ]
                        }
                    }
                ]
            }
        }
    }
}