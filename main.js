const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const si = require("systeminformation");
const path = require("path");

ipcMain.handle("getScreendata", async () => {
    return await new Promise(resolve => {
        si.graphics(data => {
            const screeninfo = data.displays.map(screen => {
                return {
                    x: screen.positionX,
                    y: screen.positionY,
                    w: screen.resolutionX,
                    h: screen.resolutionY,
                };
            });
            let maxX = 0;
            let minX = 0;
            let maxY = 0;
            let minY = 0;
            screeninfo.forEach(screen => {
                if (screen.x + screen.w > maxX) maxX = screen.x + screen.w;
                if (screen.x < minX) minX = screen.x;
                if (screen.y + screen.h > maxY) maxY = screen.y + screen.h;
                if (screen.y < minY) minY = screen.y;
            });
            screeninfo.forEach(screen => {
                screen.x -= minX;
                screen.y -= minY;
            });
            const totalw = maxX - minX;
            const totalh = maxY - minY;
            resolve({ screeninfo, w: totalw, h: totalh });
        });
    });
});

ipcMain.handle("getimg", () => {
    return dialog.showOpenDialogSync({
        title: "select a image file",
        filters: [
            { name: "Images", extensions: ["jpg", "jpeg", "png", "gif"] },
        ],
        properties: ["openFile"],
    });
});

ipcMain.handle("save", async () => {
    return dialog.showSaveDialogSync({
        title: "save wallpapers",
        filters: [{ name: "Images", extensions: ["png"] }],
    });
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    mainWindow.loadFile("page/index.html");
    mainWindow.setMenuBarVisibility(false);
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});
