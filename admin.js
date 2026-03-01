// ================== ADMIN LOGIC ==================
let currentType = "products";

// ==================== FUNGSI HELPER PROXY GAMBAR ====================
function getProxyUrl(url) {
  if (!url) return "https://via.placeholder.com/400?text=DMK";
  if (url.includes("i.ibb.co")) {
    return `/api/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("dmk_admin_logged_in");
  if (isLoggedIn === "true") {
    showDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById("loginModal").classList.remove("hidden");
  document.getElementById("dashboard").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  loadProducts();
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("loginError");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("dmk_admin_logged_in", "true");
      showDashboard();
    } else {
      errorEl.classList.remove("hidden");
    }
  } catch (err) {
    errorEl.textContent = "Terjadi kesalahan server";
    errorEl.classList.remove("hidden");
  }
}

function logout() {
  localStorage.removeItem("dmk_admin_logged_in");
  location.reload();
}

// ================== SWITCH TAB ==================
function switchTab(type) {
  currentType = type;

  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`tab-${type}`).classList.add("active");

  const timerSettings = document.getElementById("flashSaleTimerSettings");
  const originalPriceField = document.getElementById("field-originalPrice");

  if (type === "flashsale") {
    timerSettings.classList.remove("hidden");
    originalPriceField.classList.remove("hidden");
    document.getElementById("originalPrice").required = true;
    loadFlashSaleSettings();
  } else {
    timerSettings.classList.add("hidden");
    originalPriceField.classList.add("hidden");
    document.getElementById("originalPrice").required = false;
  }

  const titles = {
    products: { form: "Tambah Produk Utama", list: "Daftar Produk Utama" },
    flashsale: { form: "Tambah Flash Sale", list: "Daftar Flash Sale" },
    newrelease: { form: "Tambah New Release", list: "Daftar New Release" },
  };
  document.getElementById("formTitle").textContent = titles[type].form;
  document.getElementById("listTitle").textContent = titles[type].list;

  resetForm();
  loadProducts();
}

// ================== FLASH SALE SETTINGS ==================
async function loadFlashSaleSettings() {
  try {
    const res = await fetch("/api/flashsale/settings");
    const settings = await res.json();

    const inputEl = document.getElementById("flashSaleEndTime");
    const infoEl = document.getElementById("currentEndTime");

    if (settings.endDate) {
      const dateObj = new Date(settings.endDate);
      const localDate = new Date(
        dateObj.getTime() - dateObj.getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16);
      inputEl.value = localDate;
      infoEl.textContent = `Jadwal saat ini: ${dateObj.toLocaleString("id-ID")}`;
    } else {
      inputEl.value = "";
      infoEl.textContent = "Belum ada jadwal ditetapkan.";
    }
  } catch (err) {
    console.error("Gagal load settings", err);
  }
}

async function saveFlashSaleSettings() {
  const inputVal = document.getElementById("flashSaleEndTime").value;
  if (!inputVal) {
    alert("Pilih tanggal dan waktu terlebih dahulu!");
    return;
  }
  const isoDate = new Date(inputVal).toISOString();
  try {
    const res = await fetch("/api/flashsale/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endDate: isoDate }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Jadwal flash sale berhasil disimpan!");
      loadFlashSaleSettings();
    } else {
      alert("Gagal menyimpan jadwal.");
    }
  } catch (err) {
    alert("Error koneksi: " + err.message);
  }
}

// ================== PRODUCT CRUD ==================
async function loadProducts() {
  const listEl = document.getElementById("productList");
  listEl.innerHTML = '<p class="text-gray-500">Memuat produk...</p>';

  try {
    const res = await fetch(`/api/${currentType}`);
    const products = await res.json();

    populateCategoryOptions(products);

    if (products.length === 0) {
      listEl.innerHTML =
        '<p class="text-gray-500 col-span-2">Belum ada produk.</p>';
      return;
    }

    listEl.innerHTML = products
      .map(
        (p) => `
      <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 flex gap-4">
        <!-- PERUBAHAN: Gunakan Proxy -->
        <img src="${getProxyUrl(p.images && p.images[0] ? p.images[0] : "")}" alt="${p.name}" class="w-24 h-24 object-cover rounded" onerror="this.src='https://via.placeholder.com/100'">
        <div class="flex-1">
          <h3 class="font-bold text-yellow-500">${p.name}</h3>
          <p class="text-sm text-gray-400">Kategori: ${p.category || "-"}</p>
          <p class="text-sm text-gray-400">Stok: ${p.stock}</p>
          <p class="font-bold text-white">${formatPrice(p.price)}</p>
          ${p.originalPrice ? `<p class="text-xs text-gray-500 line-through">${formatPrice(p.originalPrice)}</p>` : ""}
        </div>
        <div class="flex flex-col gap-2">
          <button onclick="editProduct(${p.id})" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs">Edit</button>
          <button onclick="deleteProduct(${p.id})" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs">Hapus</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    console.error(err);
    listEl.innerHTML =
      '<p class="text-red-500 col-span-2">Gagal memuat data.</p>';
  }
}

// ================== FUNGSI OTOMATISASI KATEGORI ==================
async function populateCategoryOptions(currentProducts) {
  const datalist = document.getElementById("categoryList");
  if (!datalist) return;

  try {
    const types = ["products", "flashsale", "newrelease"];
    let allProducts = [];
    const promises = types.map((type) =>
      fetch(`/api/${type}`).then((r) => r.json()),
    );
    const results = await Promise.all(promises);
    results.forEach((data) => {
      if (Array.isArray(data)) allProducts = [...allProducts, ...data];
    });

    const categories = [
      ...new Set(allProducts.map((p) => p.category).filter((c) => c)),
    ];

    datalist.innerHTML = categories
      .map((cat) => `<option value="${cat}">`)
      .join("");
  } catch (err) {
    console.error("Gagal memuat opsi kategori", err);
  }
}

