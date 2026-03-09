/**
 * Patches the vscode-trace-extension's bundled extension.js with diagnostic logging.
 *
 * This script instruments the minified JS at key points so we can see in the browser
 * console exactly what URLs the extension resolves, when health checks happen, and
 * what they return. Filter for [TRACE-DEBUG] in browser dev tools.
 *
 * Usage: node patch-trace-extension-logging.js <path-to-extension.js>
 */
'use strict';

const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: node patch-trace-extension-logging.js <path-to-extension.js>');
    process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
let patchCount = 0;

function applyPatch(name, search, replacement) {
    const idx = content.indexOf(search);
    if (idx === -1) {
        console.error('ERROR: Pattern not found for patch "' + name + '"');
        console.error('  Searched for: ' + JSON.stringify(search).slice(0, 120) + '...');
        process.exit(1);
    }
    // Verify unique match
    const secondIdx = content.indexOf(search, idx + 1);
    if (secondIdx !== -1) {
        console.error('ERROR: Multiple matches found for patch "' + name + '" (expected exactly 1)');
        process.exit(1);
    }
    content = content.replace(search, replacement);
    patchCount++;
    console.log('  Patched: ' + name);
}

console.log('Patching ' + filePath + ' with diagnostic logging...');

// Patch 1: Log URL resolution in getExternalUriFromUserSettings
// Keep asExternalUri in place to observe what it transforms.
// Original: return e.env.asExternalUri(i)}
// Patched: wraps in console.log + .then() to log input and output
applyPatch(
    'getExternalUriFromUserSettings',
    'return e.env.asExternalUri(i)}',
    'return (console.log("[TRACE-DEBUG] getExternalUri clientType="+a+" prefUrl="+p+" parsed="+i.toString()),' +
    'e.env.asExternalUri(i).then(function(r){return console.log("[TRACE-DEBUG] asExternalUri result="+r.toString()),r}))}'
);

// Patch 2: Log final TSP client URLs in updateTspClientUrl
applyPatch(
    'updateTspClientUrl',
    'b?b.updateTspClientUrl(y):b=new v.g(y,void 0)',
    'console.log("[TRACE-DEBUG] updateTspClientUrl: BE_root="+w+" BE_url="+y+" FE_root="+g+" FE_url="+_),' +
    'b?b.updateTspClientUrl(y):b=new v.g(y,void 0)'
);

// Patch 3: Log health check results in isTraceServerUp
applyPatch(
    'isTraceServerUp',
    'async function $(){var a;const t=await T().checkHealth(),p=null===(a=t.getModel())||void 0===a?void 0:a.status,d=t.isOk()&&"UP"===p;return',
    'async function $(){var a;const t=await T().checkHealth(),p=null===(a=t.getModel())||void 0===a?void 0:a.status,d=t.isOk()&&"UP"===p;' +
    'console.log("[TRACE-DEBUG] isTraceServerUp: isOk="+t.isOk()+" status="+p+" serverUp="+d);return'
);

// Patch 4: Log the health check URL in checkHealth (in bundled tsp-typescript-client)
applyPatch(
    'checkHealth URL',
    'this.baseUrl+"/health";return',
    'this.baseUrl+"/health";console.log("[TRACE-DEBUG] checkHealth URL="+e);return'
);

fs.writeFileSync(filePath, content);
console.log('Successfully applied ' + patchCount + ' diagnostic patches.');
