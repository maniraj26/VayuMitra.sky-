import {
  getAuthToken,
  getCurrentUser,
  removeAuthToken,
  removeCurrentUser,
} from "./api.js";

import { productsAPI, cartAPI } from "./api.js";

// ---------------------- AUTH CHECK ----------------------

let currentUser = getCurrentUser();

if (!currentUser || !getAuthToken()) {
  const path = window.location.pathname;

  if (!path.includes("login") && !path.includes("register")) {
    alert("Please login to continue");
    window.location.href = "../user-login.html";
  }
}

// ---------------------- CATEGORY HELPERS ----------------------

const getCategoryFromURL = () => {
  const path = window.location.pathname;

  if (path.includes("food")) return "food";
  if (path.includes("grocery")) return "grocery";
  if (path.includes("medicine")) return "medicine";
  if (path.includes("parcel")) return "parcel";

  return "food"; // default
};

const getGridSelector = () => {
  const cat = getCategoryFromURL();
  return {
    food: ".food-grid",
    grocery: ".Grocery-grid",
    medicine: ".Medicine-grid",
    parcel: ".food-grid",
  }[cat];
};

const getItemClass = () => {
  const cat = getCategoryFromURL();
  return {
    food: "food-item",
    grocery: "Grocery-item",
    medicine: "Medicine-item",
    parcel: "food-item",
  }[cat];
};

// ---------------------- LOAD PRODUCTS ----------------------

const loadProducts = async () => {
  try {
    const category = getCategoryFromURL();
    const productGrid = document.querySelector(getGridSelector());

    if (!productGrid) return;

    productGrid.innerHTML =
      '<div style="text-align:center;padding:20px;"><p>Loading...</p></div>';

    const { success, products } = await productsAPI.getAll({ category });

    if (success && products.length) {
      renderProducts(products);
    } else {
      productGrid.innerHTML =
        "<div style='text-align:center;padding:20px;'>No products found.</div>";
    }
  } catch (err) {
    console.error("Product load error:", err);
    const grid = document.querySelector(getGridSelector());
    if (grid)
      grid.innerHTML =
        "<div style='color:#f00;text-align:center;'>Failed to load products.</div>";
  }
};

// ---------------------- IMAGE HANDLER ----------------------

const getImageUrl = (item) => {
  if (!item.image) return "../images/default.png";

  if (item.image.startsWith("http")) return item.image;

  if (item.image.startsWith("/uploads"))
    return `http://localhost:5000${item.image}`;

  return item.image;
};

// ---------------------- RENDER PRODUCTS ----------------------

const renderProducts = (products) => {
  const grid = document.querySelector(getGridSelector());
  const itemClass = getItemClass();

  if (!grid) return;

  grid.innerHTML = products
    .map((p) => {
      const img = getImageUrl(p);
      const sub = p.subCategory || "all";

      return `
        <div class="${itemClass}" data-category="${sub}" data-product-id="${
        p._id
      }">
            <img src="${img}" alt="${
        p.name
      }" onerror="this.src='../images/default.png'">
            <h3>${p.name}</h3>
            <p>${p.description || ""}</p>
            <div class="price">₹${p.price}</div>

            <div class="cart-controls">
                <button class="quantity-btn decrease-qty">-</button>
                <input type="number" class="quantity-display" value="1" min="1">
                <button class="quantity-btn increase-qty">+</button>
            </div>

            <button class="add-to-cart-btn">Add to Cart</button>
        </div>
      `;
    })
    .join("");

  attachEventListeners();
};

// ---------------------- FILTER + QUANTITY LISTENERS ----------------------

const attachEventListeners = () => {
  const itemClass = getItemClass();

  // Filter buttons
  document.querySelectorAll(".filter-btn, .category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter || btn.textContent.trim();

      document
        .querySelectorAll(".filter-btn, .category-btn")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");

      document.querySelectorAll(`.${itemClass}`).forEach((card) => {
        const cat = card.dataset.category?.toLowerCase() || "all";

        card.style.display =
          filter === "All" || filter === "all" || cat === filter.toLowerCase()
            ? ""
            : "none";
      });
    });
  });

  // Quantity controls
  document.querySelectorAll(".decrease-qty").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector(".quantity-display");
      let qty = parseInt(input.value) || 1;
      if (qty > 1) qty--;
      input.value = qty;
    });
  });

  document.querySelectorAll(".increase-qty").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector(".quantity-display");
      let qty = parseInt(input.value) || 1;
      input.value = qty + 1;
    });
  });
};

// ---------------------- UPDATE CART COUNT ----------------------

const updateCartCount = async () => {
  try {
    if (!getAuthToken()) return;

    const res = await cartAPI.get();
    const count = res.cart?.items?.length || 0;

    const cartLink = document.getElementById("cart");
    if (cartLink) cartLink.textContent = `Cart (${count})`;
  } catch {}
};

// ---------------------- LOGOUT ----------------------

const logoutBtn = document.getElementById("logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    removeAuthToken();
    removeCurrentUser();
    localStorage.removeItem("adminLoggedIn");
    window.location.href = "../../index.html";
  });
}

// ---------------------- INITIALIZE ----------------------

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector(getGridSelector());
  if (grid) grid.innerHTML = "";

  await loadProducts();
  await updateCartCount();
});
