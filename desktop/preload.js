// Jembatan sempit antara halaman dan proses utama: hanya dua pesan timer.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  // endAt: waktu selesai (ms epoch) saat timer jalan, atau null saat berhenti/jeda.
  setTimer: (endAt, minutes) => ipcRenderer.send("timer:set", endAt, minutes),
  // Halaman sudah mencapai nol.
  timerDone: (minutes) => ipcRenderer.send("timer:done", minutes),
});
