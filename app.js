/* Online Food Ordering App (Demo)
   - Customer: browse menu, cart, checkout, profile, orders
   - Admin: manage menu, track orders
   - Persistence: localStorage
*/

const STORAGE_KEYS = {
  MENU: "foodapp_menu_v1",
  CART: "foodapp_cart_v1",
  PROFILE: "foodapp_profile_v1",
  ORDERS: "foodapp_orders_v1",
  MODE: "foodapp_mode_v1",
};

const TAX_RATE = 0.08;

// ---------- Utilities ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function money(n) {
  const val = Number(n || 0);
  return `$${val.toFixed(2)}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function load(key, fallback) {
  return safeParse(localStorage.getItem(key), fallback);
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Seed Data ----------
function defaultMenu() {
  return [
    {
      id: uid("m"),
      name: "Classic Cheeseburger",
      category: "Burgers",
      price: 8.99,
      rating: 4.6,
      available: true,
      emoji: "🍔",
      desc: "Juicy beef patty, cheddar, lettuce, tomato, and house sauce.",
      featured: true,
    },
    {
      id: uid("m"),
      name: "Margherita Pizza",
      category: "Pizza",
      price: 11.5,
      rating: 4.5,
      available: true,
      emoji: "🍕",
      desc: "Tomato, mozzarella, basil — simple and perfect.",
      featured: true,
    },
    {
      id: uid("m"),
      name: "Chicken Tikka Wrap",
      category: "Wraps",
      price: 9.25,
      rating: 4.4,
      available: true,
      emoji: "🌯",
      desc: "Spiced chicken, crunchy slaw, mint yogurt in a warm wrap.",
      featured: false,
    },
    {
      id: uid("m"),
      name: "Veggie Power Bowl",
      category: "Healthy",
      price: 10.0,
      rating: 4.2,
      available: true,
      emoji: "🥗",
      desc: "Quinoa, roasted veggies, chickpeas, and lemon tahini.",
      featured: false,
    },
    {
      id: uid("m"),
      name: "Spicy Ramen",
      category: "Noodles",
      price: 12.75,
      rating: 4.7,
      available: true,
      emoji: "🍜",
      desc: "Rich broth, noodles, egg, scallions, and chili oil.",
      featured: true,
    },
    {
      id: uid("m"),
      name: "Chocolate Brownie",
      category: "Dessert",
      price: 4.5,
      rating: 4.8,
      available: true,
      emoji: "🍫",
      desc: "Fudgy brownie with a crisp top. Best warm.",
      featured: false,
    },
  ];
}

function defaultProfile() {
  return {
    name: "Guest User",
    phone: "",
    address: "",
  };
}

// ---------- State ----------
// current user is managed by auth.js (localStorage)
let currentUser = window.Auth?.getCurrentUser?.() ?? null;
let mode = load(STORAGE_KEYS.MODE, currentUser && currentUser.role === 'admin' ? 'admin' : 'customer'); // 'customer' | 'admin'
let menu = load(STORAGE_KEYS.MENU, null) ?? defaultMenu();
let cart = load(STORAGE_KEYS.CART, []);
let profile = load(STORAGE_KEYS.PROFILE, null) ?? defaultProfile();
let orders = load(STORAGE_KEYS.ORDERS, []);

save(STORAGE_KEYS.MENU, menu);
save(STORAGE_KEYS.PROFILE, profile);

// React to auth changes
if (window.Auth && window.Auth.onAuthChange) {
  window.Auth.onAuthChange((nextUser) => {
    currentUser = nextUser;
    // If new user is admin, switch to admin mode automatically
    if (currentUser && currentUser.role === 'admin') setMode('admin');
    else if (mode === 'admin') setMode('customer');
    renderAll();
  });
}

// ---------- Elements ----------
const el = {
  btnCustomerMode: $("#btnCustomerMode"),
  btnAdminMode: $("#btnAdminMode"),
  modeTitle: $("#modeTitle"),
  modeSubtitle: $("#modeSubtitle"),

  customerPanel: $("#customerPanel"),
  adminPanel: $("#adminPanel"),

  searchInput: $("#searchInput"),
  categorySelect: $("#categorySelect"),
  sortSelect: $("#sortSelect"),
  menuGrid: $("#menuGrid"),
  menuMeta: $("#menuMeta"),

  btnOpenCart: $("#btnOpenCart"),
  cartDrawer: $("#cartDrawer"),
  cartCount: $("#cartCount"),
  cartItems: $("#cartItems"),
  cartSubtotal: $("#cartSubtotal"),
  cartTax: $("#cartTax"),
  cartTotal: $("#cartTotal"),
  btnCheckout: $("#btnCheckout"),
  btnClearCart: $("#btnClearCart"),

  btnOpenProfile: $("#btnOpenProfile"),
  profileModal: $("#profileModal"),
  profileForm: $("#profileForm"),
  profileName: $("#profileName"),
  profilePhone: $("#profilePhone"),
  profileAddress: $("#profileAddress"),
  btnResetDemo: $("#btnResetDemo"),

  btnOpenOrders: $("#btnOpenOrders"),
  ordersModal: $("#ordersModal"),
  myOrdersList: $("#myOrdersList"),

  // Admin
  btnOpenAdminAdd: $("#btnOpenAdminAdd"),
  adminItemModal: $("#adminItemModal"),
  adminItemModalTitle: $("#adminItemModalTitle"),
  adminItemForm: $("#adminItemForm"),
  adminItemId: $("#adminItemId"),
  adminItemName: $("#adminItemName"),
  adminItemCategory: $("#adminItemCategory"),
  adminItemPrice: $("#adminItemPrice"),
  adminItemRating: $("#adminItemRating"),
  adminItemAvailable: $("#adminItemAvailable"),
  adminItemDesc: $("#adminItemDesc"),
  adminItemEmoji: $("#adminItemEmoji"),
  btnAdminItemCancel: $("#btnAdminItemCancel"),

  adminMenuTable: $("#adminMenuTable"),
  adminMenuMeta: $("#adminMenuMeta"),
  adminOrdersTable: $("#adminOrdersTable"),
  adminOrdersMeta: $("#adminOrdersMeta"),
};

// ---------- Modal helpers ----------
function openModal(node) {
  node.classList.remove("hidden");
}
function closeModal(node) {
  node.classList.add("hidden");
}
function closeAllModals() {
  closeModal(el.cartDrawer);
  closeModal(el.profileModal);
  closeModal(el.ordersModal);
  closeModal(el.adminItemModal);
}

// Close overlays
document.addEventListener("click", (e) => {
  const closeTarget = e.target?.dataset?.close;
  if (!closeTarget) return;
  if (closeTarget === "cart") closeModal(el.cartDrawer);
  if (closeTarget === "profile") closeModal(el.profileModal);
  if (closeTarget === "orders") closeModal(el.ordersModal);
  if (closeTarget === "adminItem") closeModal(el.adminItemModal);
});

// ---------- Mode switching ----------
function setMode(nextMode) {
  // Only admin users can switch to admin mode
  if (nextMode === "admin" && !(currentUser && currentUser.role === "admin")) {
    alert("Admin access required. Please sign in as admin.");
    window.location.href = "signin.html";
    return;
  }

  mode = nextMode;
  save(STORAGE_KEYS.MODE, mode);
  renderMode();
}

function renderMode() {
  const isAdminActive = mode === "admin" && currentUser && currentUser.role === "admin";

  // Show/hide panels based on both mode and auth role
  el.customerPanel.classList.toggle("hidden", isAdminActive);
  el.adminPanel.classList.toggle("hidden", !isAdminActive);

  // Add visual highlight for admin panel when active
  el.adminPanel.classList.toggle("ring-2", isAdminActive);
  el.adminPanel.classList.toggle("ring-amber-200", isAdminActive);
  el.adminPanel.classList.toggle("border-amber-200", isAdminActive);

  // Profile and orders should be available for customers (not admins)
  el.btnOpenProfile.classList.toggle("hidden", isAdminActive);
  el.btnOpenOrders.classList.toggle("hidden", isAdminActive);

  // Update mode buttons state (visual only)
  el.btnCustomerMode.classList.toggle("bg-slate-900", !isAdminActive);
  el.btnCustomerMode.classList.toggle("text-white", !isAdminActive);
  el.btnAdminMode.classList.toggle("bg-slate-900", isAdminActive);
  el.btnAdminMode.classList.toggle("text-white", isAdminActive);

  // Hide the Customer button when in customer mode (no need to show a 'Customer' badge)
  el.btnCustomerMode.classList.toggle("hidden", !isAdminActive);

  if (isAdminActive) {
    el.modeTitle.textContent = "Admin Dashboard";
    el.modeSubtitle.textContent = "Update menus and track order status.";
  } else {
    el.modeTitle.textContent = "Customer Experience";
    el.modeSubtitle.textContent = "Browse the menu, add items to cart, and checkout.";
  }

  renderAll();
} 

// ---------- Derived data ----------
function getCategories() {
  const cats = new Set(menu.map((m) => m.category.trim()).filter(Boolean));
  return ["all", ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
}

function filteredMenu() {
  const q = (el.searchInput.value || "").trim().toLowerCase();
  const cat = el.categorySelect.value || "all";
  const sort = el.sortSelect.value || "featured";

  let list = [...menu];

  // Filter available for customer view
  list = list.filter((x) => x.available);

  if (cat !== "all") list = list.filter((x) => x.category === cat);

  if (q) {
    list = list.filter((x) => {
      const hay = `${x.name} ${x.category} ${x.desc}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
  if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
  if (sort === "ratingDesc") list.sort((a, b) => b.rating - a.rating);
  if (sort === "featured") {
    list.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }

  return list;
}

