import { app, BrowserWindow } from "electron";
import path from "node:path";
import { bootstrapPersistence } from "./bootstrap";
import { registerIpcHandlers } from "./ipc";

const createMainWindow = async () => {
  await bootstrapPersistence();

  const window = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1360,
    minHeight: 840,
    backgroundColor: "#09090b",
    frame: process.platform === "darwin",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    vibrancy: "under-window",
    backgroundMaterial: "mica",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
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
  window.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const source = sourceId || "renderer";
    console.log(`[renderer:${level}] ${source}:${line} ${message}`);
  });
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[renderer:load-failed] ${errorCode} ${errorDescription} ${validatedURL}`);
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    console.error(`[renderer:gone] ${details.reason} exitCode=${details.exitCode}`);
  });
  window.webContents.on("did-finish-load", () => {
    console.log(`[renderer:loaded] ${window.webContents.getURL()}`);
  });

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
