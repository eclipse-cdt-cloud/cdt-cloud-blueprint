<br/>
<div id="cdt-cloud-logo" align="center">
    <br />
    <img src="resources/CDTCloudBlueprintLogo.svg" alt="CDT Cloud Blueprint Logo"/>
    <h3>CDT Cloud Blueprint</h3>
</div>

<div id="badges" align="center">

CDT Cloud Blueprint is a template for building custom web-based C/C++ tools. It is made up of existing open source components and can be easily downloaded and installed on all major operating system platforms.

</div>

[Visit the CDT Cloud website for more information](https://www.eclipse.org/cdt-cloud/).

## License

- [Eclipse Public License 2.0](LICENSE)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](LICENSE)

## What is this?

CDT Cloud Blueprint is a template for building custom web-based C/C++ tools. It is made up of existing open source components and can be easily downloaded and installed on all major operating system platforms.

## What is it not?

CDT Cloud Blueprint is ***not*** **a production-ready product**. Therefore, it is also not meant to be a replacement for Visual Studio Code or any other IDE.

## Current state

CDT Cloud Blueprint is in an early alpha state and undergoing active development.
See [this milestone for release 1.0](https://github.com/eclipse-cdt-cloud/cdt-cloud-blueprint/milestone/1).

## Development

CDT Cloud Blueprint is based on [Eclipse Theia Blueprint](https://github.com/eclipse-theia/theia-blueprint).

### Requirements

Please check Theia's [prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites), and keep node versions aligned between CDT Cloud Blueprint and that of the referenced Theia version.

### Documentation

Documentation on how to package Theia as a Desktop Product may be found [here](https://theia-ide.org/docs/blueprint_documentation/)

### Repository Structure

- Root level configures mono-repo build with lerna
- `applications` groups the different app targets
  - `browser` contains a browser based version of Eclipse Theia Blueprint that may be packaged as a Docker image
  - `electron` contains the electron app to package, packaging configuration, and E2E tests for the electron target.
- `theia-extensions` groups the various custom theia extensions for Blueprint
  - `product` contains a Theia extension contributing the product branding (about dialogue and welcome page).
  - `updater` contains a Theia extension contributing the update mechanism and corresponding UI elements (based on the electron updater).
  - `launcher` contains a Theia extension contributing, for AppImage applications, the option to create a script that allows to start blueprint from the command line by calling the 'theia' command.

### Build

#### Downloading dependencies

To prepare the workspace the dependencies, plugins and the trace-compass server need to be downloaded.

```sh
yarn
```

```sh
yarn download:plugins
```

```sh
yarn tracecompass-server:download
```

#### Build all applications

Build the sources and all three application (browser, docker and electron).

For development and casual testing of Blueprint, one can build it in "dev" mode. This permits building Blueprint on systems with less resources, like a Raspberry Pi 4B with 4GB of RAM.

```sh
# Build "dev" version of the Blueprint app. Its quicker, uses less resources, 
# but the front end app is not "minified"
yarn build:dev
```

Production Blueprint applications:

```sh
# Build production version of the Blueprint app
yarn build
```

#### Build & run electron application

```sh
yarn build:extensions
yarn electron build
```

The electron app may be started with

```sh
yarn electron start
```

##### Package the electron application

ATM we only produce packages for the Electron application.

```sh
yarn build:extensions
yarn package:applications
# or (if the trace-compass server was already downloaded)
yarn electron package
```

The packaged application is located in `applications/electron/dist`.

##### Create a Preview Electron Application (without packaging it)

```sh
yarn build:extensions
yarn package:applications:preview
# or (if the trace-compass server was already downloaded)
yarn electron package:preview
```

The packaged application is located in `applications/electron/dist`.

#### Build & run browser application

```sh
yarn build:extensions
yarn browser build
```

The browser app may be started with

```sh
yarn browser start
```

The application is then available at <http://localhost:3000/>

#### Build & run Docker image

To build a fully functioning Docker image run:

```sh
docker build -t cdt-cloud-blueprint:latest .
```

To start the created image run:

```sh
docker run -it -p 0.0.0.0:3000:3000 cdt-cloud-blueprint:latest
```

The application is then available at <http://localhost:3000/>

### Docker based development

1. Install the [Remote Dev extension pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) in VS Code
2. Open this repository in VS Code
3. In the notification that should appear: confirm to open this folder in the remote container instead
4. Once VS Code is opened in the container and the `Configuring Dev Container` task is finished, run `yarn browser start` in the container's terminal to start the CDT Cloud blueprint backend.
5. Once CDT Cloud blueprint is up, it should be running on 127.0.0.1:3000 and can be accessed from the host.

Now you can make changes to the source code and rebuild with `yarn build:extensions && yarn browser build` or run `yarn watch` before the changes. After a browser refresh, your changes should get effective.

#### Running E2E Tests

The E2E tests basic UI tests of the actual application.
This is done based on the preview of the packaged application.

```sh
yarn electron package:preview
yarn electron test
```

### Workspace and example files

- To use the trace view, download and start the [TraceCompassServer](https://download.eclipse.org/tracecompass.incubator/trace-server/rcp/)
- Example traces can be found here: [TraceCompassTutorialTraces](https://github.com/tuxology/tracevizlab/blob/master/labs/TraceCompassTutorialTraces.tgz)
- An example workspace including a trace can be found [here](https://github.com/eclipsesource/cdtcloud-alpha/tree/master/example/workspace)
- Clangd contexts also provides an example workspace, see [here](https://github.com/eclipse-cdt-cloud/clangd-contexts/tree/main/examples/clangd-workspace).

### Troubleshooting

- [_"Don't expect that you can build app for all platforms on one platform."_](https://www.electron.build/multi-platform-build)

### Reporting Feature Requests and Bugs

The features in CDT Cloud Blueprint are based on Theia and the included extensions/plugins. For bugs in Theia please consider opening an issue in the [Theia project on Github](https://github.com/eclipse-theia/theia/issues/new/choose).
CDT Cloud Blueprint only packages existing functionality into a product and installers for the product. If you believe there is a mistake in packaging, something needs to be added to the packaging or the installers do not work properly, please [open an issue on Github](https://github.com/eclipse-cdt-cloud/cdt-cloud-blueprint/issues/new/choose) to let us know.
