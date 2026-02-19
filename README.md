<h1 align="center">DMK Store 🛍️</h1>
<p align="center">
  <strong>Modern Thrift Shop Web Application</strong><br>
  <i>Platform jual beli pakaian thrift berkualitas dengan pengalaman belanja premium.</i>
</p>

<p align="center">
  <a href="https://github.com/username/dmk-store/stargazers"><img src="https://img.shields.io/github/stars/username/dmk-store?style=for-the-badge&logo=starship&logoColor=white&color=ffd700" alt="Stars"></a>
  <a href="https://github.com/username/dmk-store/network/members"><img src="https://img.shields.io/github/forks/username/dmk-store?style=for-the-badge&logo=git&logoColor=white&color=green" alt="Forks"></a>
  <a href="https://github.com/username/dmk-store/issues"><img src="https://img.shields.io/github/issues/username/dmk-store?style=for-the-badge&logo=github&logoColor=white&color=red" alt="Issues"></a>
  <a href="https://github.com/username/dmk-store/blob/main/LICENSE"><img src="https://img.shields.io/github/license/username/dmk-store?style=for-the-badge&logo=github&logoColor=white&color=blue" alt="License"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
</p>

<br>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Playfair+Display&size=28&duration=3000&pause=1000&color=D4AF37&center=true&vCenter=true&random=false&width=600&lines=Thrift+Shop+Pasaman+Barat;Kualitas+Premium+Harga+Terjangkau;Belanja+Sekarang!" alt="Typing SVG" />
</p>

<br>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">📑 Daftar Isi</h2></summary>
  <ol>
    <li><a href="#-tentang-proyek">Tentang Proyek</a></li>
    <li><a href="#-fitur-utama">Fitur Utama</a></li>
    <li><a href="#-tampilan-aplikasi">Tampilan Aplikasi</a></li>
    <li><a href="#-cara-menggunakan">Cara Menggunakan</a></li>
    <li><a href="#-struktur-file">Struktur File</a></li>
    <li><a href="#-teknologi">Teknologi</a></li>
    <li><a href="#-lisensi">Lisensi</a></li>
  </ol>
</details>

---

## 🚀 Tentang Proyek

**DMK Store** adalah sebuah website e-commerce single-page application (SPA) yang dirancang khusus untuk toko thrift shop. Dengan tampilan antarmuka yang gelap (*dark mode*) dan aksen warna emas yang elegan, website ini menawarkan pengalaman pengguna yang premium namun tetap ringan dan cepat.

Proyek ini dibangun menggunakan teknologi web dasar (Vanilla JS) tanpa framework berat, menjadikannya solusi yang sempurna untuk bisnis kecil hingga menengah yang ingin memiliki toko online dengan biaya hosting minimal.

### ✨ Keunggulan
- 💎 **Desain Premium**: Tampilan gelap dengan aksen emas yang mewah.
- 📱 **Fully Responsive**: Tampilan menyesuaikan sempurna di Desktop, Tablet, dan Mobile.
- ⚡ **Performa Cepat**: Tanpa library berat, loading hampir instan.
- 💾 **Local Storage**: Keranjang belanja tersimpan otomatis di browser.

---

## 🔥 Fitur Utama

### 🏠 Halaman Utama (Index)
- **Prioritas Produk**: Produk dengan tag `Flash Sale` dan `New Release` muncul paling atas.
- **Filter Kategori**: Sortir produk berdasarkan Kaos, Hoodie, Jeans, dll.
- **Image Slider**: Slider gambar produk yang smooth dan interaktif.
- **Deskripsi Cepat**: Modal popup untuk melihat detail produk singkat.

### 🌟 Halaman New Release
- Badge "NEW" hijau yang eye-catching.
- Animasi pulse pada badge produk baru.
- Filter khusus untuk produk terbaru.

### ⚡ Halaman Flash Sale
- **Live Countdown Timer**: Timer mundur yang berjalan secara realtime.
- **Harga Coret**: Tampilan harga asli dicoret dengan harga diskon yang menonjol.
- **Progress Bar Stok**: Indikator visual sisa stok yang mencegah kehabisan barang.

### 🛒 Sistem Keranjang & Checkout
- **Persistent Cart**: Data keranjang tersimpan di Local Storage (tidak hilang saat refresh).
- **Checkout Modal**: Pop-up pemilihan metode pembayaran (Bank BSI / Nagari).
- **WhatsApp Integration**: Pesan checkout otomatis dengan link gambar produk, total harga, dan detail bank.

---

## 🛠️ Cara Menggunakan

Ikuti langkah-langkah berikut untuk menjalankan proyek ini di komputer lokal Anda:

1.  **Clone Repository**
    ```sh
    git clone https://github.com/username/dmk-store.git
    ```
2.  **Masuk ke Direktori**
    ```sh
    cd dmk-store
    ```
3.  **Jalankan di Browser**
    Cukup buka file `index.html` menggunakan browser favorit Anda (Chrome, Firefox, dll).
    
    *Tips: Gunakan extension "Live Server" di VS Code untuk pengalaman development yang lebih baik dengan auto-reload.*

---

## 📂 Struktur File

Struktur folder proyek ini sangat sederhana dan mudah dipahami:

```text
dmk-store/
├── 📁 assets/              # Folder gambar (jika ada lokal)
├── 📄 index.html           # Halaman utama
├── 📄 newrelease.html      # Halaman produk baru
├── 📄 flashsale.html       # Halaman diskon
├── 🎨 style.css            # CSS utama (style global)
├── 🎨 newrelease.css       # CSS khusus halaman new release
├── 🎨 flashsale.css        # CSS khusus halaman flash sale
├── ⚙️ script.js            # Logic JavaScript utama
├── ⚙️ newrelease.js        # Logic JS halaman new release
├── ⚙️ flashsale.js         # Logic JS halaman flash sale
└── 📄 README.md            # File dokumentasi
```

---

## 💻 Teknologi

Proyek ini dibangun dengan fokus pada kemudahan dan kecepatan:

*   **Frontend**: HTML5, CSS3, JavaScript (ES6)
*   **Styling**: CSS Custom Properties (Variables), Flexbox, Grid, Tailwind CSS (Utility Classes)
*   **Icons**: SVG Inline
*   **Backend-less**: Menggunakan LocalStorage untuk database client-side.

---

## 🤝 Kontribusi

Kontribusi membuat komunitas open source menjadi tempat yang luar biasa untuk belajar, menginspirasi, dan berkreasi. Kontribusi apa pun yang Anda berikan **sangat dihargai**.

1.  Fork Project ini
2.  Buat Branch Fitur Anda (`git checkout -b feature/AmazingFeature`)
3.  Commit Perubahan Anda (`git commit -m 'Add some AmazingFeature'`)
4.  Push ke Branch (`git push origin feature/AmazingFeature`)
5.  Buka Pull Request

---

## 📝 Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat `LICENSE` untuk informasi lebih lanjut.

---

## 📞 Kontak

Sri Nofrianti - [@instagram_handle](https://www.instagram.com/dmk_store_/)

Project Link: [https://github.com/username/dmk-store](https://github.com/username/dmk-store)

---

<p align="center">
  Made with ❤️ by <strong>DMK Store Team</strong>
  <br><br>
  <img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="ForTheBadge">
</p>
```
