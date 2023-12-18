---
name: Theia CR update
about: Update Theia to newest community release
---

<!-- Please replace the version below with the desired version. -->
# Update Theia to 1.XX.X

## Required Steps

- [ ] Merge latest Theia Blueprint community release commit
- [ ] if required: Update Theia to latest version of said community release
- [ ] Update all consumed Theia extensions and VSCode extensions
- [ ] Test Electron Blueprint locally
- [ ] Test packaged Electron Blueprint locally

After Merge

- [ ] Download a previous release and check that update to latest version completed successfully

Deploy to try.theia-cloud.io:

- [ ] Push built docker image to registry
- [ ] Update [deployment file](https://github.com/eclipsesource/theia-cloud/blob/main/demo/k8s/appdefinitions/cdt.yaml) to use newly pushed docker image
- [ ] Apply the [deployment file](https://github.com/eclipsesource/theia-cloud/blob/main/demo/k8s/appdefinitions/cdt.yaml) to the cluster
