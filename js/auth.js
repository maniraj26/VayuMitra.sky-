import {
  authAPI,
  setAuthToken,
  setCurrentUser,
  removeAuthToken,
  removeCurrentUser,
  getAuthToken,
} from "./api.js";

// ---------------------- USER REGISTRATION ----------------------

const registerForm = document.getElementById("userRegisterForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await authAPI.register({ name, email, phone, password });

      if (response.success) {
        setAuthToken(response.token);
        setCurrentUser(response.user);
        alert("Registration successful! Redirecting...");
        window.location.href = "user-dashboard.html";
      }
    } catch (error) {
      alert(error.message || "Registration failed. Please try again.");
      console.error("Registration error:", error);
    }
  });
}

// ---------------------- USER LOGIN ----------------------

const userLoginForm = document.getElementById("userLoginForm");

if (userLoginForm) {
  userLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await authAPI.login(email, password);

      if (response.success) {
        setAuthToken(response.token);
        setCurrentUser(response.user);
        alert("Login successful!");
        window.location.href = "user-dashboard.html";
      }
    } catch (error) {
      alert(error.message || "Invalid credentials!");
      console.error("Login error:", error);
    }
  });
}

// ---------------------- ADMIN LOGIN ----------------------

const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    try {
      const response = await authAPI.adminLogin(email, password);

      if (response.success) {
        setAuthToken(response.token);
        setCurrentUser(response.user);
        localStorage.setItem("adminLoggedIn", "true");
        alert("Admin login successful!");
        window.location.href = "admin-dashboard.html";
      } else {
        alert(response.message || "Invalid admin credentials!");
      }
    } catch (error) {
      alert(error.message || "Login failed.");
      console.error("Admin login error:", error);
    }
  });
}

// ---------------------- LOGOUT ----------------------

const logoutBtn = document.getElementById("logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    removeAuthToken();
    removeCurrentUser();
    localStorage.removeItem("adminLoggedIn");
    window.location.href = "../index.html";
  });
}

// ---------------------- AUTO CHECK USER AUTH ----------------------

document.addEventListener("DOMContentLoaded", async () => {
  const token = getAuthToken();
  if (!token) return;

  try {
    const response = await authAPI.getCurrentUser();

    if (response.success) {
      setCurrentUser(response.user);
    }
  } catch (error) {
    console.warn("Invalid token, clearing...");
    removeAuthToken();
    removeCurrentUser();
  }
});
