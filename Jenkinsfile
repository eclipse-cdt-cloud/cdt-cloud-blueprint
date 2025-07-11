/**
 * This Jenkinsfile builds CDT Cloud Blueprint across the major OS platforms
 */

/* groovylint-disable NestedBlockDepth */
import groovy.json.JsonSlurper

releaseBranch = "master"
distFolder = "applications/electron/dist"

toStashDist = "${distFolder}/**"
toStashDistInstallers = "${distFolder}/*"
// default folder to stash
toStash = toStashDistInstallers

// Attempt to detect whether a PR is Jenkins-related, by looking-for
// the word "jenkins" (case insensitive) in PR branch name and/or
// the PR title
jenkinsRelatedRegex = "(?i).*jenkins.*"

pipeline {
    agent none
    options {
        timeout(time: 5, unit: 'HOURS')
        disableConcurrentBuilds()
    }
    environment {
        BLUEPRINT_JENKINS_CI = 'true'

        // to save time and resources, we skip some release-related steps
        // when not in the process of releasing. e.g. signing/notarizing the
        // installers. It can sometimes be necessary to run these steps, e.g.
        // when troubleshooting. Set the variable below to 'true' to do so.
        // We will still stop short of publishing anything.
        BLUEPRINT_JENKINS_RELEASE_DRYRUN = 'false'
        // BLUEPRINT_JENKINS_RELEASE_DRYRUN = 'true'
        msvs_version = '2019'
        GYP_MSVS_VERSION = '2019'

        NODE_OPTIONS = '--max_old_space_size=4096'
    }
    stages {
        stage('Build') {
            when {
                anyOf {
                    expression {
                        env.JOB_BASE_NAME ==~ /$releaseBranch/
                    }
                    expression { 
                        env.CHANGE_BRANCH ==~ /$jenkinsRelatedRegex/
                    }
                    expression {
                        env.CHANGE_TITLE ==~ /$jenkinsRelatedRegex/
                    }
                    expression {
                        // PR branch? 
                        env.BRANCH_NAME ==~ /PR-(\d)+/
                    }
                    expression {
                        env.BLUEPRINT_JENKINS_RELEASE_DRYRUN == 'true'
                    }
                }
            }
            parallel {
                stage('Create Linux Installer') {
                    agent {
                        kubernetes {
                            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: theia-dev
    image: eclipsetheia/theia-blueprint:builder
    imagePullPolicy: Always
    command:
    - cat
    tty: true
    resources:
      limits:
        memory: "8Gi"
        cpu: "2"
      requests:
        memory: "8Gi"
        cpu: "2"
    volumeMounts:
    - name: global-cache
      mountPath: /.cache
    - name: global-yarn
      mountPath: /.yarn      
    - name: global-npm
      mountPath: /.npm      
    - name: electron-cache
      mountPath: /.electron-gyp
  volumes:
  - name: global-cache
    emptyDir: {}
  - name: global-yarn
    emptyDir: {}
  - name: global-npm
    emptyDir: {}
  - name: electron-cache
    emptyDir: {}
"""
                        }
                    }
                    steps {
                        container('theia-dev') {
                            withCredentials([string(credentialsId: "github-bot-token", variable: 'GITHUB_TOKEN')]) {
                                script {
                                    buildInstaller(120)
                                }
                            }
                        }
                        stash includes: "${toStash}", name: 'linux'
                    }
                    post {
                        failure {
                            error("Linux installer creation failed, aborting...")
                        }
                    }
                }
                stage('Create Mac Installer') {
                    agent {
                        label 'macos'
                    }
                    steps {
                        nodejs(nodeJSInstallationName: 'node_22.x') {
                            script {
                                buildInstaller(60)
                            }
                        }
                        stash includes: "${toStash}", name: 'mac'
                    }
                    post {
                        failure {
                            error("Mac installer creation failed, aborting...")
                        }
                    }
                }
                stage('Create Windows Installer') {
                    agent {
                        label 'windows'
                    }
                    options {
                        skipDefaultCheckout true
                    }
                    steps {
                        script {
                            // Pre-cleanup: Remove all potentially problematic directories from previous builds
                            bat """
                                echo "Cleaning up directories that may contain long paths from previous builds"
                                
                                if exist "tracecompass-server" (
                                    echo "Removing tracecompass-server directory"
                                    rmdir /s /q "tracecompass-server" 2>nul || echo "tracecompass-server removal completed"
                                )
                                
                                if exist "applications\\electron\\dist" (
                                    echo "Removing applications/electron/dist directory"
                                    rmdir /s /q "applications\\electron\\dist" 2>nul || echo "electron dist removal completed"
                                )
                                
                                if exist "applications\\electron\\node_modules" (
                                    echo "Removing applications/electron/node_modules directory"
                                    rmdir /s /q "applications\\electron\\node_modules" 2>nul || echo "electron node_modules removal completed"
                                )
                                
                                if exist "applications\\browser\\dist" (
                                    echo "Removing applications/browser/dist directory"
                                    rmdir /s /q "applications\\browser\\dist" 2>nul || echo "browser dist removal completed"
                                )
                                
                                if exist "applications\\browser\\node_modules" (
                                    echo "Removing applications/browser/node_modules directory"
                                    rmdir /s /q "applications\\browser\\node_modules" 2>nul || echo "browser node_modules removal completed"
                                )
                                
                                if exist "node_modules" (
                                    echo "Removing top-level node_modules directory"
                                    rmdir /s /q "node_modules" 2>nul || echo "top-level node_modules removal completed"
                                )
                                
                                echo "Cleanup completed"
                            """
                            
                            // Now do the regular checkout - this should work without issues
                            checkout scm
                        }
                        nodejs(nodeJSInstallationName: 'node_22.x') {
                            sh "node --version"
                            sh "npx node-gyp@9.4.1 install 22.15.1"

                            // analyze memory usage
                            bat "wmic ComputerSystem get TotalPhysicalMemory"
                            bat "wmic OS get FreePhysicalMemory"
                            bat "tasklist"

                            buildInstaller(60)
                        }
                        stash includes: "${toStash}", name: 'win'
                    }
                    post {
                        failure {
                            error("Windows installer creation failed, aborting...")
                        }
                    }
                }
            }
        }
        stage('Sign and Upload') {
            // only proceed when merging on the release branch or if the
            // PR seems Jenkins-related. Note: for PRs, we do not by default
            // run this stage since it will be of little practical value.
            when {
                anyOf {
                    expression {
                        env.JOB_BASE_NAME ==~ /$releaseBranch/
                    }
                    expression { 
                        env.CHANGE_BRANCH ==~ /$jenkinsRelatedRegex/
                    }
                    expression {
                        env.CHANGE_TITLE ==~ /$jenkinsRelatedRegex/
                    }
                    expression {
                        env.BLUEPRINT_JENKINS_RELEASE_DRYRUN == 'true'
                    }
                }
            }
            parallel {
                stage('Upload Linux') {
                    agent any
                    steps {
                        unstash 'linux'
                        script {
                            uploadInstaller('linux')
                        }
                    }
                }
                stage('Sign, Notarize and Upload Mac') {
                    stages {
                        stage('Sign and Notarize Mac') {
                            agent {
                                kubernetes {
                                    yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: theia-dev
    image: eclipsetheia/theia-blueprint:builder
    imagePullPolicy: Always
    command:
    - cat
    tty: true
    resources:
      limits:
        memory: "8Gi"
        cpu: "2"
      requests:
        memory: "8Gi"
        cpu: "2"
    volumeMounts:
    - name: global-cache
      mountPath: /.cache
    - name: global-yarn
      mountPath: /.yarn      
    - name: global-npm
      mountPath: /.npm      
    - name: electron-cache
      mountPath: /.electron-gyp
  - name: jnlp
    volumeMounts:
    - name: volume-known-hosts
      mountPath: /home/jenkins/.ssh
  volumes:
  - name: global-cache
    emptyDir: {}
  - name: global-yarn
    emptyDir: {}
  - name: global-npm
    emptyDir: {}
  - name: electron-cache
    emptyDir: {}
  - name: volume-known-hosts
    configMap:
      name: known-hosts
"""
                                }
                            }
                            steps {
                                unstash 'mac'
                                container('theia-dev') {
                                    withCredentials([string(credentialsId: "github-bot-token", variable: 'GITHUB_TOKEN')]) {
                                        script {
                                            signInstaller('dmg', 'mac')
                                            notarizeInstaller('dmg')
                                        }
                                    }
                                }
                                stash includes: "${toStash}", name: 'mac2'
                            }
                        }
                        stage('Recreate Zip with Ditto for correct file permissions') {
                            agent {
                                label 'macos'
                            }
                            steps {
                                unstash 'mac2'
                                nodejs(nodeJSInstallationName: 'node_22.x') {
                                    script {
                                        def packageJSON = readJSON file: "package.json"
                                        String version = "${packageJSON.version}"

                                        def notarizedDmg = "${distFolder}/CDTCloudBlueprint.dmg"

                                        // We'll mount and then copy the .app out of the DMG
                                        def mountPoint = "${distFolder}/CDTCloudBlueprint-mount"
                                        def extractedFolder = "${distFolder}/CDTCloudBlueprint-extracted"
                                        def rezippedFile = "${distFolder}/CDTCloudBlueprint-rezipped.zip"
                                        def finalZip = "${distFolder}/CDTCloudBlueprint-${version}-mac.zip"
                                        sh "rm -rf \"${extractedFolder}\" \"${mountPoint}\""
                                        sh "mkdir -p \"${extractedFolder}\" \"${mountPoint}\""
                                        sh "hdiutil attach \"${notarizedDmg}\" -mountpoint \"${mountPoint}\""

                                        // Copy the .app from the DMG to a folder we can zip
                                        sh "ditto \"${mountPoint}/CDTCloudBlueprint.app\" \"${extractedFolder}/CDTCloudBlueprint.app\""

                                        // Unmount the DMG
                                        sh "hdiutil detach \"${mountPoint}\""

                                        // Zip with ditto
                                        sh "ditto -c -k \"${extractedFolder}\" \"${rezippedFile}\""

                                        // Replace the old zip with the newly created one
                                        sh "rm -f \"${finalZip}\""
                                        sh "mv \"${rezippedFile}\" \"${finalZip}\""

                                        // Cleanup
                                        sh "rm -rf \"${extractedFolder}\" \"${mountPoint}\""
                                    }
                                }
                                stash includes: "${toStash}", name: 'mac3'
                            }
                        }
                        stage('Update Metadata and Upload Mac') {
                            agent {
                                kubernetes {
                                    yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: theia-dev
    image: eclipsetheia/theia-blueprint:builder
    imagePullPolicy: Always
    command:
    - cat
    tty: true
    resources:
      limits:
        memory: "8Gi"
        cpu: "2"
      requests:
        memory: "8Gi"
        cpu: "2"
    volumeMounts:
    - name: global-cache
      mountPath: /.cache
    - name: global-yarn
      mountPath: /.yarn      
    - name: global-npm
      mountPath: /.npm      
    - name: electron-cache
      mountPath: /.electron-gyp
  - name: jnlp
    volumeMounts:
    - name: volume-known-hosts
      mountPath: /home/jenkins/.ssh
  volumes:
  - name: global-cache
    emptyDir: {}
  - name: global-yarn
    emptyDir: {}
  - name: global-npm
    emptyDir: {}
  - name: electron-cache
    emptyDir: {}
  - name: volume-known-hosts
    configMap:
      name: known-hosts
"""
                                }
                            }
                            steps {
                                unstash 'mac3'
                                container('theia-dev') {
                                    withCredentials([string(credentialsId: "github-bot-token", variable: 'GITHUB_TOKEN')]) {
                                        script {
                                            def packageJSON = readJSON file: "package.json"
                                            String version = "${packageJSON.version}"
                                            updateMetadata('CDTCloudBlueprint-' + version + '-mac.zip', 'latest-mac.yml', 'macos', false, '.zip', 1200)
                                            updateMetadata('CDTCloudBlueprint.dmg', 'latest-mac.yml', 'macos', false, '.dmg', 1200)
                                        }
                                    }
                                }
                                container('jnlp') {
                                    script {
                                        uploadInstaller('macos')
                                    }
                                }
                            }
                        }
                    }
                }
                stage('Sign and Upload Windows') {
                    agent {
                        kubernetes {
                            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: theia-dev
    image: eclipsetheia/theia-blueprint:builder
    imagePullPolicy: Always
    command:
    - cat
    tty: true
    resources:
      limits:
        memory: "8Gi"
        cpu: "2"
      requests:
        memory: "8Gi"
        cpu: "2"
    volumeMounts:
    - name: global-cache
      mountPath: /.cache
    - name: global-yarn
      mountPath: /.yarn      
    - name: global-npm
      mountPath: /.npm      
    - name: electron-cache
      mountPath: /.electron-gyp
  - name: jnlp
    volumeMounts:
    - name: volume-known-hosts
      mountPath: /home/jenkins/.ssh
  volumes:
  - name: global-cache
    emptyDir: {}
  - name: global-yarn
    emptyDir: {}
  - name: global-npm
    emptyDir: {}
  - name: electron-cache
    emptyDir: {}
  - name: volume-known-hosts
    configMap:
      name: known-hosts
"""
                        }
                    }
                    steps {
                        unstash 'win'
                        container('theia-dev') {
                            withCredentials([string(credentialsId: "github-bot-token", variable: 'GITHUB_TOKEN')]) {
                                script {
                                    signInstaller('exe', 'windows')
                                    updateMetadata('CDTCloudBlueprintSetup.exe', 'latest.yml', 'windows', true, '.exe', 1200)
                                }
                            }
                        }
                        container('jnlp') {
                            script {
                                echo 'Computing updatable versions before uploading new installer'
                                def updatableVersions = getUpdatableVersions()
                                echo 'updatableVersions: ' + updatableVersions
                                uploadInstaller('windows')
                                copyInstallerAndUpdateLatestYml('windows', 'CDTCloudBlueprintSetup', 'exe', 'latest.yml', updatableVersions)
                            }
                        }
                    }
                }
            }
        }
    }
}

