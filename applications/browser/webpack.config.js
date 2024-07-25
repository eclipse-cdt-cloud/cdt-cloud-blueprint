/**
 * This file can be edited to customize webpack configuration.
 * To reset delete this file and rerun theia build again.
 */
// @ts-check
const configs = require('./gen-webpack.config.js');
const nodeConfig = require('./gen-webpack.node.config.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin')
const path = require('path');
const resolvePackagePath = require('resolve-package-path');

/**
 * Expose bundled modules on window.theia.moduleName namespace, e.g.
 * window['theia']['@theia/core/lib/common/uri'].
 * Such syntax can be used by external code, for instance, for testing.
configs[0].module.rules.push({
    test: /\.js$/,
    loader: require.resolve('@theia/application-manager/lib/expose-loader')
}); */

if (process.platform !== 'win32') {
    // For some reason, blueprint wants to bundle the `.node` files directly without going through `@vscode/windows-ca-certs`
    nodeConfig.ignoredResources.add('@vscode/windows-ca-certs/build/Release/crypt32.node');
}

// Copy example resources
const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                // copy examples to resource folder
                from: path.join(resolvePackagePath('@eclipse-cdt-cloud/blueprint-examples', __dirname), '..', 'resources'),
                to: path.resolve(__dirname, 'resources')
            }
        ]
    }),
    new CopyWebpackPlugin({
        patterns: [
            {
                context: path.resolve('.', '..', '..', 'applications', 'browser', 'ico'),
                from: '**'
            }
        ]
    }),
    new RemovePlugin({
        after: {
            test: [
                {
                    folder: path.resolve(__dirname, 'resources'),
                    method: (absoluteItemPath) => {
                        return new RegExp(/^.*\.gz$/).test(absoluteItemPath);
                    },
                    recursive: true
                }
            ]
        }
    })
]

configs[0].plugins.push(...plugins);

module.exports = [
    ...configs,
    nodeConfig.config
];