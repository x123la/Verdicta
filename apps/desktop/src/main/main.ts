import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bootstrapPersistence } from "./bootstrap";
import { registerIpcHandlers } from "./ipc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createMainWindow = async () => {
  await bootstrapPersistence();

  const window = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1360,
    minHeight: 840,
    backgroundColor: "#111315",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: true
    }
  });

  registerIpcHandlers(window);
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  if (process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await window.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
};

app.whenReady().then(createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createMainWindow();
  }
});