def buildInstaller(int sleepBetweenRetries) {
    int maxRetry = 1
    String buildPackageCmd

    checkout scm

    buildPackageCmd = 'yarn --network-timeout 100000 --frozen-lockfile --force && \
        yarn build:extensions'

    if (isRelease()) {
        // download tracecompass server for releases
        buildPackageCmd += ' && yarn tracecompass-server:download'
    }

    // only build the Electron app for now
    buildPackageCmd += ' && yarn electron build'

    if (isRelease()) {
        // when not a release, build dev to save time
        buildPackageCmd += ":prod"
    }

    sh 'node --version'
    sh 'printenv && yarn cache dir'
    try {
        sh(script: buildPackageCmd)
    } catch (error) {
        retry(maxRetry) {
            sleep(sleepBetweenRetries)
            echo 'yarn failed - Retrying'
            sh(script: buildPackageCmd)
        }
    }

    sshagent(['projects-storage.eclipse.org-bot-ssh']) {
        if (isRelease()) {
            sh 'yarn download:plugins && yarn electron package:prod'
        } else {
            // ATM the plugins are not useful for non-releases, so
            // let's skip ketching them
            sh 'yarn electron package:preview'
        }
    }
}

def signInstaller(String ext, String os) {
    if (!isRelease()) {
        echo "This is not a release, so skipping installer signing for branch ${env.BRANCH_NAME}"
        return
    }

    List installers = findFiles(glob: "${distFolder}/*.${ext}")

    // https://wiki.eclipse.org/IT_Infrastructure_Doc#Web_service
    if (os == 'mac') {
        url = 'https://cbi.eclipse.org/macos/codesign/sign'
    } else if (os == 'windows') {
        url = 'https://cbi.eclipse.org/authenticode/sign'
    } else {
        error("Error during signing: unsupported OS: ${os}")
    }

    if (installers.size() == 1) {
        sh "curl -o ${distFolder}/signed-${installers[0].name} -F file=@${installers[0].path} ${url}"
        sh "rm ${installers[0].path}"
        sh "mv ${distFolder}/signed-${installers[0].name} ${installers[0].path}"
    } else {
        error("Error during signing: installer not found or multiple installers exist: ${installers.size()}")
    }
}

