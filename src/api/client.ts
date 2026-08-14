// Read API base URL dynamically from environment variables (.env)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getStoredToken(): string | null {
  try {
    const rawSession = localStorage.getItem('supermarket-pos-session');
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed?.accessToken) return parsed.accessToken;
      if (parsed?.token) return parsed.token;
    }
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    return token || null;
  } catch {
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem('token');
    return token ? token : null;
  } catch {
    return null;
  }
}

