// ================== ADMIN LOGIC ==================
let currentType = "products";
let imageCounter = 0; // Counter untuk ID unik input gambar

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
  // Inisialisasi 1 input gambar saat load
  resetForm();
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
  const originalPriceField = document.getElementById("field-originalPrice");

  if (type === "flashsale") {
    timerSettings.classList.remove("hidden");
    originalPriceField.classList.remove("hidden");
    document.getElementById("originalPrice").required = true;
    loadFlashSaleSettings(); // Load waktu & cover kategori
  } else {
    timerSettings.classList.add("hidden");
    originalPriceField.classList.add("hidden");
    document.getElementById("originalPrice").required = false;
  }

  const titles = {
    products: { form: "Tambah Produk Utama", list: "Daftar Produk Utama" },
    flashsale: { form: "Tambah Produk Flash Sale", list: "Daftar Flash Sale" },
    newrelease: { form: "Tambah New Release", list: "Daftar New Release" },
  };
  document.getElementById("formTitle").textContent = titles[type].form;
  document.getElementById("listTitle").textContent = titles[type].list;

  resetForm();
  loadProducts();
}

// ================== FLASH SALE SETTINGS (WITH CATEGORY IMAGES) ==================
async function loadFlashSaleSettings() {
  try {
    const res = await fetch("/api/flashsale/settings");
    const settings = await res.json();

    // Load Waktu
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
      infoEl.textContent = "Belum ada jadwal.";
    }

    // Load Category Images
    const categoryImages = settings.categoryImages || {};
    const categories = await getExistingCategories(); // Ambil daftar kategori
    const container = document.getElementById("categoryCoverInputs");
    container.innerHTML = "";

    categories.forEach((cat) => {
      const currentImg = categoryImages[cat] || "";
      container.innerHTML += `
            <div class="flex gap-2 items-center">
                <span class="w-20 text-xs truncate" title="${cat}">${cat}</span>
                <input type="text" id="cover-${cat.replace(/\s/g, "_")}" value="${currentImg}" placeholder="Link gambar cover" class="flex-1 bg-gray-700 p-1 rounded text-xs border border-gray-600"/>
                <label class="bg-blue-600 px-2 py-1 rounded cursor-pointer text-xs">Upload<input type="file" accept="image/*" class="hidden" onchange="handleCategoryCoverUpload(event, '${cat}')"/></label>
            </div>
        `;
    });
  } catch (err) {
    console.error("Gagal load settings", err);
  }
}

async function getExistingCategories() {
  // Helper untuk ambil list kategori unik dari semua produk flash sale
  try {
    const res = await fetch("/api/flashsale");
    const products = await res.json();
    return [...new Set(products.map((p) => p.category).filter((c) => c))];
  } catch (e) {
    return [];
  }
}

async function handleCategoryCoverUpload(event, category) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById("currentEndTime");
  statusEl.textContent = "Mengupload cover...";

  const compressed = await compressImage(file, 800, 0.8);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: compressed }),
  });
  const data = await res.json();
  if (data.success) {
    document.getElementById(`cover-${category.replace(/\s/g, "_")}`).value =
      data.url;
    statusEl.textContent = "Cover siap disimpan.";
  } else {
    statusEl.textContent = "Gagal upload cover.";
  }
}

