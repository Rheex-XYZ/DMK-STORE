// ==================== FLASH SALE DATA ====================
let flashSaleProducts = [];
let FLASH_SALE_END = new Date();
let cart = [];
let currentCategoryView = "all"; // 'all' untuk kategori, nama kategori untuk detail

let currentCheckoutItems = [];
let isCheckoutFromCart = false;

// ==================== PROXY HELPER ====================
function getProxyUrl(url) {
  if (!url) return "https://via.placeholder.com/400?text=DMK";
  if (url.includes("i.ibb.co")) {
    return `/api/image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", function () {
  loadCart();
  initApp();
});

async function initApp() {
  await loadFlashSaleSettings();
  initCountdown();
  fetchFlashSaleProducts();
}

// ==================== LOAD SETTINGS ====================
async function loadFlashSaleSettings() {
  try {
    const res = await fetch("/api/flashsale/settings");
    const settings = await res.json();
    if (settings.endDate) {
      FLASH_SALE_END = new Date(settings.endDate);
    } else {
      FLASH_SALE_END = new Date(2020, 0, 1);
    }
  } catch (err) {
    console.error("Gagal load waktu flash sale", err);
  }
}

// ==================== COUNTDOWN ====================
function initCountdown() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date().getTime();
  const endTime = FLASH_SALE_END.getTime();
  const distance = endTime - now;

  const countdownContainer = document.getElementById("countdownContainer");
  const productsSection = document.getElementById("flashProductsSection");

  if (distance < 0) {
    if (countdownContainer) countdownContainer.style.display = "none";
    if (productsSection)
      productsSection.innerHTML =
        "<div class='flash-empty-state' style='text-align:center; padding:4rem;'><h3>Flash Sale Berakhir</h3><p>Simpan jadwal baru di Admin Panel.</p></div>";
    return;
  }

  if (countdownContainer) countdownContainer.style.display = "inline-block";

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (document.getElementById("days"))
    document.getElementById("days").textContent = String(days).padStart(2, "0");
  if (document.getElementById("hours"))
    document.getElementById("hours").textContent = String(hours).padStart(
      2,
      "0",
    );
  if (document.getElementById("minutes"))
    document.getElementById("minutes").textContent = String(minutes).padStart(
      2,
      "0",
    );
  if (document.getElementById("seconds"))
    document.getElementById("seconds").textContent = String(seconds).padStart(
      2,
      "0",
    );
}

// ==================== FUNGSI KERANJANG ====================
function loadCart() {
  const savedCart = localStorage.getItem("dmk_cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartUI();
  }
}
function saveCart() {
  localStorage.setItem("dmk_cart", JSON.stringify(cart));
  updateCartUI();
}

function addToCart(product) {
  if (!product || product.stock <= 0) return;

  const existingItem = cart.find((item) => item.id === product.id);
  if (existingItem) {
    showToast("Produk sudah ada di keranjang");
    return;
  }

  cart.push({
    id: product.id,
    name: product.name, // Disimpan untuk referensi admin/internal
    price: product.price,
    image: product.images ? product.images[0] : "",
    isFlashSale: true,
  });

  saveCart();
  showToast("Ditambahkan ke keranjang");
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCartItems();
}

function updateCartUI() {
  const badge = document.getElementById("cartBadge");
  const count = document.getElementById("cartCount");
  const footer = document.getElementById("cartFooter");
  const empty = document.getElementById("cartEmpty");
  const total = document.getElementById("cartTotal");
  if (!badge) return;
  badge.textContent = cart.length;
  count.textContent = cart.length;
  if (cart.length > 0) {
    badge.classList.add("visible");
    footer.style.display = "block";
    empty.style.display = "none";
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    total.textContent = formatPrice(totalPrice);
  } else {
    badge.classList.remove("visible");
    footer.style.display = "none";
    empty.style.display = "flex";
  }
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  if (!container) return;
  const existingItems = container.querySelectorAll(".cart-item");
  existingItems.forEach((item) => item.remove());
  if (cart.length === 0) {
    emptyEl.style.display = "flex";
    return;
  }
  emptyEl.style.display = "none";
  cart.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.innerHTML = `
      <div class="cart-item-image"><img src="${getProxyUrl(item.image)}" alt="Item" onerror="this.src='https://via.placeholder.com/80x80/1a1a1a/d4af37?text=DMK'"></div>
      <div class="cart-item-info"><h4 class="cart-item-name">${item.name}</h4><span class="cart-item-price">${formatPrice(item.price)}</span></div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    `;
    container.appendChild(itemEl);
  });
}

function toggleCart() {
  const cartSection = document.getElementById("cartSection");
  const cartOverlay = document.getElementById("cartOverlay");
  if (!cartSection) return;
  cartSection.classList.toggle("active");
  cartOverlay.classList.toggle("active");
  document.body.style.overflow = cartSection.classList.contains("active")
    ? "hidden"
    : "";
}

function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const btn = document.querySelector(".burger-btn");
  if (!sidebar) return;
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
  btn.classList.toggle("active");
  document.body.style.overflow = sidebar.classList.contains("active")
    ? "hidden"
    : "";
}

// ... (kode awal tetap sama)

// ==================== LOGIC VIEW & RENDER ====================

async function fetchFlashSaleProducts() {
  const grid = document.getElementById("fsCategoryGrid");
  try {
    // Ambil data produk
    const res = await fetch("/api/flashsale");
    if (res.ok) flashSaleProducts = await res.json();

    // Ambil data settings (untuk cover kategori)
    const setRes = await fetch("/api/flashsale/settings");
    const settings = await setRes.json();

    // Simpan ke global untuk digunakan render
    window.fsSettings = settings || {};

    renderCategoryView();
  } catch (err) {
    console.error(err);
  }
}

// 1. TAMPILAN KATEGORI
function renderCategoryView() {
  const grid = document.getElementById("fsCategoryGrid");
  const detailGrid = document.getElementById("flashSaleGrid");
  const backBtn = document.getElementById("backToCategoryBtn");
  const titleEl = document.getElementById("fsPageTitle");
  const subtitleEl = document.getElementById("fsPageSubtitle");

  grid.classList.remove("hidden");
  detailGrid.classList.add("hidden");
  backBtn.classList.add("hidden");
  titleEl.textContent = "Pilih Kategori";
  subtitleEl.textContent = "Klik kategori untuk melihat detail ukuran";

  // Grouping by Category
  const categories = {};
  flashSaleProducts.forEach((p) => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });

  grid.innerHTML = "";

  Object.keys(categories).forEach((cat) => {
    const items = categories[cat];
    const totalStock = items.reduce((sum, item) => sum + (item.stock || 0), 0);
    const salePrices = items.map((i) => i.price).filter((p) => p > 0);
    const originalPrices = items
      .map((i) => i.originalPrice)
      .filter((p) => p > 0);

    const minSale = salePrices.length ? Math.min(...salePrices) : 0;
    const maxSale = salePrices.length ? Math.max(...salePrices) : 0;
    const minOrig = originalPrices.length ? Math.min(...originalPrices) : 0;
    const maxOrig = originalPrices.length ? Math.max(...originalPrices) : 0;

    // CEK COVER KHUSUS DARI SETTINGS, JIKA TIDAK ADA AMBIL DARI PRODUK PERTAMA
    let coverImage = "";
    if (
      window.fsSettings &&
      window.fsSettings.categoryImages &&
      window.fsSettings.categoryImages[cat]
    ) {
      coverImage = window.fsSettings.categoryImages[cat];
    } else {
      coverImage =
        items[0].images && items[0].images[0]
          ? items[0].images[0]
          : "https://via.placeholder.com/400?text=No+Image";
    }

    const card = document.createElement("div");
    card.className = "fs-category-card";
    card.innerHTML = `
      <div class="fs-category-image">
        <span class="fs-category-badge">Flash Sale</span>
        <img src="${getProxyUrl(coverImage)}" alt="${cat}" onerror="this.src='https://via.placeholder.com/400x400/1a1a1a/ef4444?text=Error'">
      </div>
      <div class="fs-category-info">
        <h3 class="fs-category-name">${cat}</h3>
        <p class="fs-category-stock">Stok Tersedia: ${totalStock}</p>
        <div class="fs-category-price-box">
          ${minOrig > 0 ? `<span class="fs-price-original">${formatPrice(minOrig)} - ${formatPrice(maxOrig)}</span>` : ""}
          <span class="fs-price-sale">${minSale === maxSale ? formatPrice(minSale) : `${formatPrice(minSale)} - ${formatPrice(maxSale)}`}</span>
        </div>
        <button class="btn-detail-product" onclick="showDetailCategory('${cat}')">
          Detail Produk
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ... (kode selanjutnya tetap sama)

// 2. TAMPILAN DETAIL VARIAN
function showDetailCategory(category) {
  const grid = document.getElementById("flashSaleGrid");
  const catGrid = document.getElementById("fsCategoryGrid");
  const backBtn = document.getElementById("backToCategoryBtn");
  const titleEl = document.getElementById("fsPageTitle");
  const subtitleEl = document.getElementById("fsPageSubtitle");

  catGrid.classList.add("hidden");
  grid.classList.remove("hidden");
  backBtn.classList.remove("hidden");

  titleEl.textContent = `Kategori: ${category}`;
  subtitleEl.textContent = "Pilih ukuran dan tambahkan ke keranjang";

  // Filter produk berdasarkan kategori
  const filtered = flashSaleProducts.filter((p) => p.category === category);

  grid.innerHTML = "";
  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "flash-card";
    const isOutOfStock = product.stock <= 0;
    const image =
      product.images && product.images[0]
        ? product.images[0]
        : "https://via.placeholder.com/400?text=No+Image";

    card.innerHTML = `
      <div class="flash-image-container">
        <span class="flash-tag">${category}</span>
        <img src="${getProxyUrl(image)}" alt="Varian ${product.size}" onerror="this.src='https://via.placeholder.com/400x400/1a1a1a/ef4444?text=Error'">
      </div>
      <div class="flash-card-info">
        <!-- Tanpa Nama Produk & Harga -->
        <h3 class="flash-card-size">Ukuran: ${product.size || "-"}</h3>
        <p class="flash-card-stock ${isOutOfStock ? "out-of-stock" : "available"}">${isOutOfStock ? "Stok Habis" : `Stok: ${product.stock}`}</p>
        
        <div class="flash-card-actions">
          <button class="btn-fs-cart" onclick='addToCart(${JSON.stringify(product).replace(/'/g, "\\'")})' ${isOutOfStock ? "disabled" : ""}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
             Keranjang
          </button>
          <button class="btn-fs-buy" onclick="buyNow(${product.id})" ${isOutOfStock ? "disabled" : ""}>
             <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
             Checkout
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function showCategoryView() {
  renderCategoryView();
}

// ==================== CHECKOUT LOGIC ====================
function buyNow(productId) {
  const product = flashSaleProducts.find((p) => p.id === productId);
  if (!product || product.stock <= 0) return;

  const itemToBuy = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images ? product.images[0] : "",
  };

  openCheckoutModal([itemToBuy], false);
}

function checkoutAll() {
  if (cart.length === 0) {
    showToast("Keranjang masih kosong");
    return;
  }
  openCheckoutModal(cart, true);
}

function openCheckoutModal(items, fromCart = false) {
  currentCheckoutItems = items;
  isCheckoutFromCart = fromCart;

  const summaryContainer = document.getElementById("modalOrderSummary");
  const totalPriceEl = document.getElementById("modalTotalPrice");
  const modal = document.getElementById("checkoutModal");
  const overlay = document.getElementById("checkoutModalOverlay");

  let summaryHTML = "";
  let total = 0;
  currentCheckoutItems.forEach((item) => {
    summaryHTML += `<div class="summary-item"><span>${item.name}</span><span>${formatPrice(item.price)}</span></div>`;
    total += item.price;
  });
  summaryContainer.innerHTML = summaryHTML;
  totalPriceEl.textContent = formatPrice(total);
  modal.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  const overlay = document.getElementById("checkoutModalOverlay");
  modal.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
  currentCheckoutItems = [];
  isCheckoutFromCart = false;
}

async function confirmCheckout() {
  const selectedPayment = document.querySelector(
    'input[name="paymentMethod"]:checked',
  );
  if (!selectedPayment) {
    showToast("Pilih metode pembayaran");
    return;
  }
  const method = selectedPayment.value;
  let bankInfo = {};
  if (method === "bsi")
    bankInfo = {
      name: "Bank BSI",
      rekening: "7145183485",
      atasNama: "Sri Nofrianti",
    };
  else if (method === "nagari")
    bankInfo = {
      name: "Bank Nagari",
      rekening: "12010210069933",
      atasNama: "Sri Nofrianti",
    };

  try {
    const checkoutData = {
      items: currentCheckoutItems.map((item) => ({ id: item.id, quantity: 1 })),
    };

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutData),
    });
    const result = await response.json();

    if (result.success) {
      let message = `Halo Kak, saya mau order dari DMK Store:\n\n`;
      currentCheckoutItems.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${formatPrice(item.price)}\n`;
        const linkFoto = new URL(
          getProxyUrl(item.image),
          window.location.origin,
        ).href;
        message += `   Link Foto: ${linkFoto}\n`;
      });
      const total = currentCheckoutItems.reduce(
        (sum, item) => sum + item.price,
        0,
      );
      message += `\n*Total: ${formatPrice(total)}*\n\n`;
      message += `*Metode Pembayaran:*\n${bankInfo.name}\nNo Rek: ${bankInfo.rekening}\na.n ${bankInfo.atasNama}\n\n`;
      message += `Mohon konfirmasi ketersediaan. Terima kasih!`;
      window.open(
        `https://wa.me/628116638877?text=${encodeURIComponent(message)}`,
        "_blank",
      );

      if (isCheckoutFromCart) {
        cart = [];
        saveCart();
        toggleCart();
      }

      closeCheckoutModal();
      fetchFlashSaleProducts(); // Refresh
      showToast("Checkout berhasil!");
    } else {
      showToast("Gagal update stok di server.");
    }
  } catch (err) {
    console.error(err);
    showToast("Terjadi error saat checkout.");
  }
}

// ==================== UTILITY ====================
function formatPrice(price) {
  if (!price || isNaN(price)) return "Rp 0";
  return "Rp " + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}
