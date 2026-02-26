// ==================== VARIABEL GLOBAL ====================
let products = [];
let cart = [];
let currentCategory = "all";

// ==================== INISIALISASI ====================
document.addEventListener("DOMContentLoaded", function () {
  loadCart();
  fetchProducts();
  loadSidebarCategories(); // PENTING: Load kategori dinamis
  setupScrollEffects();
  setupNavbar();
});

// ==================== FUNGSI KATEGORI DINAMIS (BARU) ====================
async function loadSidebarCategories() {
  try {
    const res = await fetch("/api/categories");
    const categories = await res.json();

    const sidebarNav = document.querySelector(".sidebar nav");
    if (!sidebarNav) return;

    const label = sidebarNav.querySelector(".menu-category-label");

    // Hapus menu lama setelah label
    const children = Array.from(sidebarNav.children);
    let startRemoving = false;
    children.forEach((child) => {
      if (startRemoving) {
        sidebarNav.removeChild(child);
      }
      if (child === label) {
        startRemoving = true;
      }
    });

    // Tambah "Semua Produk"
    const allLink = document.createElement("a");
    allLink.href = "#";
    allLink.className = "menu-item sub-item";
    allLink.setAttribute("data-category", "all");
    allLink.onclick = () => {
      filterProducts("all");
      return false;
    };
    allLink.innerHTML = `Semua Produk`;
    sidebarNav.appendChild(allLink);

    // Tambah kategori dari DB
    categories.forEach((cat) => {
      const link = document.createElement("a");
      link.href = "#";
      link.className = "menu-item sub-item";
      link.setAttribute("data-category", cat);
      link.onclick = () => {
        filterProducts(cat);
        return false;
      };
      // Kapitalisasi huruf pertama
      const capitalizedName = cat.charAt(0).toUpperCase() + cat.slice(1);
      link.innerHTML = capitalizedName;
      sidebarNav.appendChild(link);
    });
  } catch (err) {
    console.error("Gagal memuat kategori sidebar", err);
  }
}

// ==================== FUNGSI FETCH DATA DARI SERVER ====================
async function fetchProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Gagal memuat data");
    products = await response.json();
    renderProducts(currentCategory);
  } catch (error) {
    console.error("Error:", error);
    const grid = document.getElementById("productsGrid");
    if (grid)
      grid.innerHTML = `<div class="text-center py-12 col-span-full text-red-500">Gagal memuat data produk.</div>`;
  }
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

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  if (product.stock <= 0) {
    showToast("Maaf, stok produk ini habis.");
    return;
  }

  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    showToast("Produk sudah ada di keranjang");
    return;
  }

  cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    image:
      product.images && product.images[0]
        ? product.images[0]
        : "https://via.placeholder.com/400",
  });

  saveCart();
  showToast("Produk ditambahkan ke keranjang");

  const btn = document.querySelector(`[data-product-id="${productId}"]`);
  if (btn) {
    btn.classList.add("added");
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Ada`;
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCartItems();
  const btn = document.querySelector(`[data-product-id="${productId}"]`);
  if (btn) {
    btn.classList.remove("added");
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`;
  }
}

