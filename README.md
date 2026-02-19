# DMK Store - Thrift Shop Pasaman Barat

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>Website E-Commerce Thrift Shop Modern</strong><br>
  <em>Tampil stylish tidak perlu mahal</em>
</p>

---

## Deskripsi

**DMK Store** adalah website e-commerce untuk toko thrift shop yang berlokasi di Pasaman Barat, Sumatera Barat. Website ini dirancang dengan tampilan modern, elegan, dan user-friendly untuk memudahkan pelanggan dalam membeli pakaian second berkualitas dengan harga terjangkau.

---

## Fitur Utama

| Fitur | Keterangan |
|-------|------------|
| Katalog Produk | Tampilan produk dengan gambar slider dan filter kategori |
| Keranjang Belanja | Sistem keranjang dengan penyimpanan localStorage |
| Checkout WhatsApp | Proses checkout langsung via WhatsApp dengan detail pesanan |
| Multi-Pembayaran | Pilihan transfer Bank BSI dan Bank Nagari |
| Detail Produk | Modal popup dengan deskripsi lengkap produk |
| Stock Tracking | Indikator ketersediaan stok real-time |
| Responsive Design | Tampilan optimal di desktop, tablet, dan mobile |
| Dark Theme | Tema gelap elegan dengan aksen gold |

---

## Kategori Produk

- Kaos
- Hoodie
- Celana
- Jeans
- Kemeja
- Jaket
- Rok
- Dress

---

## Teknologi

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
</p>

- **HTML5** - Struktur semantik
- **CSS3** - Styling dengan animasi dan efek modern
- **JavaScript (Vanilla)** - Logika aplikasi tanpa framework
- **Tailwind CSS** - Utility-first CSS framework
- **Google Fonts** - Playfair Display & Poppins
- **LocalStorage** - Persistensi data keranjang

---

## Struktur File

```
dmk-store/
├── index.html          # Halaman utama
├── style.css           # Stylesheet utama
├── script.js           # Logika JavaScript
├── README.md           # Dokumentasi
└── assets/             # Folder aset (jika ada)
    └── images/         # Gambar produk
```

---

## Cara Penggunaan

### 1. Clone Repository
```bash
git clone https://github.com/username/dmk-store.git
cd dmk-store
```

### 2. Buka di Browser
Cukup buka file `index.html` di browser, atau gunakan live server:

```bash
# Menggunakan VS Code Live Server
# Klik kanan pada index.html > Open with Live Server

# Atau menggunakan Python
python -m http.server 8000
# Buka http://localhost:8000
```

### 3. Kustomisasi Produk
Edit array `products` di `script.js` untuk menambah/mengubah produk:

```javascript
const products = [
  {
    id: 1,
    name: "Nama Produk",
    price: 85000,
    category: "kaos",
    size: "L - XL",
    stock: 2,
    description: "Deskripsi produk",
    images: ["url-gambar-1.jpg", "url-gambar-2.jpg"]
  },
  // ... produk lainnya
];
```

### 4. Ubah Informasi Pembayaran
Edit bagian payment options di `index.html` dan fungsi `confirmCheckout()` di `script.js`:

```javascript
// Di script.js - fungsi confirmCheckout()
if (method === 'bsi') {
  bankInfo = {
    name: "Bank BSI",
    rekening: "7145183485",
    atasNama: "Sri Nofrianti",
  };
}
```

---

## Fitur Tampilan

### Hero Section
- Background animasi floating orbs
- Badge label "Thrift Shop Pasaman Barat"
- Call-to-action button dengan smooth scroll

### Product Cards
- Image slider dengan navigasi dot dan arrow
- Hover effects dengan transform dan shadow
- Badge kategori dan status stok
- Tombol aksi: Lihat Deskripsi, Keranjang, Beli

### Cart Sidebar
- Slide-in animation dari kanan
- Daftar item dengan gambar thumbnail
- Hapus item dengan animasi
- Total harga otomatis

### Checkout Modal
- Ringkasan pesanan
- Pilihan metode pembayaran visual
- Konfirmasi langsung ke WhatsApp

---

## Responsive Breakpoints

| Device | Width | Adjustments |
|--------|-------|-------------|
| Desktop | > 768px | Full layout |
| Tablet | 768px | Grid 2 kolom |
| Mobile | < 768px | Single column, full-width sidebar |

---

## Kontak

<p>
  <a href="https://wa.me/628116638877">
    <img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp">
  </a>
  <a href="https://www.instagram.com/dmk_store_/">
    <img src="https://img.shields.io/badge/Instagram-E4405F?style=flat-square&logo=instagram&logoColor=white" alt="Instagram">
  </a>
  <a href="https://web.facebook.com/JengSriDMK">
    <img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook">
  </a>
</p>

**DMK Store**
- Lokasi: Pasaman Barat, Sumatera Barat
- WhatsApp: +62 811-6638-877
- Instagram: [@dmk_store_](https://www.instagram.com/dmk_store_/)

---

## Roadmap

- [ ] Integrasi dengan backend/database
- [ ] Sistem autentikasi user
- [ ] Dashboard admin untuk kelola produk
- [ ] Sistem promo dan diskon
- [ ] Wishlist produk
- [ ] Rating dan review

---

## Kontribusi

Kontribusi selalu diterima! Silakan buat Pull Request atau Issue untuk perbaikan dan fitur baru.

```bash
# Fork repository
# Buat branch fitur
git checkout -b feature/nama-fitur

# Commit perubahan
git commit -m "Add: nama fitur"

# Push ke branch
git push origin feature/nama-fitur

# Buat Pull Request
```

---

## Lisensi
Proyek ini dilisensikan di bawah **MIT License** - lihat file [LICENSE](LICENSE) untuk detail.
---
<p align="center">
  <strong>DMK Store</strong><br>
  <em>Thrift Shop Terpercaya di Pasaman Barat</em><br><br>
  Dibuat dengan ❤️ untuk komunitas thrift fashion Indonesia
</p>
