const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

require("./database.cjs");

function createWindow() {
ipcMain.handle("ping", async () => {

    return "BookFlow Connected";

});
    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {

    preload: path.join(__dirname, "preload.cjs"),

    contextIsolation: true,

    nodeIntegration: false

}
    });

    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, "../dist/index.html"));
    } else {
        win.loadURL("http://localhost:3000");
    }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});