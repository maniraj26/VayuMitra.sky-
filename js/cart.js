import { getAuthToken, getCurrentUser } from "./api.js";

import { cartAPI } from "./api.js";
import { ordersAPI } from "./api.js";
import { paymentsAPI } from "./api.js";

// ---------------------- CHECK LOGIN ----------------------

let currentUser = getCurrentUser();

if (!currentUser || !getAuthToken()) {
  if (window.location.pathname.includes("cart.html")) {
    alert("Please login to view your cart");
    window.location.href = "user-login.html";
  }
}

// ---------------------- ADD TO CART HANDLER ----------------------

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", async (e) => {
    if (
      e.target.classList.contains("add-to-cart-btn") ||
      e.target.classList.contains("add-to-cart")
    ) {
      e.preventDefault();

      if (!getAuthToken()) {
        alert("Please login to add items to cart");
        window.location.href = "../pages/user-login.html";
        return;
      }

      const card = e.target.closest(
        ".item-card, .food-item, .Grocery-item, .Medicine-item"
      );

      if (!card) return;

      const productId = card.dataset.productId;
      if (!productId) {
        alert("Product ID missing");
        return;
      }

      let quantity = 1;
      const qtyInput = card.querySelector(".quantity-display");
      if (qtyInput) quantity = parseInt(qtyInput.value) || 1;

      try {
        const response = await cartAPI.addItem(productId, quantity);
        if (response.success) {
          alert("Item added!");
          await updateCartCount();
        }
      } catch (err) {
        alert(err.message || "Failed to add item");
      }
    }
  });

  // If cart page => load cart
  if (window.location.pathname.includes("cart.html")) {
    loadCart();
  } else {
    updateCartCount();
  }
});

// ---------------------- LOAD CART ----------------------

async function loadCart() {
  try {
    const response = await cartAPI.get();
    if (response.success) {
      renderCart(response.cart);
      updateCartCount();
    }
  } catch (err) {
    console.error("Cart load error:", err);
    document.getElementById("cartList").innerHTML =
      "<p>Unable to load cart.</p>";
  }
}

// ---------------------- RENDER CART ----------------------

function renderCart(cart) {
  const cartList = document.getElementById("cartList");
  const cartTotal = document.getElementById("cartTotal");
  const payBtn = document.getElementById("payBtn");

  if (!cart?.items?.length) {
    cartList.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "";
    if (payBtn) payBtn.style.display = "none";
    return;
  }

  const getImg = (image) => {
    if (!image) return "../images/default.png";
    if (image.startsWith("http")) return image;
    if (image.startsWith("/uploads")) return `http://localhost:5000${image}`;
    return image;
  };

  cartList.innerHTML = cart.items
    .map((item, index) => {
      const product = item.product || {};
      const name = product.name || item.name;
      const price = product.price || item.price;
      const image = getImg(product.image || item.image);
      const itemId = item._id || index;

      return `
        <div class="cart-item" style="display:flex;gap:12px;align-items:center;padding:10px;border:1px solid #ddd;margin-bottom:10px;border-radius:8px;">
            <img src="${image}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">
            <div style="flex:1;">
                <h4>${name}</h4>
                <p>₹${price} × ${item.quantity}</p>
            </div>
            <strong>₹${(price * item.quantity).toFixed(2)}</strong>
            <button class="remove-btn" data-id="${itemId}" style="background:#e53935;color:#fff;border:none;padding:6px 12px;border-radius:8px;">Remove</button>
        </div>
      `;
    })
    .join("");

  // Remove handlers
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const itemId = btn.dataset.id;
      await cartAPI.removeItem(itemId);
      loadCart();
    });
  });

  // Total calculation
  let total = cart.totalAmount;
  if (!total) {
    total = cart.items.reduce((sum, it) => {
      const price = it.product?.price || it.price || 0;
      return sum + price * it.quantity;
    }, 0);
  }

  if (cartTotal) cartTotal.textContent = `Total: ₹${total.toFixed(2)}`;
  if (payBtn) payBtn.style.display = "block";
}

// ---------------------- UPDATE CART COUNT ----------------------

async function updateCartCount() {
  try {
    const response = await cartAPI.get();
    const count = response.cart?.items?.length || 0;
    const cartLink = document.getElementById("cart");
    if (cartLink) cartLink.textContent = `Cart (${count})`;
  } catch {
    const cartLink = document.getElementById("cart");
    if (cartLink) cartLink.textContent = "Cart (0)";
  }
}

// ---------------------- PAYMENT HANDLING ----------------------

if (window.location.pathname.includes("cart.html")) {
  document.addEventListener("DOMContentLoaded", () => {
    const payBtn = document.getElementById("payBtn");
    if (payBtn) payBtn.addEventListener("click", handlePayment);
  });
}

// ---------------------- RAZORPAY PAYMENT ----------------------

async function handlePayment() {
  try {
    const cartResponse = await cartAPI.get();
    if (!cartResponse.cart?.items.length) {
      alert("Cart is empty");
      return;
    }

    let total = cartResponse.cart.totalAmount;
    if (!total) {
      total = cartResponse.cart.items.reduce((sum, it) => {
        const price = it.product?.price || it.price || 0;
        return sum + price * it.quantity;
      }, 0);
    }

    // Create order in backend
    const orderResp = await ordersAPI.create({
      orderType: "food",
      description: "Order from cart",
      location: { latitude: "0", longitude: "0" },
      totalAmount: total,
    });

    const backendOrderId = orderResp.order._id;

    const paymentResp = await paymentsAPI.createOrder(total, backendOrderId);

    const options = {
      key: paymentResp.order.key,
      amount: paymentResp.order.amount,
      currency: paymentResp.order.currency,
      name: "VayuMitra",
      description: "Drone Delivery",
      order_id: paymentResp.order.id,

      handler: async (response) => {
        const verifyResp = await paymentsAPI.verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderId: backendOrderId,
        });

        if (verifyResp.success) {
          alert("Payment successful!");
          await cartAPI.clear();
          window.location.href = "user-dashboard.html";
        }
      },

      prefill: {
        name: currentUser?.name || "",
        email: currentUser?.email || "",
        contact: currentUser?.phone || "",
      },

      theme: { color: "#1B263B" },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("Payment error:", err);
    alert(err.message || "Payment failed");
  }
}
