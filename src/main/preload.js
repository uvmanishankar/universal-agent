const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aiAgent', {
  // Core actions
  getContext: () => ipcRenderer.invoke('get-context'),
  captureScreen: (mode) => ipcRenderer.invoke('capture-screen', mode),
  runOCR: (imgPath) => ipcRenderer.invoke('run-ocr', imgPath),
  askLLM: (params) => ipcRenderer.invoke('ask-llm', params),
  getHistory: (limit) => ipcRenderer.invoke('get-history', limit),

  // Store
  getStore: (key) => ipcRenderer.invoke('get-store', key),
  setStore: (key, value) => ipcRenderer.invoke('set-store', key, value),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  hide: () => ipcRenderer.send('window-hide'),
  close: () => ipcRenderer.send('window-close'),

  // Event listeners (main → renderer)
  on: (channel, callback) => {
    const allowed = [
      'trigger-analyze', 'trigger-capture', 'trigger-refresh',
      'history-cleared', 'open-settings'
    ];
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
