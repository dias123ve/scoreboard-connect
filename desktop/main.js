// Fokus Harian untuk desktop: membungkus fokus-harian/index.html dengan Electron.
//
// Kenapa timer di browser sering "tidak jalan": tab yang tidak aktif dicekik
// (setInterval jadi 1x per detik, lalu 1x per menit), atau dibekukan/dibuang
// oleh penghemat memori. Di sini halaman tidak pernah dicekik, komputer tidak
// boleh menidurkan aplikasi selama timer jalan, dan proses utama ikut
// menjaga jam sendiri sehingga notifikasi tetap muncul walau halaman macet.
const { app, BrowserWindow, Menu, Notification, dialog, ipcMain, powerMonitor, powerSaveBlocker, shell } = require("electron");
const path = require("path");

const WEB_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "web", "fokus-harian")
  : path.join(__dirname, "..", "fokus-harian");
const PAGE = path.join(WEB_DIR, "index.html");
const ICON = path.join(__dirname, "build", "icon.png");

// Bunyi selesai tidak boleh menunggu klik pengguna (mis. setelah timer dipulihkan).
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
// Jangan ikut menidurkan renderer saat jendela tertutup/terhalang.
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

if (process.platform === "win32") app.setAppUserModelId("id.fokusharian.desktop");

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
}

let win = null;

/* ---------- Timer (proses utama) ---------- */
// State dikirim oleh halaman setiap kali timer berubah. Proses utama hanya
// menghitung mundur dari jam (endAt), jadi tidak terpengaruh tidur/sleep.
const timer = { endAt: null, minutes: 25, blocker: null, notifiedAt: 0 };
let tick = null;

function armTimer(endAt, minutes) {
  timer.endAt = endAt;
  timer.minutes = minutes;
  if (endAt) {
    if (timer.blocker === null) timer.blocker = powerSaveBlocker.start("prevent-app-suspension");
    if (!tick) tick = setInterval(checkTimer, 1000);
    checkTimer();
  } else {
    disarmTimer();
  }
}

function disarmTimer() {
  timer.endAt = null;
  clearInterval(tick);
  tick = null;
  if (timer.blocker !== null) {
    powerSaveBlocker.stop(timer.blocker);
    timer.blocker = null;
  }
  if (win && !win.isDestroyed()) win.setProgressBar(-1);
}

function checkTimer() {
  if (!timer.endAt) return;
  const left = timer.endAt - Date.now();
  if (left <= 0) return complete();
  if (win && !win.isDestroyed()) {
    const total = timer.minutes * 60 * 1000;
    win.setProgressBar(Math.min(1, Math.max(0, 1 - left / total)));
  }
}

function complete() {
  disarmTimer();
  // Halaman dan proses utama bisa sama-sama melaporkan selesai; tampilkan sekali.
  if (Date.now() - timer.notifiedAt < 10000) return;
  timer.notifiedAt = Date.now();
  if (Notification.isSupported()) {
    const n = new Notification({
      title: "Waktu habis!",
      body: `Sesi fokus ${timer.minutes} menit selesai. Saatnya istirahat sebentar.`,
      icon: ICON,
    });
    n.on("click", () => {
      if (!win) return;
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    });
    n.show();
  }
  if (win && !win.isDestroyed()) win.flashFrame(true);
}

const validMinutes = (m) => m === 25 || m === 50;

ipcMain.on("timer:set", (e, endAt, minutes) => {
  if (!win || e.sender !== win.webContents) return;
  if (!validMinutes(minutes)) return;
  if (endAt !== null && !(typeof endAt === "number" && Number.isFinite(endAt))) return;
  armTimer(endAt, minutes);
});

ipcMain.on("timer:done", (e, minutes) => {
  if (!win || e.sender !== win.webContents) return;
  if (!validMinutes(minutes)) return;
  timer.minutes = minutes;
  complete();
});

/* ---------- Jendela ---------- */
function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 360,
    minHeight: 560,
    title: "Fokus Harian",
    icon: ICON,
    backgroundColor: "#f3f5f7",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  win.loadFile(PAGE);

  // Judul jendela mengikuti document.title ("12:34 · Fokus Harian"), jadi sisa
  // waktu terlihat di taskbar.

  // Halaman ini tidak punya tautan keluar; apa pun yang bukan halaman sendiri
  // dibuka di browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (url.startsWith("file://")) {
      const target = decodeURIComponent(new URL(url).pathname);
      if (path.resolve(target).startsWith(path.resolve(WEB_DIR))) return;
    }
    e.preventDefault();
    if (/^https?:/.test(url)) shell.openExternal(url);
  });

  // Tutup jendela saat timer jalan = timer ikut mati; tanyakan dulu.
  win.on("close", (e) => {
    if (!timer.endAt) return;
    const choice = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["Lanjutkan timer", "Tutup dan hentikan"],
      defaultId: 0,
      cancelId: 0,
      title: "Timer masih berjalan",
      message: "Timer pomodoro masih berjalan.",
      detail: "Kalau aplikasi ditutup, kamu tidak akan diberi tahu saat waktunya habis.",
    });
    if (choice === 0) e.preventDefault();
  });
  win.on("closed", () => {
    disarmTimer();
    win = null;
  });
}

function buildMenu() {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);
    return;
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { role: "appMenu" },
    { role: "editMenu" },
    { role: "windowMenu" },
  ]));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  // Setelah laptop bangun dari sleep, periksa lagi segera, jangan tunggu detik berikutnya.
  powerMonitor.on("resume", checkTimer);
  app.on("activate", () => { if (!win) createWindow(); });
});

app.on("window-all-closed", () => app.quit());
