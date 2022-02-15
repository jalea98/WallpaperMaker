const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");

contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);
contextBridge.exposeInMainWorld("saveimg", (path, arraybuffer) => {
    const wallpaperbuffer = new Buffer.from(arraybuffer);
    fs.writeFileSync(path, wallpaperbuffer, "binary");
});