function cartTotals() {
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

// ---------- Rendering ----------
function renderCategoryOptions() {
  const cats = getCategories();
  const existing = el.categorySelect.value || "all";
  el.categorySelect.innerHTML = cats
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c === "all" ? "All" : c)}</option>`)
    .join("");
  el.categorySelect.value = cats.includes(existing) ? existing : "all";
}

function renderMenuGrid() {
  const list = filteredMenu();
  el.menuMeta.textContent = `${list.length} item(s)`;

  el.menuGrid.innerHTML = list
    .map((item) => {
      return `
        <article class="rounded-2xl border bg-white p-4 shadow-sm hover:shadow transition">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900/5 text-2xl">
                ${escapeHtml(item.emoji || "🍽️")}
              </div>
              <div>
                <h4 class="font-semibold leading-tight">${escapeHtml(item.name)}</h4>
                <p class="text-xs text-slate-500">${escapeHtml(item.category)}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold">${money(item.price)}</p>
              <p class="text-xs text-slate-500">⭐ ${Number(item.rating).toFixed(1)}</p>
            </div>
          </div>

          <p class="mt-3 text-sm text-slate-600 min-h-[2.75rem]">
            ${escapeHtml(item.desc || "Delicious and freshly made.")}
          </p>

          <div class="mt-4 flex items-center justify-between gap-2">
            <button
              class="rounded-xl border border-sky-200 bg-sky-100 text-sky-900 px-3 py-2 text-sm font-medium transform transition duration-150 hover:bg-sky-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-300"
              data-add="${item.id}">
              Add to Cart
            </button>

            <button
              class="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
              data-buy="${item.id}">
              Buy Now
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  // Bind buttons
  $$("#menuGrid [data-add]").forEach((btn) =>
    btn.addEventListener("click", () => addToCart(btn.dataset.add))
  );
  $$("#menuGrid [data-buy]").forEach((btn) =>
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.buy);
      openModal(el.cartDrawer);
    })
  );
}

