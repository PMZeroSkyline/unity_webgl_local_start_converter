// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const {ipcRenderer, contextBridge} = require('electron');



contextBridge.exposeInMainWorld('MY_API', {
  getUnityWebGLDir() {
    ipcRenderer.send('getUnityWebGLDir');
  },
  convert() {
    var unity_webgl_dir_input = document.getElementById('unity_webgl_dir_input');
    if(unity_webgl_dir_input.value == ''){
        ipcRenderer.send('showRemindInputMessage');
    }
    else{
        ipcRenderer.send('convert', unity_webgl_dir_input.value);
    }
  }
});

ipcRenderer.on('setUnityDir', (e, dir) => {
    var unity_webgl_dir_input = document.getElementById('unity_webgl_dir_input');
    if(typeof dir === 'undefined'){
        unity_webgl_dir_input.value = '';
    }else{
        unity_webgl_dir_input.value = dir;
    }
})