async function saveFlashSaleSettings() {
  const inputVal = document.getElementById("flashSaleEndTime").value;

  // Kumpulkan semua input cover
  const categoryImages = {};
  const inputs = document.querySelectorAll(
    '#categoryCoverInputs input[type="text"]',
  );
  inputs.forEach((input) => {
    const cat = input.id.replace("cover-", "").replace(/_/g, " ");
    if (input.value) categoryImages[cat] = input.value;
  });

  try {
    const res = await fetch("/api/flashsale/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endDate: inputVal ? new Date(inputVal).toISOString() : null,
        categoryImages: categoryImages,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Pengaturan Flash Sale disimpan!");
      loadFlashSaleSettings();
    } else {
      alert("Gagal menyimpan.");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// ================== DYNAMIC IMAGE INPUT ==================
function addImageInput(value = "") {
  const container = document.getElementById("imageInputsContainer");
  const div = document.createElement("div");
  div.className = "image-input-row";
  div.id = `img-row-${imageCounter}`;

  div.innerHTML = `
    <input type="text" placeholder="Link gambar" value="${value}" class="img-input flex-1 bg-gray-800 p-2 rounded border border-gray-700 outline-none text-sm" />
    <label class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded cursor-pointer text-xs font-semibold whitespace-nowrap">
        Upload
        <input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(event, this)"/>
    </label>
    <button type="button" onclick="removeImageInput('img-row-${imageCounter}')" class="text-red-500 hover:text-red-400 text-xs">Hapus</button>
  `;
  container.appendChild(div);
  imageCounter++;
}

function removeImageInput(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ================== PRODUCT CRUD ==================
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

        // Ambil gambar utama
        const mainImg = p.images && p.images[0] ? p.images[0] : "";

        return `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 flex gap-4">
          <img src="${getProxyUrl(mainImg)}" alt="${p.name}" class="w-24 h-24 object-cover rounded" onerror="this.src='https://via.placeholder.com/100'">
          <div class="flex-1">
            <h3 class="font-bold text-yellow-500">${p.name}</h3>
            <p class="text-sm text-gray-400">Kategori: ${p.category || "-"} | Ukuran: ${p.size || "-"}</p>
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

    // Refresh settings jika di tab flashsale
    if (currentType === "flashsale") loadFlashSaleSettings();
  } catch (err) {
    console.error("Gagal memuat opsi kategori", err);
  }
}

// ================== SAVE & EDIT (MODIFIED FOR DYNAMIC IMAGES) ==================
async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById("productId").value;
  const categoryInput = document.getElementById("category").value;
  if (!categoryInput) return alert("Kategori wajib!");

  // Kumpulkan gambar dari dynamic inputs
  const imgInputs = document.querySelectorAll(".img-input");
  let images = [];
  imgInputs.forEach((input) => {
    if (input.value.trim()) images.push(input.value.trim());
  });

  if (images.length === 0) return alert("Minimal 1 gambar wajib!");

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
      if (currentType === "flashsale" && product.originalPrice) {
        document.getElementById("originalPrice").value = product.originalPrice;
      }

      // Populate Dynamic Images
      const container = document.getElementById("imageInputsContainer");
      container.innerHTML = ""; // Kosongkan dulu
      imageCounter = 0;

      const imgs = product.images || [];
      if (imgs.length > 0) {
        imgs.forEach((img) => addImageInput(img));
      } else {
        addImageInput(); // Tambah 1 kosong jika tidak ada
      }

      document.getElementById("formTitle").textContent =
        "Edit: " + product.name;
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

  // Reset Dynamic Images to 1 empty input
  const container = document.getElementById("imageInputsContainer");
  container.innerHTML = "";
  imageCounter = 0;
  addImageInput();

  const titles = {
    products: "Tambah Produk Utama",
    flashsale: "Tambah Flash Sale",
    newrelease: "Tambah New Release",
  };
  document.getElementById("formTitle").textContent = titles[currentType];
}

// ================== HELPERS ==================
function formatPrice(price) {
  return "Rp " + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function getProxyUrl(url) {
  if (!url) return "https://via.placeholder.com/400?text=DMK";
  if (url.includes("i.ibb.co"))
    return `/api/image?url=${encodeURIComponent(url)}`;
  return url;
}

async function handleImageUpload(event, inputEl) {
  const file = event.target.files[0];
  if (!file) return;

  // Input element adalah sibling dari label, atau parent-nya. Sesuaikan selector.
  // Di sini kita pass `this` dari onclick, tapi karena di dalam label, kita cari parent sibling.
  const inputText = inputEl
    .closest(".image-input-row")
    .querySelector('input[type="text"]');
  const statusEl = document.getElementById("uploadStatus");

  statusEl.textContent = "Memproses...";
  statusEl.className = "text-xs text-yellow-500 mt-1";

  try {
    const compressed = await compressImage(file, 800, 0.8);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: compressed }),
    });
    const data = await res.json();
    if (data.success) {
      inputText.value = data.url; // Isi URL ke input text
      statusEl.textContent = "Upload sukses!";
      statusEl.className = "text-xs text-green-500 mt-1";
    } else {
      throw new Error(data.message);
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
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
