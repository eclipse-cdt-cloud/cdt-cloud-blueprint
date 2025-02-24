const path = require('path');
const os = require('os');

// Update to override the supported VS Code API version.
// process.env.VSCODE_API_VERSION = '1.50.0'

// Use a set of builtin plugins in our application.
process.env.THEIA_DEFAULT_PLUGINS = `local-dir:${path.resolve(__dirname, '../', 'plugins')}`;

// Handover to the auto-generated electron application handler.
require('../lib/backend/electron-main.js');