def notarizeInstaller(String ext) {
    if (!isRelease()) {
        echo "This is not a release, so skipping installer notarizing for branch ${env.BRANCH_NAME}"
        return
    }

    String service = 'https://cbi.eclipse.org/macos/xcrun'
    List installers = findFiles(glob: "${distFolder}/*.${ext}")

    if (installers.size() == 1) {
        String response = sh(script: "curl -X POST -F file=@${installers[0].path} -F \'options={\"primaryBundleId\": \"cdtcloud.blueprint\", \"staple\": true};type=application/json\' ${service}/notarize", returnStdout: true)

        def jsonSlurper = new JsonSlurper()
        def json = jsonSlurper.parseText(response)
        String uuid = json.uuid

        while(json.notarizationStatus.status == 'IN_PROGRESS') {
            sh "sleep 60"
            response = sh(script: "curl ${service}/${uuid}/status", returnStdout: true)
            json = jsonSlurper.parseText(response)
        }

        if (json.notarizationStatus.status != 'COMPLETE') {
            error("Failed to notarize ${installers[0].name}: ${response}")
        }

        sh "curl -o ${distFolder}/stapled-${installers[0].name} ${service}/${uuid}/download"
        sh "rm ${installers[0].path}"
        sh "mv ${distFolder}/stapled-${installers[0].name} ${installers[0].path}"
    } else {
        error("Error during notarization: installer not found or multiple installers exist: ${installers.size()}")
    }
}

