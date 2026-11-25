const API_URL = import.meta.env.VITE_API_URL;

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function register(userData) {
  const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
}

export async function login(userData) {
  const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
}

export async function getMe() {
  const response = await fetchWithTimeout(`${API_URL}/auth/me`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function getNotes(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API_URL}/notes?${query}` : `${API_URL}/notes`;
  const response = await fetchWithTimeout(url, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function createNote(noteData) {
  const response = await fetchWithTimeout(`${API_URL}/notes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(noteData),
  });
  return handleResponse(response);
}

export async function updateNote(id, noteData) {
  const response = await fetchWithTimeout(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(noteData),
  });
  return handleResponse(response);
}

export async function deleteNote(id) {
  const response = await fetchWithTimeout(`${API_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function syncNotes(operations) {
  const response = await fetchWithTimeout(`${API_URL}/notes/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(operations),
  });
  return handleResponse(response);
}

export async function getLabels() {
  const response = await fetchWithTimeout(`${API_URL}/labels`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
}

export async function createLabel(name) {
  const response = await fetchWithTimeout(`${API_URL}/labels`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
}

export async function deleteLabel(id) {
  const response = await fetchWithTimeout(`${API_URL}/labels/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
}
