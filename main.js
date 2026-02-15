const { app, BrowserWindow } = require("electron");

function createWindow() {
  const win = new BrowserWindow({
    width: 520,
    height: 720,
    minWidth: 360,
    minHeight: 560,
    resizable: true,
    minimizable: true,
    backgroundColor: "#0b0e1a",
    webPreferences: { nodeIntegration: false }
  });
  win.loadFile("index.html");
}
app.whenReady().then(createWindow);