function renderCart() {
  const count = cart.reduce((n, l) => n + l.qty, 0);
  el.cartCount.textContent = String(count);

  if (cart.length === 0) {
    el.cartItems.innerHTML = `
      <div class="rounded-2xl border bg-white p-4 text-sm text-slate-600">
        Your cart is empty. Add some items from the menu.
      </div>
    `;
  } else {
    el.cartItems.innerHTML = cart
      .map(
        (line) => `
        <div class="rounded-2xl border bg-white p-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold">${escapeHtml(line.name)}</p>
              <p class="text-xs text-slate-500">${money(line.price)} each</p>
            </div>
            <button class="rounded-xl border px-2 py-1 text-xs hover:bg-slate-50" data-remove="${line.id}">
              Remove
            </button>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button class="h-9 w-9 rounded-xl border hover:bg-slate-50" data-dec="${line.id}">−</button>
              <span class="w-8 text-center font-medium">${line.qty}</span>
              <button class="h-9 w-9 rounded-xl border hover:bg-slate-50" data-inc="${line.id}">+</button>
            </div>

            <p class="font-semibold">${money(line.price * line.qty)}</p>
          </div>
        </div>
      `
      )
      .join("");

    $$("#cartItems [data-inc]").forEach((b) => b.addEventListener("click", () => incQty(b.dataset.inc)));
    $$("#cartItems [data-dec]").forEach((b) => b.addEventListener("click", () => decQty(b.dataset.dec)));
    $$("#cartItems [data-remove]").forEach((b) => b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
  }

  const { subtotal, tax, total } = cartTotals();
  el.cartSubtotal.textContent = money(subtotal);
  el.cartTax.textContent = money(tax);
  el.cartTotal.textContent = money(total);

  // Disable checkout if cart empty
  if (!el.btnCheckout) return;
  if (cart.length === 0) {
    el.btnCheckout.disabled = true;
    el.btnCheckout.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    el.btnCheckout.disabled = false;
    el.btnCheckout.classList.remove("opacity-50", "cursor-not-allowed");
  }
} 

function renderProfile() {
  el.profileName.value = profile.name || "";
  el.profilePhone.value = profile.phone || "";
  el.profileAddress.value = profile.address || "";
}

function renderMyOrders() {
  const mine = [...orders].filter((o) => o.customerName === (profile.name || "Guest User")).reverse();

  if (mine.length === 0) {
    el.myOrdersList.innerHTML = `
      <div class="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
        No orders yet. Checkout to place your first order.
      </div>
    `;
    return;
  }

  el.myOrdersList.innerHTML = mine
    .map((o) => {
      const itemsText = o.items.map((i) => `${i.name} × ${i.qty}`).join(", ");
      return `
        <div class="rounded-2xl border bg-white p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs text-slate-500">Order ID</p>
              <p class="font-semibold">${escapeHtml(o.id)}</p>
              <p class="mt-1 text-sm text-slate-600">${escapeHtml(itemsText)}</p>
              <p class="mt-1 text-xs text-slate-500">Placed: ${escapeHtml(new Date(o.createdAt).toLocaleString())}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold">${money(o.total)}</p>
              <span class="mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-medium">
                ${escapeHtml(o.status)}
              </span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderAdminMenu() {
  el.adminMenuMeta.textContent = `${menu.length} item(s)`;
  el.adminMenuTable.innerHTML = menu
    .map((m) => {
      return `
        <tr class="border-b last:border-b-0">
          <td class="py-2 pr-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">${escapeHtml(m.emoji || "🍽️")}</span>
              <div>
                <div class="font-medium">${escapeHtml(m.name)}</div>
                <div class="text-xs text-slate-500">${escapeHtml(m.desc || "")}</div>
              </div>
            </div>
          </td>
          <td class="py-2 pr-3">${escapeHtml(m.category)}</td>
          <td class="py-2 pr-3">${money(m.price)}</td>
          <td class="py-2 pr-3">⭐ ${Number(m.rating).toFixed(1)}</td>
          <td class="py-2 pr-3">
            <button class="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50" data-toggle="${m.id}">
              ${m.available ? "Yes" : "No"}
            </button>
          </td>
          <td class="py-2 pr-3 text-right">
            <button class="rounded-xl border px-3 py-1 text-xs hover:bg-slate-50" data-edit="${m.id}">Edit</button>
            <button class="ml-2 rounded-xl border px-3 py-1 text-xs hover:bg-slate-50" data-del="${m.id}">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  $$("#adminMenuTable [data-toggle]").forEach((b) =>
    b.addEventListener("click", () => toggleAvailability(b.dataset.toggle))
  );
  $$("#adminMenuTable [data-edit]").forEach((b) =>
    b.addEventListener("click", () => openAdminEdit(b.dataset.edit))
  );
  $$("#adminMenuTable [data-del]").forEach((b) =>
    b.addEventListener("click", () => deleteMenuItem(b.dataset.del))
  );
}

function renderAdminOrders() {
  el.adminOrdersMeta.textContent = `${orders.length} order(s)`;
  const list = [...orders].slice().reverse();

  if (list.length === 0) {
    el.adminOrdersTable.innerHTML = `
      <tr>
        <td colspan="6" class="py-3 text-sm text-slate-600">
          No orders yet. Switch to Customer mode and checkout to create one.
        </td>
      </tr>
    `;
    return;
  }

  el.adminOrdersTable.innerHTML = list
    .map((o) => {
      const items = o.items.map((i) => `${i.name} × ${i.qty}`).join(", ");
      return `
        <tr class="border-b last:border-b-0">
          <td class="py-2 pr-3">
            <div class="font-medium">${escapeHtml(o.id)}</div>
            <div class="text-xs text-slate-500">${escapeHtml(new Date(o.createdAt).toLocaleString())}</div>
          </td>
          <td class="py-2 pr-3">
            <div class="font-medium">${escapeHtml(o.customerName)}</div>
            <div class="text-xs text-slate-500">${escapeHtml(o.customerPhone || "")}</div>
          </td>
          <td class="py-2 pr-3 text-slate-600">${escapeHtml(items)}</td>
          <td class="py-2 pr-3 font-medium">${money(o.total)}</td>
          <td class="py-2 pr-3">
            <span class="inline-flex rounded-full border px-2 py-1 text-xs font-medium">${escapeHtml(o.status)}</span>
          </td>
          <td class="py-2 pr-3 text-right">
            <select class="rounded-xl border px-2 py-1 text-xs" data-status="${o.id}">
              ${["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"]
                .map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`)
                .join("")}
            </select>
          </td>
        </tr>
      `;
    })
    .join("");

  $$("#adminOrdersTable [data-status]").forEach((sel) =>
    sel.addEventListener("change", () => updateOrderStatus(sel.dataset.status, sel.value))
  );
}

function renderAll() {
  renderCategoryOptions();
  renderMenuGrid();
  renderCart();
  renderProfile();
  renderMyOrders();
  renderAdminMenu();
  renderAdminOrders();
}

// ---------- Cart Actions ----------
function addToCart(menuId) {
  const item = menu.find((m) => m.id === menuId);
  if (!item || !item.available) return;

  const existing = cart.find((c) => c.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });

  save(STORAGE_KEYS.CART, cart);
  renderCart();
}

function incQty(id) {
  const line = cart.find((c) => c.id === id);
  if (!line) return;
  line.qty += 1;
  save(STORAGE_KEYS.CART, cart);
  renderCart();
}

function decQty(id) {
  const line = cart.find((c) => c.id === id);
  if (!line) return;
  line.qty -= 1;
  if (line.qty <= 0) cart = cart.filter((c) => c.id !== id);
  save(STORAGE_KEYS.CART, cart);
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  save(STORAGE_KEYS.CART, cart);
  renderCart();
}

function clearCart() {
  cart = [];
  save(STORAGE_KEYS.CART, cart);
  renderCart();
}

function checkout() {
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }

  const { total } = cartTotals();

  // Simulate payment success
  const order = {
    id: uid("order"),
    customerName: (currentUser && currentUser.name) || profile.name || "Guest User",
    customerPhone: profile.phone || "",
    customerAddress: profile.address || "",
    items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
    total: Number(total.toFixed(2)),
    status: "Placed",
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  save(STORAGE_KEYS.ORDERS, orders);

  clearCart();
  closeModal(el.cartDrawer);

  alert(`Order placed! Order ID: ${order.id}`);
}

// ---------- Profile ----------
function saveProfileFromForm(e) {
  e.preventDefault();
  profile = {
    name: el.profileName.value.trim() || "Guest User",
    phone: el.profilePhone.value.trim(),
    address: el.profileAddress.value.trim(),
  };
  save(STORAGE_KEYS.PROFILE, profile);
  renderProfile();
  alert("Profile saved.");
  closeModal(el.profileModal);
}

function resetDemoData() {
  if (!confirm("Reset demo data? This clears menu, cart, profile, and orders.")) return;

  menu = defaultMenu();
  cart = [];
  profile = defaultProfile();
  orders = [];

  save(STORAGE_KEYS.MENU, menu);
  save(STORAGE_KEYS.CART, cart);
  save(STORAGE_KEYS.PROFILE, profile);
  save(STORAGE_KEYS.ORDERS, orders);

  renderAll();
  alert("Demo data reset.");
}

// ---------- Admin Menu ----------
function openAdminAdd() {
  el.adminItemModalTitle.textContent = "Add Menu Item";
  el.adminItemId.value = "";
  el.adminItemName.value = "";
  el.adminItemCategory.value = "";
  el.adminItemPrice.value = "";
  el.adminItemRating.value = "4.0";
  el.adminItemAvailable.value = "true";
  el.adminItemDesc.value = "";
  el.adminItemEmoji.value = "";
  openModal(el.adminItemModal);
}

function openAdminEdit(id) {
  const item = menu.find((m) => m.id === id);
  if (!item) return;
  el.adminItemModalTitle.textContent = "Edit Menu Item";
  el.adminItemId.value = item.id;
  el.adminItemName.value = item.name;
  el.adminItemCategory.value = item.category;
  el.adminItemPrice.value = item.price;
  el.adminItemRating.value = item.rating;
  el.adminItemAvailable.value = String(item.available);
  el.adminItemDesc.value = item.desc || "";
  el.adminItemEmoji.value = item.emoji || "";
  openModal(el.adminItemModal);
}

function saveAdminItem(e) {
  e.preventDefault();

  const id = el.adminItemId.value.trim();
  const name = el.adminItemName.value.trim();
  const category = el.adminItemCategory.value.trim();
  const price = Number(el.adminItemPrice.value);
  const rating = Number(el.adminItemRating.value);
  const available = el.adminItemAvailable.value === "true";
  const desc = el.adminItemDesc.value.trim();
  const emoji = el.adminItemEmoji.value.trim();

  if (!name || !category || Number.isNaN(price) || Number.isNaN(rating)) {
    alert("Please fill required fields correctly.");
    return;
  }

  if (id) {
    const idx = menu.findIndex((m) => m.id === id);
    if (idx >= 0) {
      menu[idx] = { ...menu[idx], name, category, price, rating, available, desc, emoji };
    }
  } else {
    menu.push({
      id: uid("m"),
      name,
      category,
      price,
      rating,
      available,
      desc,
      emoji,
      featured: false,
    });
  }

  save(STORAGE_KEYS.MENU, menu);
  renderAll();
  closeModal(el.adminItemModal);
}

function deleteMenuItem(id) {
  const item = menu.find((m) => m.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}"?`)) return;

  menu = menu.filter((m) => m.id !== id);

  // Also remove from cart if present
  cart = cart.filter((c) => c.id !== id);

  save(STORAGE_KEYS.MENU, menu);
  save(STORAGE_KEYS.CART, cart);

  renderAll();
}

function toggleAvailability(id) {
  const item = menu.find((m) => m.id === id);
  if (!item) return;
  item.available = !item.available;
  save(STORAGE_KEYS.MENU, menu);

  // If item became unavailable, remove from cart
  if (!item.available) {
    cart = cart.filter((c) => c.id !== id);
    save(STORAGE_KEYS.CART, cart);
  }

  renderAll();
}

// ---------- Admin Orders ----------
function updateOrderStatus(orderId, nextStatus) {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;
  order.status = nextStatus;
  save(STORAGE_KEYS.ORDERS, orders);
  renderAdminOrders();
  renderMyOrders();
}

// ---------- Security-ish: basic HTML escaping ----------
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Events ----------
el.btnCustomerMode.addEventListener("click", () => setMode("customer"));
el.btnAdminMode.addEventListener("click", () => setMode("admin"));

el.btnOpenCart.addEventListener("click", () => openModal(el.cartDrawer));
el.btnClearCart.addEventListener("click", clearCart);
el.btnCheckout.addEventListener("click", checkout);

el.btnOpenProfile.addEventListener("click", () => {
  renderProfile();
  openModal(el.profileModal);
});
el.profileForm.addEventListener("submit", saveProfileFromForm);
el.btnResetDemo.addEventListener("click", resetDemoData);

// Ensure header reflects current auth state (if auth.js is present)
if (window.Auth && window.Auth.renderHeader) window.Auth.renderHeader();

el.btnOpenOrders.addEventListener("click", () => {
  renderMyOrders();
  openModal(el.ordersModal);
});

el.searchInput.addEventListener("input", renderMenuGrid);
el.categorySelect.addEventListener("change", renderMenuGrid);
el.sortSelect.addEventListener("change", renderMenuGrid);

// Admin
el.btnOpenAdminAdd.addEventListener("click", openAdminAdd);
el.btnAdminItemCancel.addEventListener("click", () => closeModal(el.adminItemModal));
el.adminItemForm.addEventListener("submit", saveAdminItem);

// Close ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllModals();
});

// ---------- Init ----------
renderMode();
