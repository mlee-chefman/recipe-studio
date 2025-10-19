
// Initialize some variables before react-native code would access them
var onmessage=null, self=global;
// Cache Node's original require as __debug__.require
global.__debug__={require: require};
// Prevent leaking process.versions from debugger process to
// worker because pure React Native doesn't do that and some packages as js-md5 rely on this behavior
Object.defineProperty(process, "versions", {
    value: undefined
});
// TODO: Replace by url.fileURLToPath method when Node 10 LTS become deprecated
function fileUrlToPath(url) {
  if (process.platform === 'win32') {
      return url.toString().replace('file:///', '');
  } else {
    return url.toString().replace('file://', '');
  }
}
function getNativeModules() {
    var NativeModules;
    try {
        // This approach is for old RN versions
        NativeModules = global.require('NativeModules');
    } catch (err) {
        // ignore error and try another way for more recent RN versions
        try {
            var nativeModuleId;
            var modules = global.__r.getModules();
            var ids = Object.keys(modules);
            for (var i = 0; i < ids.length; i++) {
              if (modules[ids[i]].verboseName) {
                 var packagePath = new String(modules[ids[i]].verboseName);
                 if (packagePath.indexOf('Libraries/BatchedBridge/NativeModules.js') > 0 || packagePath.indexOf('Libraries\\BatchedBridge\\NativeModules.js') > 0) {
                   nativeModuleId = parseInt(ids[i], 10);
                   break;
                 }
              }
            }
          if (nativeModuleId) {
            NativeModules = global.__r(nativeModuleId);
          }
        }
        catch (err) {
            // suppress errors
        }
    }
    return NativeModules;
}
// Originally, this was made for iOS only
var vscodeHandlers = {
    'vscode_reloadApp': function () {
        var NativeModules = getNativeModules();
        if (NativeModules && NativeModules.DevSettings) {
            NativeModules.DevSettings.reload();
        }
    },
    'vscode_showDevMenu': function () {
        var NativeModules = getNativeModules();
        if (NativeModules && NativeModules.DevMenu) {
            NativeModules.DevMenu.show();
        }
    }
};
process.on("message", function (message) {
    if (message.data && vscodeHandlers[message.data.method]) {
        vscodeHandlers[message.data.method]();
    } else if(onmessage) {
        onmessage(message);
    }
});
var postMessage = function(message){
    process.send(message);
};
if (!self.postMessage) {
    self.postMessage = postMessage;
}
var importScripts = (function(){
    var fs=require('fs'), vm=require('vm');
    return function(scriptUrl){
        scriptUrl = fileUrlToPath(scriptUrl);
        var scriptCode = fs.readFileSync(scriptUrl, 'utf8');
        // Add a 'debugger;' statement to stop code execution
        // to wait for the sourcemaps to be processed by the debug adapter
        vm.runInThisContext('debugger;' + scriptCode, {filename: scriptUrl});
    };
})();

// Worker is ran as nodejs process, so console.trace() writes to stderr and it leads to error in native app
// To avoid this console.trace() is overridden to print stacktrace via console.log()
// Please, see Node JS implementation: https://github.com/nodejs/node/blob/master/lib/internal/console/constructor.js
console.trace = (function() {
    return function() {
        try {
            var err = {
                name: 'Trace',
                message: require('util').format.apply(null, arguments)
                };
            // Node uses 10, but usually it's not enough for RN app trace
            Error.stackTraceLimit = 30;
            Error.captureStackTrace(err, console.trace);
            console.log(err.stack);
        } catch (e) {
            console.error(e);
        }
    };
})();

// As worker is ran in node, it breaks broadcast-channels package approach of identifying if it’s ran in node:
// https://github.com/pubkey/broadcast-channel/blob/master/src/util.js#L64
// To avoid it if process.toString() is called if will return empty string instead of [object process].
var nativeObjectToString = Object.prototype.toString;
Object.prototype.toString = function() {
    if (this === process) {
        return '';
    } else {
        return nativeObjectToString.call(this);
    }
};


{"id":"97ac674f-bba6-4116-93bf-9988d3dcf7e1","createdAt":"2025-10-19T20:20:26.599Z","runtimeVersion":"exposdk:53.0.0","launchAsset":{"key":"bundle","contentType":"application/javascript","url":"http://127.0.0.1:8081/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable"},"assets":[],"metadata":{},"extra":{"eas":{},"expoClient":{"name":"recipe-studio","slug":"recipe-studio","version":"1.0.0","web":{"favicon":"./assets/favicon.png"},"experiments":{"tsconfigPaths":true},"plugins":[],"orientation":"portrait","icon":"./assets/icon.png","userInterfaceStyle":"light","splash":{"image":"./assets/splash.png","resizeMode":"contain","backgroundColor":"#ffffff","imageUrl":"http://127.0.0.1:8081/assets/./assets/splash.png"},"assetBundlePatterns":["**/*"],"ios":{"supportsTablet":true,"bundleIdentifier":"com.anonymous.recipestudio"},"android":{"adaptiveIcon":{"foregroundImage":"./assets/adaptive-icon.png","backgroundColor":"#ffffff","foregroundImageUrl":"http://127.0.0.1:8081/assets/./assets/adaptive-icon.png"},"package":"com.anonymous.recipestudio"},"_internal":{"isDebug":false,"projectRoot":"/Users/thomas.chan/Desktop/Projects/MH/recipe-studio","dynamicConfigPath":null,"staticConfigPath":"/Users/thomas.chan/Desktop/Projects/MH/recipe-studio/app.json","packageJsonPath":"/Users/thomas.chan/Desktop/Projects/MH/recipe-studio/package.json"},"sdkVersion":"53.0.0","platforms":["ios","android"],"iconUrl":"http://127.0.0.1:8081/assets/./assets/icon.png","hostUri":"127.0.0.1:8081"},"expoGo":{"debuggerHost":"127.0.0.1:8081","developer":{"tool":"expo-cli","projectRoot":"/Users/thomas.chan/Desktop/Projects/MH/recipe-studio"},"packagerOpts":{"dev":true},"mainModuleName":"node_modules/expo/AppEntry","__flipperHack":"React Native packager is running"},"scopeKey":"@anonymous/recipe-studio-198fdaa5-1a45-4da2-91e2-000b5c166ed8"}}
// Notify debugger that we're done with loading
// and started listening for IPC messages
postMessage({workerLoaded:true});