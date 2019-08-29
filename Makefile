PACKAGE = controller-gateway

CURRENT_DIR     = $(shell pwd)
DIST_DIR       ?= ${CURRENT_DIR}/dist

VERSION         = $(shell cat package.json | jq -r '.version')
BUILD_DATE      = $(shell date -u +'%Y-%m-%dT%H:%M:%SZ')

GIT_COMMIT      = $(shell git rev-parse HEAD)
GIT_TAG         = $(shell if [ -z "`git status --porcelain`" ]; then git describe --exact-match --tags HEAD 2>/dev/null; fi)
GIT_TREE_STATE  = $(shell if [ -z "`git status --porcelain`" ]; then echo "clean" ; else echo "dirty"; fi)

IMAGE_NAME = $(NAME) 
IMAGE_TAG ?= latest

NAMESPACE          ?= $(shell oc whoami --show-context | cut -d'/' -f 1)

BUILDCONFIG        ?= ${PACKAGE}-buildconfig
BUILDCONFIG_EXISTS := $(shell oc get -n ${NAMESPACE} buildconfigs ${BUILDCONFIG} &> /dev/null && echo 0 || echo 1)

IMAGESTREAM		   ?= ${PACKAGE}

INCLUDES = dist/ package*.json README.md Dockerfile

ULTRAHOOK_SUBDOMAIN   ?= test
ULTRAHOOK_TARGET_HOST ?= localhost
ULTRAHOOK_TARGET_PORT ?= 5000
ULTRAHOOK_API_KEY     ?= $(shell cat ~/.ultrahook | cut -d' ' -f2)

# Allow user to set the env explicitly from .makerc file
-include .makerc

.PHONY: all
all: build

.PHONY: build
build:
	npm build

.PHONY: build-openshift
build-openshift: deploy build-gateway-openshift build-ultrahook-openshift

build-gateway-openshift:
	oc -n ${NAMESPACE} start-build ${PACKAGE}
build-ultrahook-openshift:
	oc -n ${NAMESPACE} start-build ultrahook

.PHONY: deploy
deploy: deploy-ultrahook deploy-gateway

image: build
	docker build --rm -t $(IMAGE_NAME):$(IMAGE_TAG) .

# OpenShift binary builds for local development
image-openshift: archive = dist.tar.gz
image-openshift: deploy
	tar -czf ${archive} $(shell basename ${DIST_DIR})
ifeq ($(BUILDCONFIG_EXISTS), 1)
	# Create the BC manually here if not specified earlier
	oc -n ${NAMESPACE} new-build --strategy docker --binary --name ${BUILDCONFIG} --to ${IMAGESTREAM}
endif
	oc -n ${NAMESPACE} start-build ${BUILDCONFIG} --from-archive ${archive} --follow

ultrahook-image-openshift: ultrahook-manifests

deploy-ultrahook:
	oc -n ${NAMESPACE} apply   -f manifests/ultrahook/template.yaml
	oc -n ${NAMESPACE} process -f manifests/ultrahook/template.yaml \
		-p ULTRAHOOK_API_KEY=${ULTRAHOOK_API_KEY} \
		-p ULTRAHOOK_SUBDOMAIN=${ULTRAHOOK_SUBDOMAIN} \
		-p ULTRAHOOK_TARGET_HOST=${ULTRAHOOK_TARGET_HOST} \
		-p ULTRAHOOK_TARGET_PORT=${ULTRAHOOK_TARGET_PORT} \
		| oc -n ${NAMESPACE} apply -f -

deploy-gateway:
	# apply all the manifests in the manifests/app folder
	oc -n ${NAMESPACE} apply   -f manifests/app/template.yaml
	oc -n ${NAMESPACE} process -f manifests/app/template.yaml \
		-p APPLICATION_NAME=${PACKAGE} \
		-p GITHUB_REF=${GITHUB_REF} \
		| oc -n ${NAMESPACE} apply -f -
