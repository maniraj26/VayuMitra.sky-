import { getCurrentUser, removeAuthToken, removeCurrentUser } from "./api.js";

function renderNavbar() {
  const user = getCurrentUser();
  const nav = document.getElementById("navLinks");

  if (!nav) return;

  if (!user || user.role === "admin") {
    nav.innerHTML = `
       <a href="../index.html">Home</a> 
      <a href="../pages/user-login.html">User Login</a>
      <a href="../pages/user-register.html">Register</a>
    `;
    return;
  }

  if (user.role === "user") {
    nav.innerHTML = `
      <a href="../index.html">Home</a>
      <a href="../pages/profile.html">Profile</a>
      <a href="../pages/cart.html">Cart</a>
      <a href="#" id="logoutBtn">Logout</a>
    `;
  }

  // Logout Handler
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      removeAuthToken();
      removeCurrentUser();
      localStorage.removeItem("adminLoggedIn");
      window.location.href = "../index.html";
    };
  }
}

// ---------------------------
// MOBILE NAVIGATION
// ---------------------------
function initMobileNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("navLinks");

  if (!navToggle || !navLinks) return;

  function checkMobileNav() {
    if (window.innerWidth <= 768) {
      navToggle.style.display = "block";
      navLinks.style.display = "none";
    } else {
      navToggle.style.display = "none";
      navLinks.style.display = "flex";
    }
  }

  navToggle.addEventListener("click", () => {
    navLinks.style.display =
      navLinks.style.display === "none" ? "flex" : "none";
  });

  window.addEventListener("resize", checkMobileNav);
  window.addEventListener("DOMContentLoaded", checkMobileNav);
}

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  initMobileNav();
});
