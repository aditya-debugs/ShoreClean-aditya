/**
 * API utility module for ShoreClean frontend
 * Handles all HTTP requests to the backend server
 */
import axios from "axios";

// Same-origin `/api` in dev (Vite proxy → Express). Set VITE_API_URL for production or a custom backend port.
export const API_ROOT = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

/**
 * FastAPI AI server (uvicorn). Leave VITE_AI_API_URL unset in dev to use same-origin
 * `/ai` and `/cleanup` paths (Vite proxies to port 8001 — see vite.config.js).
 * In production, set VITE_AI_API_URL to the full origin (e.g. https://ai.example.com).
 */
export function aiApiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = (import.meta.env.VITE_AI_API_URL || "").replace(/\/$/, "");
  return base ? `${base}${p}` : p;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_ROOT,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Check direct token first
    const directToken = localStorage.getItem("token");
    if (directToken) {
      config.headers.Authorization = `Bearer ${directToken}`;
      return config;
    }

    // Fallback to user.token
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — auto-refresh access token on 401
let isRefreshing = false;
let refreshQueue = []; // callbacks waiting for the new token

const processQueue = (error, token = null) => {
  refreshQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve(token)));
  refreshQueue = [];
};

// Auth routes that must never trigger the token-refresh interceptor
const AUTH_BYPASS_URLS = ["/auth/login", "/auth/register", "/auth/logout", "/auth/refresh-token"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't intercept auth endpoints — a 401 there means bad credentials, not an expired token
    const isAuthRoute = AUTH_BYPASS_URLS.some((u) => originalRequest?.url?.includes(u));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        // Queue this request until the refresh resolves
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post("/auth/refresh-token", {}, { withCredentials: true });
        const newToken = data.accessToken;

        // Persist new token
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          user.token = newToken;
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("token", newToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear session
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.log("API Error Response:", error.response?.data);
    return Promise.reject(error);
  }
);

// Event API functions
export const getEvents = async (params = {}) => {
  try {
    const response = await api.get("/events", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEventById = async (id) => {
  try {
    const response = await api.get(`/events/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await api.post("/events", eventData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateEvent = async (id, eventData) => {
  try {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteEvent = async (id) => {
  try {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Registration API functions
export const registerForEvent = async (eventId) => {
  try {
    const response = await api.post(`/registrations/${eventId}/register`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRegistrationStatus = async (eventId) => {
  try {
    const response = await api.get(`/registrations/${eventId}/status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getEventRegistrations = async (eventId) => {
  try {
    const response = await api.get(`/registrations/${eventId}/registrations`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelRegistration = async (eventId) => {
  try {
    const response = await api.delete(`/registrations/${eventId}/cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkInVolunteer = async (qrCode) => {
  try {
    const response = await api.post(`/registrations/checkin-qr`, { qrCode });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkOutVolunteer = async (qrCode) => {
  try {
    const response = await api.post(`/registrations/checkout-qr`, { qrCode });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMyRegistrations = async () => {
  try {
    const response = await api.get("/registrations/my");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// RSVP API functions
export const rsvpForEvent = async (eventId) => {
  try {
    const response = await api.post(`/events/${eventId}/rsvp`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelRsvpForEvent = async (eventId) => {
  try {
    const response = await api.post(`/events/${eventId}/cancel-rsvp`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Donation API functions
export const createDonation = async (donationData) => {
  try {
    const response = await api.post("/donations", donationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDonations = async () => {
  try {
    const response = await api.get("/donations");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Certificate API functions
export const getCertificates = async (params = {}) => {
  try {
    const response = await api.get("/certificates", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCertificateById = async (id) => {
  try {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const issueCertificate = async (eventId, userId) => {
  try {
    const response = await api.post("/certificates/issue", { eventId, userId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const issueCertificatesForEvent = async (eventId) => {
  try {
    const response = await api.post(`/certificates/issue-event/${eventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadCertificate = async (certificateId) => {
  try {
    const response = await api.get(`/certificates/${certificateId}/download`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const revokeCertificate = async (certificateId) => {
  try {
    const response = await api.delete(`/certificates/${certificateId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Community API functions
export const communityAPI = {
  getAll: async () => {
    const response = await api.get("/communities");
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/communities/${id}`);
    return response.data;
  },
  create: async (communityData) => {
    const response = await api.post("/communities", communityData);
    return response.data;
  },
  update: async (id, communityData) => {
    const response = await api.put(`/communities/${id}`, communityData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/communities/${id}`);
    return response.data;
  },
  join: async (id) => {
    const response = await api.post(`/communities/${id}/join`);
    return response.data;
  },
  leave: async (id) => {
    const response = await api.post(`/communities/${id}/leave`);
    return response.data;
  },
};

// Groups API functions
export const groupsAPI = {
  getMyGroups: async () => {
    const response = await api.get("/groups/me");
    return response.data;
  },
  getByOrganization: async (orgId) => {
    const response = await api.get(`/groups/${orgId}`);
    return response.data;
  },
  getByCommunity: async (communityId) => {
    const response = await api.get(`/groups/community/${communityId}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },
  create: async (orgId, groupData) => {
    const response = await api.post(`/groups/${orgId}`, groupData);
    return response.data;
  },
  update: async (id, groupData) => {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },
  join: async (id) => {
    const response = await api.post(`/groups/${id}/join`);
    return response.data;
  },
  leave: async (id) => {
    const response = await api.post(`/groups/${id}/leave`);
    return response.data;
  },
  getMessages: async (groupId, page = 1, limit = 50) => {
    const response = await api.get(`/groups/${groupId}/messages`, {
      params: { page, limit },
    });
    return response.data;
  },
};

// Chat API functions
export const chatAPI = {
  getMessages: async (groupId, page = 1, limit = 50) => {
    const response = await api.get(`/groups/${groupId}/messages`, {
      params: { page, limit },
    });
    return response.data;
  },
  sendMessage: async (groupId, content) => {
    const response = await api.post(`/chat/${groupId}/messages`, { content });
    return response.data;
  },
  editMessage: async (messageId, content) => {
    const response = await api.patch(`/chat/messages/${messageId}`, { content });
    return response.data;
  },
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },
};

export default api;