def updateMetadata(String executable, String yaml, String platform, Boolean updatePaths, String fileExtension, int sleepBetweenRetries) {
    if (!isRelease()) {
        echo "This is not a release, so skipping updating metadata for branch ${env.BRANCH_NAME}"
        return
    }

    int maxRetry = 4
    try {
        // make sure the npm dependencies are available to the update scripts
        sh "yarn install --force"
        sh "yarn electron update:blockmap -e ${executable}"
        sh "yarn electron update:checksum -e ${executable} -y ${yaml} -p ${platform} -u ${updatePaths} -f ${fileExtension}"
    } catch (error) {
        retry(maxRetry) {
            sleep(sleepBetweenRetries)
            echo "yarn failed - Retrying"
            sh "yarn install --force"
            sh "yarn electron update:blockmap -e ${executable}"
        sh "yarn electron update:checksum -e ${executable} -y ${yaml} -p ${platform} -u ${updatePaths} -f ${fileExtension}"
        }
    }
}

def uploadInstaller(String platform) {
    if (isReleaseBranch()) {
        def packageJSON = readJSON file: "package.json"
        String version = "${packageJSON.version}"
        sshagent(['projects-storage.eclipse.org-bot-ssh']) {
            sh "ssh genie.theia@projects-storage.eclipse.org rm -rf /home/data/httpd/download.eclipse.org/theia/cdt-cloud/${version}/${platform}"
            sh "ssh genie.theia@projects-storage.eclipse.org mkdir -p /home/data/httpd/download.eclipse.org/theia/cdt-cloud/${version}/${platform}"
            sh "scp ${distFolder}/*.* genie.theia@projects-storage.eclipse.org:/home/data/httpd/download.eclipse.org/theia/cdt-cloud/${version}/${platform}"
            sh "ssh genie.theia@projects-storage.eclipse.org rm -rf /home/data/httpd/download.eclipse.org/theia/cdt-cloud/latest/${platform}"
            sh "ssh genie.theia@projects-storage.eclipse.org mkdir -p /home/data/httpd/download.eclipse.org/theia/cdt-cloud/latest/${platform}"
            sh "scp ${distFolder}/*.* genie.theia@projects-storage.eclipse.org:/home/data/httpd/download.eclipse.org/theia/cdt-cloud/latest/${platform}"
        }
    } else {
        echo "Skipped upload for branch ${env.BRANCH_NAME}"
    }
}