// ================== SAVE PRODUCT (MULTI IMAGE) ==================
async function saveProduct(e) {
  e.preventDefault();

  const id = document.getElementById("productId").value;
  const categoryInput = document.getElementById("category").value;

  if (!categoryInput) {
    return alert("Kategori tidak boleh kosong!");
  }

  const img1 = document.getElementById("image1").value;
  const img2 = document.getElementById("image2").value;
  const img3 = document.getElementById("image3").value;

  if (!img1) {
    return alert("Foto utama (Foto 1) wajib diisi!");
  }

  let images = [img1];
  if (img2) images.push(img2);
  if (img3) images.push(img3);

  const productData = {
    name: document.getElementById("name").value,
    price: parseInt(document.getElementById("price").value),
    stock: parseInt(document.getElementById("stock").value),
    category: categoryInput,
    size: document.getElementById("size").value,
    images: images,
    description: document.getElementById("description").value,
  };

  if (currentType === "flashsale") {
    productData.originalPrice = parseInt(
      document.getElementById("originalPrice").value,
    );
  }

  const url = id ? `/api/${currentType}/${id}` : `/api/${currentType}`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });
    const data = await res.json();

    if (data.success) {
      alert(id ? "Produk berhasil diupdate!" : "Produk berhasil ditambahkan!");
      resetForm();
      loadProducts();
    } else {
      alert("ERROR: " + (data.message || "Gagal menyimpan produk"));
    }
  } catch (err) {
    alert("Terjadi kesalahan koneksi: " + err.message);
  }
}

// ================== EDIT PRODUCT (MULTI IMAGE) ==================
async function editProduct(id) {
  try {
    const res = await fetch(`/api/${currentType}`);
    const products = await res.json();
    const product = products.find((p) => p.id === id);

    if (product) {
      document.getElementById("productId").value = product.id;
      document.getElementById("name").value = product.name;
      document.getElementById("price").value = product.price;
      document.getElementById("stock").value = product.stock;
      document.getElementById("category").value = product.category;
      document.getElementById("size").value = product.size || "";
      document.getElementById("description").value = product.description || "";

      const imgs = product.images || [];
      // Input value harus URL ASLI agar database tersimpan benar
      document.getElementById("image1").value = imgs[0] || "";
      document.getElementById("image2").value = imgs[1] || "";
      document.getElementById("image3").value = imgs[2] || "";

      // Update preview menggunakan PROXY
      const prev1 = document.getElementById("preview1");
      const prev2 = document.getElementById("preview2");
      const prev3 = document.getElementById("preview3");

      if (imgs[0]) {
        prev1.src = getProxyUrl(imgs[0]); // Pakai Proxy
        prev1.classList.remove("hidden");
      } else prev1.classList.add("hidden");

      if (imgs[1]) {
        prev2.src = getProxyUrl(imgs[1]); // Pakai Proxy
        prev2.classList.remove("hidden");
      } else prev2.classList.add("hidden");

      if (imgs[2]) {
        prev3.src = getProxyUrl(imgs[2]); // Pakai Proxy
        prev3.classList.remove("hidden");
      } else prev3.classList.add("hidden");

      if (currentType === "flashsale" && product.originalPrice) {
        document.getElementById("originalPrice").value = product.originalPrice;
      }

      document.getElementById("formTitle").textContent =
        "Edit Produk: " + product.name;
      window.scrollTo(0, 0);
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteProduct(id) {
  if (confirm("Yakin ingin menghapus produk ini?")) {
    try {
      const res = await fetch(`/api/${currentType}/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) {
      alert("Gagal menghapus");
    }
  }
}

function resetForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("preview1").classList.add("hidden");
  document.getElementById("preview2").classList.add("hidden");
  document.getElementById("preview3").classList.add("hidden");

  const titles = {
    products: "Tambah Produk Utama",
    flashsale: "Tambah Flash Sale",
    newrelease: "Tambah New Release",
  };
  document.getElementById("formTitle").textContent = titles[currentType];
}

function formatPrice(price) {
  return "Rp " + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ================== FITUR UPLOAD GAMBAR (MULTI INPUT) ==================
async function handleImageUpload(event, inputId, previewId) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById("uploadStatus");
  const previewEl = document.getElementById(previewId);
  const inputUrl = document.getElementById(inputId);

  statusEl.textContent = "Memproses gambar...";
  statusEl.className = "text-xs text-yellow-500 mt-1";

  if (!file.type.startsWith("image/")) {
    statusEl.textContent = "Hanya file gambar yang diizinkan!";
    statusEl.className = "text-xs text-red-500 mt-1";
    return;
  }

  try {
    const compressedBase64 = await compressImage(file, 800, 0.8);
    statusEl.textContent = "Mengupload...";

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: compressedBase64 }),
    });

    const data = await res.json();

    if (data.success) {
      // Simpan URL ASLI ke input (untuk database)
      inputUrl.value = data.url;
      statusEl.textContent = "Upload berhasil!";
      statusEl.className = "text-xs text-green-500 mt-1";

      // Tampilkan di preview menggunakan PROXY
      previewEl.src = getProxyUrl(data.url); // Pakai Proxy
      previewEl.classList.remove("hidden");
    } else {
      throw new Error(data.message || "Gagal upload ke server");
    }
  } catch (err) {
    statusEl.textContent = "Error: " + err.message;
    statusEl.className = "text-xs text-red-500 mt-1";
  }
}

function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;
      img.onload = function () {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = function (err) {
        reject(err);
      };
    };
    reader.onerror = function (err) {
      reject(err);
    };
  });
}
