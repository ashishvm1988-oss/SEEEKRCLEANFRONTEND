// Thin fetch wrapper around the Seeekr API. Every function returns the
// parsed JSON body on success and throws an Error (with a readable message
// pulled from the API's own { message } / { error } shape) on failure, so
// callers can just try/catch and show err.message.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const TOKEN_KEY = 'seeekr_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = true, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // no/invalid JSON body — fall through, res.ok check below handles it
  }

  if (!res.ok) {
    const message =
      payload?.message ||
      (typeof payload?.error === 'string' ? payload.error : null) ||
      `Something went wrong (${res.status}).`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  // A couple of routes (e.g. legacy signup validation) return 200 with a
  // {message} body instead of {data} on failure — treat that the same way.
  if (payload && !payload.data && payload.message && payload.data !== null) {
    throw new Error(payload.message);
  }

  return payload?.data;
}

export const api = {
  // --- auth / users ---
  login: (identifier, password) => {
    const body = identifier.includes('@')
      ? { email: identifier, password }
      : { username: identifier, password };
    return request('/auth/login', { method: 'POST', body, auth: false });
  },
  requestPasswordReset: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (email, token, password) =>
    request('/auth/reset-password', { method: 'POST', body: { email, token, password }, auth: false }),
  signup: (payload) => request('/users', { method: 'POST', body: payload, auth: false }),
  updateProfile: (payload) => request('/users', { method: 'PUT', body: payload }),
  // Note: GET /users with no id returns every user, so "get my profile" has
  // to go through the id-filtered form using the id we already have cached
  // from login/signup.
  getUserById: (id) => request(`/users?id=${encodeURIComponent(id)}`),

  // --- categories ---
  getCategories: () => request('/category/all', { auth: false }),
  getSubcategories: (categoryId) =>
    request(`/sub-category/all?category_id=${encodeURIComponent(categoryId)}`, { auth: false }),

  // --- provider search ---
  searchProviders: (params) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request(`/providers${qs ? `?${qs}` : ''}`, { auth: false });
  },
  getProvider: async (id) => {
    const res = await request(`/providers?id=${encodeURIComponent(id)}`, { auth: false });
    return res.results[0] || null;
  },

  // --- portfolio ---
  getPortfolio: (userId) => request(`/portfolio?user_id=${encodeURIComponent(userId)}`, { auth: false }),
  uploadPortfolioImage: (file, caption) => {
    // Field order matters here: @fastify/multipart's request.file() only
    // captures fields it has already parsed by the time it hits the file
    // part, so caption must be appended before the file.
    const form = new FormData();
    if (caption) form.append('caption', caption);
    form.append('file', file);
    return request('/portfolio', { method: 'POST', body: form, isFormData: true });
  },
  deletePortfolioImage: (id) => request(`/portfolio?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // --- credentials (education / experience / certification / project, with
  // an optional "proof" file — a photo of a certificate/degree/etc.) ---
  getCredentials: (userId) => request(`/credentials?user_id=${encodeURIComponent(userId)}`, { auth: false }),
  addCredential: ({ type, title, organization, period, description, file }) => {
    const form = new FormData();
    form.append('type', type);
    form.append('title', title);
    if (organization) form.append('organization', organization);
    if (period) form.append('period', period);
    if (description) form.append('description', description);
    if (file) form.append('file', file);
    return request('/credentials', { method: 'POST', body: form, isFormData: true });
  },
  deleteCredential: (id) => request(`/credentials?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // --- messages ---
  getConversations: () => request('/messages/conversations'),
  getThread: (otherUserId) => request(`/messages?other_user_id=${encodeURIComponent(otherUserId)}`),
  sendMessage: (receiverId, message) =>
    request('/messages', { method: 'POST', body: { receiver_id: receiverId, message } }),

  // --- subscription ---
  getMySubscription: () => request('/subscriptions/me'),
};
