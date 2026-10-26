# Alat Aktivitas

Kumpulan alat kecil untuk aktivitas harian. Setiap alat adalah satu halaman HTML
mandiri: tanpa build, tanpa server, tanpa akun. Data disimpan di `localStorage`
browser pemakai.

## Alat

| Alat | Folder | Isi |
|---|---|---|
| Fokus Harian | `fokus-harian/` | Daftar tugas (kerjakan, tunda, selesai, gagal, hapus) dan timer pomodoro 25/50 menit dengan bunyi saat selesai |

## Struktur

```
index.html              halaman depan, daftar semua alat
fokus-harian/index.html
```

## Menambah alat baru

1. Buat folder baru, misalnya `nama-alat/`, berisi satu `index.html`.
2. Pakai token warna dan font yang sama dengan `fokus-harian/index.html`.
3. Beri tautan kembali `<a href="../">← Semua alat</a>` di header.
4. Tambahkan satu `<li>` untuk alat itu di `index.html` root dan satu baris di tabel di atas.
5. Pakai kunci `localStorage` berawalan nama alat (`nama-alat.…`) supaya data antar-alat tidak bertabrakan.

Semua tautan harus relatif (`fokus-harian/`, `../`), karena situs bisa tersaji di
subfolder (GitHub Pages: `https://<user>.github.io/<repo>/`).

## Menjalankan

Buka `index.html` langsung di browser, atau sajikan foldernya dengan server
statis apa pun:

```sh
python3 -m http.server 8080
```
