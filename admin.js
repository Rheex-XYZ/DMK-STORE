// ================== ADMIN LOGIC ==================
let currentType = "products";
let variantCounter = 0;

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
  const standardForm = document.getElementById("standardFormContainer");
  const flashForm = document.getElementById("flashSaleFormContainer");
  const origPriceField = document.getElementById("field-originalPrice");

  // Default: Tampilkan Form Standar
  standardForm.classList.remove("hidden");
  flashForm.classList.add("hidden");
  origPriceField.classList.add("hidden");

  if (type === "flashsale") {
    timerSettings.classList.remove("hidden");
    flashForm.classList.remove("hidden"); // Tampilkan Form Batch
    standardForm.classList.add("hidden"); // Sembunyikan Form Standar

    // Reset form batch
    document.getElementById("fsBatchCategory").value = "";
    document.getElementById("fsBatchPrice").value = "";
    document.getElementById("fsBatchOriginal").value = "";
    document.getElementById("variantList").innerHTML = "";
    addVariantRow(); // Tambah 1 baris kosong default

    loadFlashSaleSettings();
  } else if (type === "newrelease") {
    timerSettings.classList.add("hidden");
  } else {
    timerSettings.classList.add("hidden");
  }

  const titles = {
    products: { list: "Daftar Produk Utama" },
    flashsale: { list: "Daftar Produk Flash Sale" },
    newrelease: { list: "Daftar New Release" },
  };
  document.getElementById("listTitle").textContent = titles[type].list;
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
      infoEl.textContent = `Jadwal: ${dateObj.toLocaleString("id-ID")}`;
    } else {
      infoEl.textContent = "Belum ada jadwal.";
    }
  } catch (err) {
    console.error("Gagal load settings", err);
  }
}

async function saveFlashSaleSettings() {
  const inputVal = document.getElementById("flashSaleEndTime").value;
  if (!inputVal) return alert("Pilih tanggal!");

  try {
    const res = await fetch("/api/flashsale/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endDate: new Date(inputVal).toISOString() }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Jadwal disimpan!");
      loadFlashSaleSettings();
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// ================== DYNAMIC VARIANT ROW (BATCH ADD) ==================
function addVariantRow() {
  const container = document.getElementById("variantList");
  const row = document.createElement("div");
  row.className = "variant-row";
  row.id = `variant-${variantCounter}`;

  row.innerHTML = `
    <button type="button" class="remove-variant-btn" onclick="removeVariantRow('variant-${variantCounter}')">X</button>
    <div class="grid grid-cols-2 gap-2 mb-2">
      <div>
        <label class="text-xs text-gray-500">Ukuran</label>
        <input type="text" name="size" placeholder="S / M / L" class="variant-size w-full bg-gray-700 p-2 rounded border border-gray-600 text-sm" />
      </div>
      <div>
        <label class="text-xs text-gray-500">Stok</label>
        <input type="number" name="stock" placeholder="0" class="variant-stock w-full bg-gray-700 p-2 rounded border border-gray-600 text-sm" required />
      </div>
    </div>
    <div>
      <label class="text-xs text-gray-500">Gambar Varian</label>
      <div class="flex gap-2 items-center mt-1">
        <input type="text" name="image" placeholder="Link gambar" class="variant-img flex-1 bg-gray-700 p-2 rounded border border-gray-600 text-sm" required />
        <label class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded cursor-pointer text-xs font-semibold whitespace-nowrap">Upload<input type="file" accept="image/*" class="hidden" onchange="handleVariantUpload(event, this)"/></label>
      </div>
    </div>
  `;

  container.appendChild(row);
  variantCounter++;
}

function removeVariantRow(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

async function handleVariantUpload(event, btn) {
  const file = event.target.files[0];
  if (!file) return;

  const input = btn.closest(".variant-row").querySelector(".variant-img");
  input.value = "Uploading...";

  const compressed = await compressImage(file, 800, 0.8);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: compressed }),
  });
  const data = await res.json();
  if (data.success) {
    input.value = data.url;
  } else {
    input.value = "Error";
    alert("Gagal upload");
  }
}

