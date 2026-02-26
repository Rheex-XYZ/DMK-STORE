// ==================== FLASH SALE DATA ====================
let flashSaleProducts = [];
let FLASH_SALE_END = new Date();
let cart = [];

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
        "<div class='flash-empty-state'><h3>Flash Sale Berakhir</h3><p>Simpan jadwal baru di Admin Panel untuk memulai.</p></div>";
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

// ==================== KERANJANG ====================
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

function addToCart(productId) {
  const product = flashSaleProducts.find((p) => p.id === productId);
  if (!product || product.stock <= 0) return;
  if (cart.find((item) => item.id === productId)) {
    showToast("Sudah ada di keranjang");
    return;
  }

  cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.images ? product.images[0] : "",
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
    total.textContent = formatPrice(
      cart.reduce((sum, item) => sum + item.price, 0),
    );
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
  container.querySelectorAll(".cart-item").forEach((item) => item.remove());
  if (cart.length === 0) {
    emptyEl.style.display = "flex";
    return;
  }
  emptyEl.style.display = "none";
  cart.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.innerHTML = `
      <div class="cart-item-image"><img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80'"></div>
      <div class="cart-item-info"><h4 class="cart-item-name">${item.name}</h4><span class="cart-item-price">${formatPrice(item.price)}</span></div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
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

// ==================== MODAL CHECKOUT ====================
function openCheckoutModal() {
  const summary = document.getElementById("modalOrderSummary");
  const totalEl = document.getElementById("modalTotalPrice");
  const modal = document.getElementById("checkoutModal");
  const overlay = document.getElementById("checkoutModalOverlay");
  let html = "";
  let total = 0;
  cart.forEach((item) => {
    html += `<div class="summary-item"><span>${item.name}</span><span>${formatPrice(item.price)}</span></div>`;
    total += item.price;
  });
  summary.innerHTML = html;
  totalEl.textContent = formatPrice(total);
  modal.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}
function closeCheckoutModal() {
  document.getElementById("checkoutModal").classList.remove("active");
  document.getElementById("checkoutModalOverlay").classList.remove("active");
  document.body.style.overflow = "";
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
  const bankInfo =
    method === "bsi"
      ? { name: "Bank BSI", rekening: "7145183485", atasNama: "Sri Nofrianti" }
      : {
          name: "Bank Nagari",
          rekening: "12010210069933",
          atasNama: "Sri Nofrianti",
        };

  // Update Stok
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ id: i.id, quantity: 1 })),
      }),
    });
    const result = await res.json();
    if (!result.success) {
      showToast("Error: " + (result.message || "Gagal update stok"));
      return;
    }
  } catch (e) {
    showToast("Gagal koneksi server");
    return;
  }

  // WhatsApp
  let message = `Halo Kak, saya mau order dari DMK Store:\n\n`;
  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name} - ${formatPrice(item.price)}\n   Link: ${item.image}\n`;
  });
  message += `\n*Total: ${formatPrice(cart.reduce((s, i) => s + i.price, 0))}*\n\n*Pembayaran:*\n${bankInfo.name}\n${bankInfo.rekening}\na.n ${bankInfo.atasNama}\n\nTerima kasih!`;
  window.open(
    `https://wa.me/628116638877?text=${encodeURIComponent(message)}`,
    "_blank",
  );

  cart = [];
  saveCart();
  closeCheckoutModal();
  toggleCart();
  fetchFlashSaleProducts(); // Refresh
  showToast("Checkout berhasil!");
}

function checkoutAll() {
  if (cart.length === 0) {
    showToast("Keranjang kosong");
    return;
  }
  openCheckoutModal();
}
function buyNow(id) {
  const p = flashSaleProducts.find((x) => x.id === id);
  if (!p || p.stock <= 0) return;
  if (!cart.find((i) => i.id === id)) {
    cart.push({ id: p.id, name: p.name, price: p.price, image: p.images[0] });
    saveCart();
  }
  openCheckoutModal();
}
function toggleMenu() {
  const s = document.getElementById("sidebar");
  const o = document.getElementById("sidebarOverlay");
  const b = document.querySelector(".burger-btn");
  if (!s) return;
  s.classList.toggle("active");
  o.classList.toggle("active");
  b.classList.toggle("active");
  document.body.style.overflow = s.classList.contains("active") ? "hidden" : "";
}

// ==================== RENDER PRODUK ====================
async function fetchFlashSaleProducts() {
  const grid = document.getElementById("flashSaleGrid");
  try {
    const res = await fetch("/api/flashsale");
    if (res.ok) {
      flashSaleProducts = await res.json();
      renderFlashSaleProducts();
    }
  } catch (err) {
    console.error(err);
  }
}

function renderFlashSaleProducts() {
  const grid = document.getElementById("flashSaleGrid");
  if (!grid) return;
  if (flashSaleProducts.length === 0) {
    grid.innerHTML =
      "<p class='text-gray-500 col-span-2'>Belum ada produk.</p>";
    return;
  }
  grid.innerHTML = "";
  flashSaleProducts.forEach((product) => {
    const card = document.createElement("div");
    card.className = "flash-card";
    const isOutOfStock = product.stock <= 0;
    const imgSrc =
      product.images && product.images[0]
        ? product.images[0]
        : "https://via.placeholder.com/400";
    card.innerHTML = `
      <div class="flash-image-container">
        <span class="flash-tag">Flash Sale</span>
        <span class="discount-badge">-${product.discount || 0}%</span>
        <img src="${imgSrc}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400'">
      </div>
      <div class="flash-card-info">
        <h3 class="flash-card-name">${product.name}</h3>
        <div class="flash-card-meta"><span>Ukuran: ${product.size || "-"}</span></div>
        <div class="flash-price-section">
          <span class="flash-price-original">${product.originalPrice ? formatPrice(product.originalPrice) : ""}</span>
          <span class="flash-price-sale">${formatPrice(product.price)}</span>
        </div>
        <p class="flash-stock ${isOutOfStock ? "out-of-stock" : "available"}">${isOutOfStock ? "Stok Habis!" : `Tersisa ${product.stock}`}</p>
        <div class="stock-progress"><div class="stock-progress-bar" style="width: ${product.stock > 0 ? 50 : 0}%"></div></div>
        <div class="flash-card-actions">
          <button class="flash-btn-cart" onclick="addToCart(${product.id})" ${isOutOfStock ? "disabled" : ""}>Keranjang</button>
          <button class="flash-btn-buy" onclick="buyNow(${product.id})" ${isOutOfStock ? "disabled" : ""}>Beli</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

// ==================== UTILITY ====================
function formatPrice(price) {
  if (!price || isNaN(price)) return "Rp 0";
  return "Rp " + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function showToast(message) {
  const t = document.getElementById("toast");
  const tm = document.getElementById("toastMessage");
  if (t && tm) {
    tm.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
  }
}
