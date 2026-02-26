// ==================== NEW RELEASE DATA ====================
let newReleaseProducts = [];
let cart = [];

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", function () {
  loadCart();
  fetchNewReleaseProducts();
});

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
  const product = newReleaseProducts.find((p) => p.id === productId);
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
  fetchNewReleaseProducts(); // Refresh
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
  const p = newReleaseProducts.find((x) => x.id === id);
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
async function fetchNewReleaseProducts() {
  try {
    const res = await fetch("/api/newrelease");
    if (res.ok) {
      newReleaseProducts = await res.json();
      renderNewReleaseProducts("all");
    }
  } catch (err) {
    console.error(err);
  }
}

function renderNewReleaseProducts(category) {
  const grid = document.getElementById("newReleaseGrid");
  const empty = document.getElementById("emptyState");
  const tabs = document.querySelectorAll(".category-tab");
  tabs.forEach((tab) =>
    tab.classList.toggle("active", tab.dataset.category === category),
  );

  let filtered =
    category === "all"
      ? newReleaseProducts
      : newReleaseProducts.filter((p) => p.category === category);
  grid.innerHTML = "";
  if (filtered.length === 0) {
    empty.style.display = "block";
    grid.style.display = "none";
    return;
  }
  empty.style.display = "none";
  grid.style.display = "grid";

  filtered.forEach((product) => {
    const card = document.createElement("div");
    card.className = "new-release-card";
    const isOutOfStock = product.stock <= 0;
    card.innerHTML = `
      <div class="nr-image-container">
        <span class="new-release-tag">New</span>
        <span class="card-category-tag">${product.category}</span>
        <img src="${product.images[0]}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400'">
      </div>
      <div class="nr-card-info">
        <h3 class="nr-card-name">${product.name}</h3>
        <div class="nr-card-meta"><span>Ukuran: ${product.size}</span></div>
        <p class="nr-stock ${isOutOfStock ? "out-of-stock" : "available"}">${isOutOfStock ? "Stok Habis" : `Stok: ${product.stock}`}</p>
        <p class="nr-card-price">${formatPrice(product.price)}</p>
        <div class="nr-card-actions">
          <button class="nr-btn-cart" onclick="addToCart(${product.id})" ${isOutOfStock ? "disabled" : ""}>Keranjang</button>
          <button class="nr-btn-buy" onclick="buyNow(${product.id})" ${isOutOfStock ? "disabled" : ""}>Beli</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
}

function filterNewRelease(category) {
  renderNewReleaseProducts(category);
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
