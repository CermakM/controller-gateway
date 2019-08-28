# controller-gateway
To make our lives easier


## About

This gateway implements a versatile manager which routes to the controllers. Each controller has a separate functionality and reconciliation strategy.

#### Controllers

**[Trello Controller](/src/controllers/trello/main.ts)**

**Functionality**: Trello webhook receiver and board reconciler, extensible with plugins

Plugins are scripts executed in a `vm` sandbox in restricted environment, being provided the Trello client, the request for reconciliation and some additional context.

**Active plugins**:

- [Story Point reconciler](/plugins/story_point_reconciler.js)

    Watches for changes in story points and update the board accordingly.

## Deployment

#### PREREQUISITES

1) [Trello](https://trello.com/) account

Next, follow the Trello documentation to get your [API key](https://trello.com/app-key).

2) [Ultrahook](http://www.ultrahook.com/) account

#### Procedure

```bash
# create .makerc file with your environment configuration
# for example:
cat .makerc <<-EOF
export NAMESPACE=myproject
export ULTRAHOOK_TARGET_HOST=localhost
export ULTRAHOOK_TARGET_PORT=5000
export ULTRAHOOK_API_KEY=...  # or have your api key in ~/.ultrahook
EOF

# provide the trello secrets
oc create secret generic trello-secret \ 
    --from-literal=api_key=${TRELLO_API_KEY}  \
    --from-literal=token=${TRELLO_TOKEN}

# deploys manifests
make deploy
# triggers builds
make build-openshift
```

---

Author: Marek Cermak &lt;macermak@redhat.com&gt; @AICoE