function updateCartUI() {
  const badge = document.getElementById("cartBadge");
  const count = document.getElementById("cartCount");
  const footer = document.getElementById("cartFooter");
  const empty = document.getElementById("cartEmpty");
  const total = document.getElementById("cartTotal");

  if (badge) badge.textContent = cart.length;
  if (count) count.textContent = cart.length;

  if (cart.length > 0) {
    if (badge) badge.classList.add("visible");
    if (footer) footer.style.display = "block";
    if (empty) empty.style.display = "none";
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    if (total) total.textContent = formatPrice(totalPrice);
  } else {
    if (badge) badge.classList.remove("visible");
    if (footer) footer.style.display = "none";
    if (empty) empty.style.display = "flex";
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
    if (emptyEl) emptyEl.style.display = "flex";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";
  cart.forEach((item) => {
    const itemEl = document.createElement("div");
    itemEl.className = "cart-item";
    itemEl.innerHTML = `
      <div class="cart-item-image"><img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80x80/1a1a1a/d4af37?text=DMK'"></div>
      <div class="cart-item-info"><h4 class="cart-item-name">${item.name}</h4><span class="cart-item-price">${formatPrice(item.price)}</span></div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Hapus"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    `;
    container.appendChild(itemEl);
  });
}

function toggleCart() {
  const cartSection = document.getElementById("cartSection");
  const cartOverlay = document.getElementById("cartOverlay");
  if (!cartSection || !cartOverlay) return;
  cartSection.classList.toggle("active");
  cartOverlay.classList.toggle("active");
  document.body.style.overflow = cartSection.classList.contains("active")
    ? "hidden"
    : "";
}

// ==================== FUNGSI PRODUK ====================
function renderProducts(category) {
  currentCategory = category;
  const grid = document.getElementById("productsGrid");
  const tag = document.getElementById("categoryTag");
  const title = document.getElementById("categoryTitle");

  if (!grid) return;

  let filteredProducts =
    category === "all"
      ? products
      : products.filter((p) => p.category === category);

  // Update Header
  const categoryNames = { all: "Semua Produk" }; // Default
  // Nanti bisa diupdate dinamis juga jika perlu

  if (tag) tag.textContent = "Koleksi Kami";
  if (title)
    title.innerHTML = `<span class="highlight">${category.charAt(0).toUpperCase() + category.slice(1)}</span>`;

  grid.innerHTML = "";
  if (filteredProducts.length === 0) {
    grid.innerHTML = `<div class="text-center py-12 col-span-full"><p class="text-gray-400 text-lg">Belum ada produk dalam kategori ini</p></div>`;
    return;
  }

  filteredProducts.forEach((product, index) => {
    const card = document.createElement("div");
    card.className = "product-card reveal";
    card.style.animationDelay = `${index * 0.1}s`;
    const isInCart = cart.some((item) => item.id === product.id);
    const isOutOfStock = product.stock <= 0;
    const productImages =
      product.images && product.images.length > 0
        ? product.images
        : ["https://via.placeholder.com/400x400/1a1a1a/d4af37?text=DMK"];
    let stockHTML = isOutOfStock
      ? `<p class="product-stock out-of-stock">Stok Habis</p>`
      : `<p class="product-stock available">Stok: ${product.stock}</p>`;

    card.innerHTML = `
      <div class="product-image-container">
        <span class="product-tag">${product.category}</span>
        ${isOutOfStock ? '<span class="sold-out-badge">HABIS</span>' : ""}
        <div class="product-slider" id="slider-${product.id}">
          ${productImages.map((img, i) => `<div class="product-slide"><img src="${img}" alt="${product.name}"></div>`).join("")}
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-size">Ukuran: ${product.size}</p>
        ${stockHTML}
        <p class="product-price">${formatPrice(product.price)}</p>
        <div class="product-actions">
          <button class="btn-detail" onclick="openProductDetail(${product.id})">Lihat Deskripsi</button>
          <button class="btn-cart ${isInCart ? "added" : ""}" data-product-id="${product.id}" onclick="addToCart(${product.id})" ${isOutOfStock ? "disabled" : ""}>
            ${isInCart ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Ada` : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`}
          </button>
          <button class="btn-buy" onclick="buyNow(${product.id})" ${isOutOfStock ? "disabled" : ""}>Beli</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  setTimeout(() => {
    document
      .querySelectorAll(".product-card.reveal")
      .forEach((el) => el.classList.add("active"));
  }, 100);

  closeMenu();
}

function filterProducts(category) {
  renderProducts(category);
  const el = document.getElementById("products");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// ==================== FUNGSI BELI & CHECKOUT ====================
function buyNow(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product || product.stock <= 0) return;
  const isInCart = cart.some((item) => item.id === productId);
  if (!isInCart) {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image:
        product.images && product.images[0]
          ? product.images[0]
          : "https://via.placeholder.com/400",
    });
    saveCart();
    const btn = document.querySelector(`[data-product-id="${productId}"]`);
    if (btn) {
      btn.classList.add("added");
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Ditambahkan`;
    }
  }
  openCheckoutModal();
}

function checkoutAll() {
  if (cart.length === 0) {
    showToast("Keranjang masih kosong");
    return;
  }
  openCheckoutModal();
}

function openCheckoutModal() {
  const summaryContainer = document.getElementById("modalOrderSummary");
  const totalPriceEl = document.getElementById("modalTotalPrice");
  const modal = document.getElementById("checkoutModal");
  const overlay = document.getElementById("checkoutModalOverlay");
  if (!summaryContainer || !modal || !overlay) return;

  let summaryHTML = "";
  let total = 0;
  cart.forEach((item) => {
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
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
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

  // Proses checkout ke server
  try {
    const checkoutData = {
      items: cart.map((item) => ({ id: item.id, quantity: 1 })),
    };
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(checkoutData),
    });
    const result = await response.json();
    if (result.success) {
      let message = `Halo Kak, saya mau order dari DMK Store:\n\n`;
      cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name} - ${formatPrice(item.price)}\n`;
        message += `   Link Foto: ${item.image}\n`;
      });
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      message += `\n*Total: ${formatPrice(total)}*\n\n`;
      message += `*Metode Pembayaran:*\n${bankInfo.name}\nNo Rek: ${bankInfo.rekening}\na.n ${bankInfo.atasNama}\n\n`;
      message += `Mohon konfirmasi ketersediaan. Terima kasih!`;
      window.open(
        `https://wa.me/628116638877?text=${encodeURIComponent(message)}`,
        "_blank",
      );
      cart = [];
      saveCart();
      closeCheckoutModal();
      toggleCart();
      fetchProducts(); // Refresh stok
      showToast("Checkout berhasil!");
    } else {
      showToast("Gagal memproses checkout di server.");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    showToast("Terjadi kesalahan saat checkout.");
  }
}

