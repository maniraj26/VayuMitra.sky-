export const API_BASE_URL = "http://localhost:5000/api";

export const getAuthToken = () => localStorage.getItem("authToken");
export const setAuthToken = (token) => localStorage.setItem("authToken", token);
export const removeAuthToken = () => localStorage.removeItem("authToken");

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user) =>
  localStorage.setItem("currentUser", JSON.stringify(user));

export const removeCurrentUser = () => localStorage.removeItem("currentUser");

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  if (token) defaultHeaders["Authorization"] = `Bearer ${token}`;

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Request failed");

  return data;
}

export const authAPI = {
  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (email, password) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  adminLogin: (email, password) =>
    apiRequest("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => apiRequest("/auth/me"),
};

export const productsAPI = {
  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/products${query ? `?${query}` : ""}`);
  },

  getById: (id) => apiRequest(`/products/${id}`),

  create: async (productData, imageFile = null) => {
    const formData = new FormData();
    Object.keys(productData).forEach((key) =>
      formData.append(key, productData[key])
    );
    if (imageFile) formData.append("image", imageFile);

    const res = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });

    return res.json();
  },

  update: async (id, productData, imageFile = null) => {
    const formData = new FormData();
    Object.keys(productData).forEach((key) =>
      formData.append(key, productData[key])
    );
    if (imageFile) formData.append("image", imageFile);

    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });

    return res.json();
  },

  delete: (id) =>
    apiRequest(`/products/${id}`, {
      method: "DELETE",
    }),

  uploadImage: async (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(`${API_BASE_URL}/upload/product-image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });

    return res.json();
  },
};

export const cartAPI = {
  get: () => apiRequest("/cart"),

  addItem: (productId, quantity = 1) =>
    apiRequest("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),

  updateItem: (itemId, quantity) =>
    apiRequest(`/cart/update/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (itemId) =>
    apiRequest(`/cart/remove/${itemId}`, {
      method: "DELETE",
    }),

  clear: () =>
    apiRequest("/cart/clear", {
      method: "DELETE",
    }),
};

export const ordersAPI = {
  create: (orderData) =>
    apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  getMyOrders: () => apiRequest("/orders/my-orders"),

  getById: (id) => apiRequest(`/orders/${id}`),

  getAll: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return apiRequest(`/orders${query ? `?${query}` : ""}`);
  },

  updateStatus: (id, status) =>
    apiRequest(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  cancel: (id) =>
    apiRequest(`/orders/${id}/cancel`, {
      method: "PUT",
    }),
};

export const paymentsAPI = {
  createOrder: (amount, orderId) =>
    apiRequest("/payments/create-order", {
      method: "POST",
      body: JSON.stringify({ amount, orderId }),
    }),

  verifyPayment: (paymentData) =>
    apiRequest("/payments/verify-payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  getStatus: (orderId) => apiRequest(`/payments/status/${orderId}`),
};
