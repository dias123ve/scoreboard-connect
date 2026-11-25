# Fokus Harian untuk desktop

Aplikasi desktop (Electron) yang membungkus `../fokus-harian/index.html`.
Halamannya tetap satu file yang sama, jadi versi web dan desktop selalu serupa.

## Kenapa timer di browser sering tidak jalan, dan di sini tidak

Browser mencekik tab yang tidak aktif (`setInterval` jadi 1x per detik, lalu 1x per
menit), dan fitur penghemat memori bisa membekukan atau membuang tab. Aplikasi ini:

- mematikan pencekikan timer/render di jendela (`backgroundThrottling: false`);
- menahan komputer agar tidak menidurkan aplikasi selama timer jalan (`powerSaveBlocker`);
- membuat proses utama ikut menghitung mundur dari jam, lalu menampilkan **notifikasi
  sistem** dan mengedipkan ikon taskbar saat waktu habis, walau halaman sedang macet;
- menampilkan sisa waktu di judul jendela dan bilah progres taskbar/dock;
- bunyi selesai tidak lagi butuh klik, dan menanyakan dulu kalau jendela ditutup saat timer jalan.

## Memakai

Hasil build ada di tab **Actions** repo ini: jalankan *Build aplikasi desktop*, lalu
unduh dari bagian *Artifacts* (`.exe` Windows, `.dmg` macOS, `.AppImage` Linux).
Installer belum ditandatangani, jadi Windows SmartScreen / macOS Gatekeeper akan
memberi peringatan sekali (macOS: klik kanan → Buka).

## Menjalankan dan membuat sendiri

Butuh [Node.js](https://nodejs.org) 20+.

```sh
cd desktop
npm install
npm start          # jalankan langsung
npm run dist       # buat installer di desktop/dist/ untuk OS yang dipakai
```

Data (tugas, timer) disimpan di `localStorage` aplikasi, terpisah dari data browser.

## Struktur

```
main.js      jendela, jam timer di proses utama, notifikasi
preload.js   jembatan dua pesan: setTimer, timerDone
build/       ikon aplikasi
```

Saat dipaketkan, `../fokus-harian/` disalin ke `resources/web/fokus-harian/`
(`extraResources` di `package.json`).
