import { ordersAPI } from "./api.js";
import { removeAuthToken, removeCurrentUser } from "./api.js";

document.getElementById("logout").onclick = () => {
  removeAuthToken();
  removeCurrentUser();
  window.location.href = "../index.html";
};

async function loadOrderHistory() {
  const container = document.getElementById("orderList");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const res = await ordersAPI.getMyOrders();

    if (!res.success || !res.orders.length) {
      container.innerHTML = "<p>No orders found.</p>";
      return;
    }

    container.innerHTML = res.orders
      .map(
        (o) => `
      <div class="order-card">
          <h3>${o.orderType.toUpperCase()}</h3>
          <p><b>Status:</b> ${o.status}</p>
          <p><b>Amount:</b> ₹${o.totalAmount}</p>
          <p><b>Date:</b> ${new Date(o.createdAt).toLocaleString()}</p>
      </div>
    `
      )
      .join("");
  } catch (err) {
    container.innerHTML = "<p>Error loading order history.</p>";
  }
}

loadOrderHistory();
