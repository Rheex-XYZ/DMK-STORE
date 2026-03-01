// ./api/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Redis } from "@upstash/redis";
import FormData from "form-data";
import fetch from "node-fetch";

const app = express();
app.use(cors());
// PERBAIKAN ERROR 413: Tambahkan limit '50mb'
app.use(bodyParser.json({ limit: "50mb" }));

// ==================== SETUP REDIS OTOMATIS ====================
function getRedisConfig() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    };
  }
  if (process.env.REDIS_URL) {
    const urlObj = new URL(process.env.REDIS_URL);
    return {
      url: `https://${urlObj.hostname}`,
      token: urlObj.password,
    };
  }
  throw new Error("Database tidak terkonfigurasi. Cek Environment Variables.");
}

const redis = new Redis(getRedisConfig());
// ===============================================================

// Helper: Baca Data
const readData = async (key) => {
  try {
    const data = await redis.get(key);
    return data || [];
  } catch (err) {
    console.error("Gagal membaca data:", err);
    return [];
  }
};

// Helper: Tulis Data
const writeData = async (key, data) => {
  try {
    await redis.set(key, data);
  } catch (err) {
    console.error("Gagal menulis data:", err);
    throw err;
  }
};

// ==================== ROUTES ====================

// 1. Login Admin
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "dmkstore" && password === "dmkstore") {
    return res.json({ success: true, message: "Login berhasil" });
  }
  res
    .status(401)
    .json({ success: false, message: "Username atau password salah" });
});

// 2. Upload Gambar
app.post("/api/upload", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: "Gambar tidak ditemukan" });
    }

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "Server Error: IMGBB_API_KEY belum diset di Vercel Environment Variables.",
      });
    }

    const form = new FormData();
    const base64Data = image.split(";base64,").pop();
    form.append("image", base64Data);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${apiKey}`,
      {
        method: "POST",
        body: form,
        headers: form.getHeaders(),
      },
    );

    const result = await response.json();

    if (result.success) {
      res.json({
        success: true,
        url: result.data.url,
      });
    } else {
      throw new Error(result.error.message || "Gagal upload ke ImgBB");
    }
  } catch (err) {
    console.error("Upload Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Upload gagal: " + err.message });
  }
});

// ==================== IMAGE PROXY (SOLUSI DNS BLOKIR) ====================
// Rute ini harus di atas rute dinamis agar tidak tertangkap /api/:type
app.get("/api/image", async (req, res) => {
  const { url } = req.query;

  // Validasi keamanan: Hanya izinkan gambar dari i.ibb.co
  if (!url || !url.includes("i.ibb.co")) {
    return res.status(400).send("URL tidak valid");
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(404).send("Gambar tidak ditemukan");
    }

    const contentType = response.headers.get("content-type");
    const buffer = await response.buffer();

    // Set header agar browser menganggap ini gambar
    res.setHeader("Content-Type", contentType || "image/jpeg");
    // Cache gambar selama 1 tahun di CDN Vercel
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);
  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).send("Gagal mengambil gambar");
  }
});
// =========================================================================

// ==================== RUTE SPESIFIK & DINAMIS ====================

// 6. Checkout
app.post("/api/checkout", async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res
        .status(400)
        .json({ success: false, message: "Data items tidak valid" });
    }

    for (const item of items) {
      const types = ["products", "flashsale", "newrelease"];
      for (const type of types) {
        let data = await readData(type);
        const idx = data.findIndex((p) => p.id === item.id);
        if (idx !== -1) {
          data[idx].stock = Math.max(0, (data[idx].stock || 0) - item.quantity);
          await writeData(type, data);
          break;
        }
      }
    }
    res.json({ success: true, message: "Checkout sukses" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal checkout: " + err.message });
  }
});

// ==================== FLASH SALE SETTINGS (FIXED) ====================
// GET: Ambil pengaturan
app.get("/api/flashsale/settings", async (req, res) => {
  try {
    const settings = await readData("flashsale_settings");
    // Pastikan mengembalikan struktur default jika kosong
    res.json(settings || { endDate: null, categoryImages: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal ambil pengaturan" });
  }
});

// POST: Simpan pengaturan (Waktu & Cover Kategori)
app.post("/api/flashsale/settings", async (req, res) => {
  try {
    // Ambil data dari body
    const { endDate, categoryImages } = req.body;

    // Ambil setting lama agar tidak overwrite data yang tidak dikirim
    const oldSettings = (await readData("flashsale_settings")) || {};

    // Bentuk object baru dengan merge data lama dan baru
    const newSettings = {
      endDate: endDate || oldSettings.endDate,
      // Jika categoryImages dikirim (bahkan object kosong), pakai itu. Kalau tidak, pakai data lama.
      categoryImages:
        categoryImages !== undefined
          ? categoryImages
          : oldSettings.categoryImages || {},
    };

    await writeData("flashsale_settings", newSettings);
    res.json({ success: true, message: "Pengaturan diperbarui" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal simpan pengaturan" });
  }
});

// ==================== RUTE DINAMIS (DITEMPATKAN PALING BAWAH) ====================

// 3. Get Semua Produk (Dinamis)
app.get("/api/:type", async (req, res) => {
  try {
    const type = req.params.type;
    if (!["products", "flashsale", "newrelease"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Tipe produk tidak valid" });
    }
    const products = await readData(type);
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal ambil data: " + err.message });
  }
});

// 4. Tambah Produk Baru (Dinamis)
app.post("/api/:type", async (req, res) => {
  try {
    const type = req.params.type;
    if (!["products", "flashsale", "newrelease"].includes(type))
      return res
        .status(400)
        .json({ success: false, message: "Tipe produk tidak valid" });

    const products = await readData(type);
    let images = [];
    if (req.body.images) images = req.body.images;
    else if (req.body.image) images = [req.body.image];
    else images = ["https://via.placeholder.com/400"];

    const newProduct = {
      id: Date.now(),
      ...req.body,
      images: images,
      stock: req.body.stock || 0,
    };

    if (type === "flashsale" && req.body.originalPrice && req.body.price) {
      newProduct.discount = Math.round(
        ((req.body.originalPrice - req.body.price) / req.body.originalPrice) *
          100,
      );
    }

    products.push(newProduct);
    await writeData(type, products);
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan: " + err.message });
  }
});

// 5. Edit Produk (Dinamis)
app.put("/api/:type/:id", async (req, res) => {
  try {
    const type = req.params.type;
    if (!["products", "flashsale", "newrelease"].includes(type))
      return res.status(400).json({ success: false });

    let products = await readData(type);
    const id = parseInt(req.params.id);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });

    products[index] = { ...products[index], ...req.body };
    if (req.body.image) products[index].images = [req.body.image];
    if (type === "flashsale" && req.body.originalPrice && req.body.price) {
      products[index].discount = Math.round(
        ((req.body.originalPrice - req.body.price) / req.body.originalPrice) *
          100,
      );
    }

    await writeData(type, products);
    res.json({ success: true, product: products[index] });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal update: " + err.message });
  }
});

// 6. Hapus Produk (Dinamis)
app.delete("/api/:type/:id", async (req, res) => {
  try {
    const type = req.params.type;
    if (!["products", "flashsale", "newrelease"].includes(type))
      return res.status(400).json({ success: false });

    let products = await readData(type);
    const filtered = products.filter((p) => p.id !== parseInt(req.params.id));
    await writeData(type, filtered);
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Gagal hapus: " + err.message });
  }
});

export default app;
