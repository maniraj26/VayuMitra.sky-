import {
  ordersAPI,
  productsAPI,
  removeAuthToken,
  removeCurrentUser,
} from "../js/api.js";

// Redirect if admin not logged in
if (!localStorage.getItem("adminLoggedIn")) {
  window.location.href = "admin-login.html";
}

// ---------------------- TAB SWITCHING ----------------------
document.querySelectorAll(".dashboard-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".dashboard-tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");

    // Reload data when switching tabs
    if (tab.dataset.tab === "ordersTab") {
      loadOrders();
    } else if (tab.dataset.tab === "productsTab") {
      loadProducts();
    }
  });
});

// ---------------------- LOAD ORDERS ----------------------
async function loadOrders(status = "pending") {
  const list = document.getElementById("ordersList");
  list.innerHTML = '<div class="loading-spinner">Loading orders...</div>';

  try {
    const res = await ordersAPI.getAll({ status });

    if (!res.orders || res.orders.length === 0) {
      list.innerHTML = `<p class="no-data">No ${status} orders found.</p>`;
      return;
    }

    list.innerHTML = res.orders
      .map((o) => {
        const user = o.userId || o.user || {};
        const loc = o.location || {};
        const pay = o.payment || {};

        // Format date
        const createdAt = o.createdAt
          ? new Date(o.createdAt).toLocaleString()
          : "N/A";
        const completedAt = o.completedAt
          ? new Date(o.completedAt).toLocaleString()
          : "";

        // Status badge styling
        const statusClass = o.status.toLowerCase();

        // Action buttons based on status
        let actionButtons = "";
        if (o.status === "pending") {
          actionButtons = `
            <button class="btn btn-success approve-btn" data-id="${o._id}">
              Approve
            </button>
            <button class="btn btn-danger reject-btn" data-id="${o._id}">
              Reject
            </button>
          `;
        } else if (o.status === "approved") {
          actionButtons = `
            <button class="btn btn-primary complete-btn" data-id="${o._id}">
              Mark Completed
            </button>
          `;
        }

        return `
        <div class="order-card">
          <div class="order-header">
            <h3>${o.orderType.toUpperCase()}</h3>
            <span class="order-status status-${statusClass}">${o.status}</span>
          </div>
          
          <div class="order-details">
            <p><b>Order ID:</b> ${o._id}</p>
            <p><b>Total:</b> ₹${o.totalAmount}</p>
            <p><b>Created:</b> ${createdAt}</p>
            ${completedAt ? `<p><b>Completed:</b> ${completedAt}</p>` : ""}
          </div>

          <div class="user-details">
            <h4>User Details</h4>
            <p><b>Name:</b> ${user.name || "Unknown"}</p>
            <p><b>Email:</b> ${user.email || "N/A"}</p>
            <p><b>Phone:</b> ${user.phone || "N/A"}</p>
          </div>

          <div class="delivery-details">
            <h4>Delivery Address</h4>
            <p><b>Address:</b> ${loc.address || "N/A"}</p>
            ${
              loc.latitude
                ? `<p><b>Location:</b> ${loc.latitude}, ${loc.longitude}</p>`
                : ""
            }
          </div>

          <div class="order-items">
            <h4>Items (${o.items.length})</h4>
            ${o.items
              .map(
                (i) => `
                <div class="order-item">
                  <span class="item-name">${i.name}</span>
                  <span class="item-quantity">× ${i.quantity}</span>
                  <span class="item-price">₹${i.price * i.quantity}</span>
                </div>
              `
              )
              .join("")}
          </div>

          <div class="payment-details">
            <h4>Payment Details</h4>
            <p><b>Method:</b> ${pay.method || "N/A"}</p>
            <p><b>Status:</b> ${pay.status || "N/A"}</p>
            ${
              pay.razorpayOrderId
                ? `<p><b>Razorpay Order ID:</b> ${pay.razorpayOrderId}</p>`
                : ""
            }
          </div>

          ${
            actionButtons
              ? `<div class="order-actions">${actionButtons}</div>`
              : ""
          }
        </div>`;
      })
      .join("");

    // Event listeners for buttons
    document.querySelectorAll(".approve-btn").forEach((b) => {
      b.onclick = () => updateOrderStatus(b.dataset.id, "approved");
    });

    document.querySelectorAll(".complete-btn").forEach((b) => {
      b.onclick = () => updateOrderStatus(b.dataset.id, "completed");
    });

    document.querySelectorAll(".reject-btn").forEach((b) => {
      b.onclick = () => updateOrderStatus(b.dataset.id, "rejected");
    });
  } catch (err) {
    console.error("Failed to load orders:", err);
    list.innerHTML = `
      <div class="error-message">
        <p>Failed to load orders. Please try again.</p>
        <button class="btn btn-retry" onclick="loadOrders('${status}')">Retry</button>
      </div>
    `;
  }
}

// Update Order Status
async function updateOrderStatus(id, status) {
  const confirmMessage = `Are you sure you want to ${status} this order?`;
  if (!confirm(confirmMessage)) return;

  try {
    await ordersAPI.updateStatus(id, status);

    // Show success message
    showNotification(`Order ${status} successfully!`, "success");

    // Refresh current filter
    const activeBtn = document.querySelector(".order-filters .active-filter");
    const activeStatus = activeBtn ? activeBtn.dataset.filter : "pending";
    loadOrders(activeStatus);
  } catch (error) {
    console.error("Update failed:", error);
    showNotification("Failed to update order.", "error");
  }
}

// Filter Buttons
document.querySelectorAll(".order-filters .btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".order-filters .btn")
      .forEach((b) => b.classList.remove("active-filter"));
    btn.classList.add("active-filter");
    loadOrders(btn.dataset.filter);
  };
});