async function saveFlashSaleBatch(e) {
  e.preventDefault();

  const category = document.getElementById("fsBatchCategory").value;
  const price = parseInt(document.getElementById("fsBatchPrice").value);
  const originalPrice = parseInt(
    document.getElementById("fsBatchOriginal").value,
  );

  if (!category || !price || !originalPrice)
    return alert("Kategori & Harga wajib diisi!");

  const rows = document.querySelectorAll(".variant-row");
  let productsToSave = [];

  rows.forEach((row) => {
    const size = row.querySelector(".variant-size").value;
    const stock = row.querySelector(".variant-stock").value;
    const image = row.querySelector(".variant-img").value;

    if (image && image !== "Uploading..." && image !== "Error") {
      productsToSave.push({
        name: `${category} - ${size || "Varian"}`, // Generate nama internal
        category: category,
        price: price,
        originalPrice: originalPrice,
        size: size,
        stock: parseInt(stock) || 0,
        images: [image], // Setiap varian punya 1 gambar utama
        description: `Flash Sale ${category}`,
      });
    }
  });

  if (productsToSave.length === 0)
    return alert("Tidak ada varian valid untuk disimpan.");

  // Kirim satu per satu ke API
  try {
    let successCount = 0;
    for (let p of productsToSave) {
      const res = await fetch("/api/flashsale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (data.success) successCount++;
    }
    alert(`Berhasil menyimpan ${successCount} varian!`);
    loadProducts();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// ================== PRODUCT CRUD (STANDARD) ==================
async function loadProducts() {
  const listEl = document.getElementById("productList");
  listEl.innerHTML = '<p class="text-gray-500">Memuat...</p>';

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
      .map((p) => {
        const priceDisplay =
          currentType === "flashsale"
            ? `<p class="font-bold text-white">${formatPrice(p.price)} <span class="text-xs text-gray-500 line-through ml-1">${formatPrice(p.originalPrice)}</span></p>`
            : `<p class="font-bold text-white">${formatPrice(p.price)}</p>`;

        const mainImg = p.images && p.images[0] ? p.images[0] : "";

        // Khusus Flash Sale tampilkan info ukuran
        const sizeInfo =
          currentType === "flashsale"
            ? `<span class="text-xs bg-gray-700 px-2 py-1 rounded ml-2">${p.size || "-"}</span>`
            : "";

        return `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 flex gap-4">
          <img src="${getProxyUrl(mainImg)}" alt="${p.name}" class="w-24 h-24 object-cover rounded" onerror="this.src='https://via.placeholder.com/100'">
          <div class="flex-1">
            <h3 class="font-bold text-yellow-500">${p.name} ${sizeInfo}</h3>
            <p class="text-sm text-gray-400">Kategori: ${p.category || "-"}</p>
            <p class="text-sm text-gray-400">Stok: ${p.stock}</p>
            ${priceDisplay}
          </div>
          <div class="flex flex-col gap-2">
            <button onclick="editProduct(${p.id})" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs">Edit</button>
            <button onclick="deleteProduct(${p.id})" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs">Hapus</button>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    listEl.innerHTML =
      '<p class="text-red-500 col-span-2">Gagal memuat data.</p>';
  }
}

async function populateCategoryOptions(currentProducts) {
  const datalist = document.getElementById("categoryList");
  if (!datalist) return;
  const categories = [
    ...new Set(currentProducts.map((p) => p.category).filter((c) => c)),
  ];
  datalist.innerHTML = categories
    .map((cat) => `<option value="${cat}">`)
    .join("");
}

// Save Standard Product
async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById("productId").value;

  let images = [];
  const img1 = document.getElementById("image1").value;
  if (img1) images.push(img1);

  const productData = {
    name: document.getElementById("name").value,
    price: parseInt(document.getElementById("price").value),
    stock: parseInt(document.getElementById("stock").value),
    category: document.getElementById("category").value,
    size: document.getElementById("size").value,
    images: images,
    description: document.getElementById("description").value,
  };

  if (currentType === "flashsale") {
    productData.originalPrice =
      parseInt(document.getElementById("originalPrice").value) || 0;
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
      alert("Berhasil!");
      resetForm();
      loadProducts();
    } else {
      alert("ERROR: " + (data.message || "Gagal"));
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function editProduct(id) {
  // Untuk Flash Sale, jika klik edit, kita pakai form standar (bukan batch)
  if (currentType === "flashsale") {
    // Switch tampilan form
    document.getElementById("flashSaleFormContainer").classList.add("hidden");
    document.getElementById("standardFormContainer").classList.remove("hidden");
    document.getElementById("field-originalPrice").classList.remove("hidden");
  }

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
      document.getElementById("image1").value = product.images
        ? product.images[0]
        : "";

      const prev1 = document.getElementById("preview1");
      if (product.images && product.images[0]) {
        prev1.src = getProxyUrl(product.images[0]);
        prev1.classList.remove("hidden");
      }

      if (currentType === "flashsale" && product.originalPrice) {
        document.getElementById("originalPrice").value = product.originalPrice;
      }
      window.scrollTo(0, 0);
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteProduct(id) {
  if (confirm("Yakin hapus?")) {
    try {
      const res = await fetch(`/api/${currentType}/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) loadProducts();
    } catch (err) {
      alert("Gagal hapus");
    }
  }
}

function resetForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  const prev1 = document.getElementById("preview1");
  if (prev1) prev1.classList.add("hidden");
}

function formatPrice(price) {
  return "Rp " + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function getProxyUrl(url) {
  if (!url) return "https://via.placeholder.com/400?text=DMK";
  if (url.includes("i.ibb.co"))
    return `/api/image?url=${encodeURIComponent(url)}`;
  return url;
}

async function handleImageUpload(event, inputId, previewId) {
  const file = event.target.files[0];
  if (!file) return;

  const inputUrl = document.getElementById(inputId);
  const previewEl = document.getElementById(previewId);

  const compressed = await compressImage(file, 800, 0.8);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: compressed }),
  });
  const data = await res.json();
  if (data.success) {
    inputUrl.value = data.url;
    previewEl.src = getProxyUrl(data.url);
    previewEl.classList.remove("hidden");
  } else {
    alert("Gagal upload");
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
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
