const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
//const prettier = require('prettier');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  Menu.setApplicationMenu(null);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.on('getUnityWebGLDir', (e, data) => {
  var dir = dialog.showOpenDialogSync({properties : ['openDirectory']});
  e.reply('setUnityDir', dir);
})

ipcMain.on('showRemindInputMessage', (e, data) => {
  const options = {
    buttons : ['Ok'],
    title : 'Notice',
    message : 'Please select the UnityWebGL path first.'
  }
  dialog.showMessageBoxSync(null, options, (response) =>{})
})

ipcMain.on('convert', (e, dir) => {
  function get_hex(path){
    return fs.readFileSync(path, null).toString('hex');
  }
  
  var folderArr = dir.replace('\\', '/').split('/');
  var folderName = folderArr[folderArr.length - 1];

  var loaderPath = dir + `/Build/` + folderName + `.loader.js`
  var frameworkPath = dir + `/Build/` + folderName + `.framework.js`
  var dataPath = dir + `/Build/` + folderName + `.data`
  var wasmPath = dir + `/Build/` + folderName + `.wasm`

  const loaderText = fs.readFileSync(loaderPath, "utf8");
  const frameworkText = fs.readFileSync(frameworkPath, "utf8");
  
  const downloadDataText = `e(c[n],{method:"GET",companyName:c.companyName,productName:c.productName,control:"no-store",mode:r,onProgress:function(e){g(n,e)}}).then(function(e){return e.parsedBody}).catch(function(e){var r="Failed to download file "+c[n];"file:"==location.protocol?s(r+". Loading web pages via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host Unity content, or use the Unity Build and Run option.","error"):console.error(r)});`
  const inlineDataText = `new Promise((resolve, reject) => {var h = "` + get_hex(dataPath) +`";var u = new Uint8Array(h.length/2);for (var i=0;i<(h.length - 1);i+=2){ var s = h[i] + h[i+1];u[i/2] = parseInt(s, 16);}resolve(u);}).then(function (e){return e;});`;

  const getBinaryPromiseFuncText = `function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch==="function"&&!isFileURI(wasmBinaryFile)){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary(wasmBinaryFile)})}else{if(readAsync){return new Promise(function(resolve,reject){readAsync(wasmBinaryFile,function(response){resolve(new Uint8Array(response))},reject)})}}}return Promise.resolve().then(function(){return getBinary(wasmBinaryFile)})}`;
  const inlineGetBinaryPromiseFuncText = `function getBinaryPromise() {return new Promise((resolve, reject) => {var h = "` + get_hex(wasmPath) + `";var u = new Uint8Array(h.length / 2);for (var i = 0; i < h.length - 1; i += 2) {var s = h[i] + h[i + 1];u[i / 2] = parseInt(s, 16);}resolve(u);}).then(function (e) {return e;});}`;

  const instantiateAsyncFuncText = `function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&!isFileURI(wasmBinaryFile)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiationResult,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiationResult)})})}else{return instantiateArrayBuffer(receiveInstantiationResult)}}`;
  const inlineInstantiateAsyncFuncText = `function instantiateAsync() {return instantiateArrayBuffer(receiveInstantiationResult);}`;

  const inlineLoaderText = loaderText.replace(downloadDataText, inlineDataText);
  const inlineFrameworkText = frameworkText.replace(instantiateAsyncFuncText, inlineInstantiateAsyncFuncText).replace(getBinaryPromiseFuncText, inlineGetBinaryPromiseFuncText);

  //var formattedInlineLoaderText = prettier.format(inlineLoaderText, { semi: false, parser: "babel" });
  //var formattedInlineFrameworkText = prettier.format(inlineFrameworkText, { semi: false, parser: "babel" });

  fs.writeFileSync(loaderPath, inlineLoaderText);
  fs.writeFileSync(frameworkPath, inlineFrameworkText);
  fs.unlinkSync(dataPath);
  fs.unlinkSync(wasmPath);

  const options = {
    buttons : ['Ok'],
    title : 'Message',
    message : 'Conversion completed.'
  }
  dialog.showMessageBoxSync(null, options, (response) =>{})
})