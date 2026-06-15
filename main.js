// =============================================================================
//  Eco-système — processus principal Electron
//  Fenêtre + menu (raccourcis clavier) + routage des liens "nouvelle fenêtre" :
//    - sous-domaine *.care-planner.org  -> nouvel onglet (session partagée)
//    - lien externe                     -> navigateur système
// =============================================================================
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const APP_HOST = 'care-planner.org';

function isInternal(url) {
  try {
    const h = new URL(url).hostname;
    return h === APP_HOST || h.endsWith('.' + APP_HOST);
  } catch { return false; }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1F2933',
    autoHideMenuBar: true,
    title: 'Eco-système',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// Envoie une action de menu au renderer actif
function sendMenu(action, arg) {
  const w = BrowserWindow.getFocusedWindow() || mainWindow;
  if (w) w.webContents.send('menu', action, arg);
}

function buildMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        { label: 'Nouvel onglet', accelerator: 'CmdOrCtrl+T', click: () => sendMenu('new-tab') },
        { label: "Fermer l'onglet", accelerator: 'CmdOrCtrl+W', click: () => sendMenu('close-tab') },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' },
      ],
    },
    {
      label: 'Navigation',
      submenu: [
        { label: 'Précédent', accelerator: 'Alt+Left', click: () => sendMenu('back') },
        { label: 'Suivant', accelerator: 'Alt+Right', click: () => sendMenu('forward') },
        { label: 'Recharger', accelerator: 'F5', click: () => sendMenu('reload') },
        { label: 'Recharger ', accelerator: 'CmdOrCtrl+R', visible: false, click: () => sendMenu('reload') },
        { label: 'Accueil', accelerator: 'Alt+Home', click: () => sendMenu('home') },
        { type: 'separator' },
        { label: 'Onglet suivant', accelerator: 'Control+Tab', click: () => sendMenu('cycle', 1) },
        { label: 'Onglet précédent', accelerator: 'Control+Shift+Tab', click: () => sendMenu('cycle', -1) },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'togglefullscreen', label: 'Plein écran' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Intercepte window.open / target="_blank" de chaque webview
app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      if (isInternal(url)) {
        const w = BrowserWindow.getFocusedWindow() || mainWindow;
        if (w) w.webContents.send('open-tab', url);
      } else {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
  }
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