/**
 * List all directories in the cdt-cloud directory. 
 * Only takes the ones with a version identifier name. 
 * Only take version numbers lower than the current version. 
 */
def getUpdatableVersions() {
    def packageJSON = readJSON file: "package.json"
    String currentVersion = "${packageJSON.version}"
    
    def versions = ''
    
    sshagent(['projects-storage.eclipse.org-bot-ssh']) {
        versions = sh(
            script: """
            ssh genie.theia@projects-storage.eclipse.org "cd /home/data/httpd/download.eclipse.org/theia/cdt-cloud/ && \
            find . -maxdepth 1 -type d -regex '.*/[0-9]+\\.[0-9]+\\.[0-9]+' -exec basename {} \\; | sort -V | awk -v curVer='${currentVersion}' '{
                if (\\\$1 != curVer && \\\$1 < curVer) print \\\$1
            }' | paste -sd ','"
            """,
            returnStdout: true
        ).trim()
    }
    
    return versions
}

/**
 * Currently we have the windows updater available twice with different names. 
 * We want to have a name without the versions for providing a stable download link. 
 * Due to a bug in the nsis-updater the downloaded exe for an update needs to have a different name than initially however.
 */
def copyInstallerAndUpdateLatestYml(String platform, String installer, String extension, String yaml, String UPDATABLE_VERSIONS) {
    if (isReleaseBranch()) {
        def packageJSON = readJSON file: "package.json"
        String version = "${packageJSON.version}"
        sshagent(['projects-storage.eclipse.org-bot-ssh']) {
            sh "ssh genie.theia@projects-storage.eclipse.org cp /home/data/httpd/download.eclipse.org/theia/cdt-cloud/latest/${platform}/${installer}.${extension} /home/data/httpd/download.eclipse.org/theia/cdt-cloud/latest/${platform}/${installer}-${version}.${extension}"
        }
        if (UPDATABLE_VERSIONS.length() != 0) {
            for (oldVersion in UPDATABLE_VERSIONS.split(",")) {
                sshagent(['projects-storage.eclipse.org-bot-ssh']) {
                    sh "ssh genie.theia@projects-storage.eclipse.org rm -f /home/data/httpd/download.eclipse.org/theia/cdt-cloud/${oldVersion}/${platform}/${yaml}"
                    sh "ssh genie.theia@projects-storage.eclipse.org cp /home/data/httpd/download.eclipse.org/theia/cdt-cloud/${version}/${platform}/${yaml} /home/data/httpd/download.eclipse.org/theia/cdt-cloud/${oldVersion}/${platform}/${yaml}"
                }
            }
        } else {
            echo "No updateable versions"
        }
    } else {
        echo "Skipped copying installer for branch ${env.BRANCH_NAME}"
    }
}

def isReleaseBranch() {
    return (env.BRANCH_NAME == releaseBranch)
}

def isDryRunRelease() {
    return env.BLUEPRINT_JENKINS_RELEASE_DRYRUN == 'true'
}

def isRelease() {
    return isDryRunRelease() || isReleaseBranch()
}