// ==================== FUNGSI NAVIGASI ====================
function toggleMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const btn = document.querySelector(".burger-btn");
  if (!sidebar || !overlay || !btn) return;
  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
  btn.classList.toggle("active");
  const isExpanded = sidebar.classList.contains("active");
  btn.setAttribute("aria-expanded", isExpanded);
  document.body.style.overflow = isExpanded ? "hidden" : "";
  document.body.classList.toggle("menu-open", isExpanded);
}

function closeMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const btn = document.querySelector(".burger-btn");
  if (!sidebar || !overlay || !btn) return;
  sidebar.classList.remove("active");
  overlay.classList.remove("active");
  btn.classList.remove("active");
  btn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  document.body.classList.remove("menu-open");
}

function showHome() {
  filterProducts("all");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==================== FUNGSI UTILITAS ====================
function formatPrice(price) {
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

function setupScrollEffects() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("active");
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function setupNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 100) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  });
}

// ==================== FUNGSI MODAL DETAIL PRODUK ====================
function openProductDetail(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const modal = document.getElementById("productModal");
  const overlay = document.getElementById("productModalOverlay");
  const content = document.getElementById("productModalContent");
  const title = document.getElementById("productModalTitle");
  if (!modal || !content || !title) return;

  title.textContent = product.name;
  const isOutOfStock = product.stock <= 0;
  const stockStatus = isOutOfStock
    ? `<span style="color:#ef4444; font-weight:bold;">Stok Habis</span>`
    : `<span style="color:#22c55e;">Stok: ${product.stock}</span>`;

  content.innerHTML = `
    <img src="${product.images && product.images[0] ? product.images[0] : "https://via.placeholder.com/500x300/1a1a1a/d4af37?text=DMK"}" alt="${product.name}" class="product-modal-image" onerror="this.src='https://via.placeholder.com/500x300/1a1a1a/d4af37?text=DMK'">
    <div class="product-modal-info">
      <div class="product-modal-price">${formatPrice(product.price)}</div>
      <div class="product-modal-meta"><span>Kategori: ${product.category}</span><span>Ukuran: ${product.size}</span></div>
      ${stockStatus}
      <h4 class="product-modal-desc-title">Deskripsi Produk</h4>
      <p class="product-modal-desc-text">${product.description || "Tidak ada deskripsi."}</p>
      <div class="product-modal-actions">
        <button class="btn-buy" onclick="buyNow(${product.id}); closeProductDetail();" ${isOutOfStock ? "disabled" : ""}>Beli via WA</button>
      </div>
    </div>
  `;
  modal.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeProductDetail() {
  const modal = document.getElementById("productModal");
  const overlay = document.getElementById("productModalOverlay");
  if (modal) modal.classList.remove("active");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
}
