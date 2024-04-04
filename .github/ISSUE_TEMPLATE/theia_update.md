---
name: CDT Cloud Blueprint update
about: Update CDT Cloud Blueprint to latest Theia Community release
---

<!-- Please replace the version below with the desired version. -->
Update and release aligned with Theia XX

## Required Steps

- [ ] Merge latest Theia Blueprint community release commit
- [ ] if required: Update Theia to latest version of said community release
- [ ] Update all consumed Theia extensions and VSCode extensions
- [ ] Test packaged Electron Blueprint locally
- [ ] Test Browser variant locally
- [ ] Test Docker variant locally
- [ ] Run E2E tests locally (https://github.com/eclipse-cdt-cloud/cdt-cloud-blueprint?tab=readme-ov-file#running-e2e-tests)

After Merge

- [ ] Verify that [Jenkins pipeline](https://ci.eclipse.org/theia/job/TheiaCDTCloud/job/master/) completed successfully
- [ ] [Download a previous release](https://download.eclipse.org/theia/cdt-cloud/) and check that update to latest version completes successfully

Deploy to try.theia-cloud.io:

- [ ] Push docker image with version tag to registry via [GH action](https://github.com/eclipse-cdt-cloud/cdt-cloud-blueprint/actions/workflows/publish-image.yml)
- [ ] Update [deployment file](https://github.com/eclipsesource/try-theia-cloud-deployment/blob/main/resources/appdefinitions/cdt.yaml) to use newly pushed docker image
- [ ] Apply the [deployment file](https://github.com/eclipsesource/try-theia-cloud-deployment/blob/main/resources/appdefinitions/cdt.yaml) to the cluster
- [ ] Verify that updated [CDT Cloud Blueprint Try Online](https://try.theia-cloud.io/?appDef=cdt-cloud-demo) is available and works

Release announcement:

- [ ] Announce release on the [cdt-cloud-dev](https://accounts.eclipse.org/mailing-list/cdt-cloud-dev) mailing list