// ---------------------- PRODUCT CRUD ----------------------
const modal = document.getElementById("productModal");
const openBtn = document.getElementById("addProductBtn");
const closeBtn = document.querySelector(".close");
const modalTitle = document.getElementById("modalTitle");

openBtn.onclick = () => {
  resetProductForm();
  modalTitle.textContent = "Add Product";
  modal.style.display = "block";
};

closeBtn.onclick = () => (modal.style.display = "none");

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

function resetProductForm() {
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  document.getElementById("imagePreview").style.display = "none";
  document.getElementById("productAvailable").checked = true;
}

// Load Products
async function loadProducts() {
  const list = document.getElementById("productsList");
  list.innerHTML = '<div class="loading-spinner">Loading products...</div>';

  try {
    const category = document.getElementById("categoryFilter").value;
    const search = document.getElementById("searchProducts").value;

    const res = await productsAPI.getAll({
      category,
      search,
      includeUnavailable: true,
    });

    if (!res.products || res.products.length === 0) {
      list.innerHTML = '<p class="no-data">No products found.</p>';
      return;
    }

    list.innerHTML = res.products
      .map(
        (p) => `
        <div class="product-card ${!p.isAvailable ? "unavailable" : ""}">
          <div class="product-image">
            <img src="${
              p.image
                ? "http://localhost:5000" + p.image
                : "../images/default-product.png"
            }" alt="${p.name}" />
            ${
              !p.isAvailable
                ? '<span class="status-badge">Unavailable</span>'
                : ""
            }
            ${p.stock <= 10 ? '<span class="stock-badge">Low Stock</span>' : ""}
          </div>
          
          <div class="product-info">
            <h4>${p.name}</h4>
            <p class="product-category">${p.category}${
          p.subCategory ? ` / ${p.subCategory}` : ""
        }</p>
            <p class="product-price">₹${p.price}</p>
            <p class="product-stock">Stock: ${p.stock}</p>
          </div>
          
          <div class="product-actions">
            <button class="btn btn-edit" data-id="${p._id}">
              <i>✏️</i> Edit
            </button>
            <button class="btn btn-delete" data-id="${p._id}">
              <i>🗑️</i> Delete
            </button>
          </div>
        </div>`
      )
      .join("");

    // Event listeners
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.onclick = () => editProduct(btn.dataset.id);
    });

    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.onclick = () => deleteProduct(btn.dataset.id);
    });
  } catch (error) {
    console.error("Failed to load products:", error);
    list.innerHTML = `
      <div class="error-message">
        <p>Failed to load products. Please try again.</p>
        <button class="btn btn-retry" onclick="loadProducts()">Retry</button>
      </div>
    `;
  }
}

// Edit Product
async function editProduct(id) {
  try {
    const res = await productsAPI.getById(id);
    const p = res.product;

    document.getElementById("productId").value = p._id;
    document.getElementById("productName").value = p.name;
    document.getElementById("productDescription").value = p.description;
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productCategory").value = p.category;
    document.getElementById("productSubCategory").value = p.subCategory || "";
    document.getElementById("productStock").value = p.stock;
    document.getElementById("productAvailable").checked = p.isAvailable;

    const preview = document.getElementById("imagePreview");
    if (p.image) {
      preview.src = "http://localhost:5000" + p.image;
      preview.style.display = "block";
    }

    modalTitle.textContent = "Edit Product";
    modal.style.display = "block";
  } catch (error) {
    console.error("Failed to load product:", error);
    showNotification("Failed to load product details.", "error");
  }
}

// Image Preview
document.getElementById("productImage").onchange = function () {
  const preview = document.getElementById("imagePreview");
  if (this.files[0]) {
    preview.src = URL.createObjectURL(this.files[0]);
    preview.style.display = "block";
  }
};

// Save Product
document.getElementById("productForm").onsubmit = async (e) => {
  e.preventDefault();

  const id = document.getElementById("productId").value;
  const isEdit = !!id;

  // Validate required fields
  const name = document.getElementById("productName").value.trim();
  const price = document.getElementById("productPrice").value;
  const category = document.getElementById("productCategory").value;

  if (!name || !price || !category) {
    showNotification("Please fill in all required fields.", "error");
    return;
  }

  const data = {
    name,
    description: document.getElementById("productDescription").value.trim(),
    price: parseFloat(price),
    category,
    subCategory: document.getElementById("productSubCategory").value.trim(),
    stock: parseInt(document.getElementById("productStock").value) || 0,
    isAvailable: document.getElementById("productAvailable").checked,
  };

  const file = document.getElementById("productImage").files[0];

  try {
    let res;
    if (isEdit) {
      res = await productsAPI.update(id, data, file);
    } else {
      res = await productsAPI.create(data, file);
    }

    if (res.success) {
      showNotification(
        `Product ${isEdit ? "updated" : "added"} successfully!`,
        "success"
      );
      modal.style.display = "none";
      loadProducts();
    } else {
      throw new Error(res.message || "Operation failed");
    }
  } catch (error) {
    console.error("Save failed:", error);
    showNotification(error.message || "Failed to save product.", "error");
  }
};

// Delete Product
async function deleteProduct(id) {
  if (
    !confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    await productsAPI.delete(id);
    showNotification("Product deleted successfully!", "success");
    loadProducts();
  } catch (error) {
    console.error("Delete failed:", error);
    showNotification("Failed to delete product.", "error");
  }
}

// Utility Functions
function showNotification(message, type = "info") {
  // Remove existing notification
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">&times;</button>
  `;

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();

  // Debounce search input
  let searchTimeout;
  document.getElementById("searchProducts").addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadProducts();
    }, 500);
  });

  document.getElementById("categoryFilter").onchange = loadProducts;
});
