import { User, Show, Season, Episode, Artwork, ValidationReport, PublishRun, ReferenceConfig } from '../types';

export const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const getMediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export function getToken(): string | null {
  return localStorage.getItem('peblo_token');
}

export function setToken(token: string) {
  localStorage.setItem('peblo_token', token);
}

export function clearToken() {
  localStorage.removeItem('peblo_token');
}

export function getCurrentUser(): User | null {
  const u = localStorage.getItem('peblo_user');
  return u ? JSON.parse(u) : null;
}

export function setCurrentUser(user: User) {
  localStorage.setItem('peblo_user', JSON.stringify(user));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    let errorDetail;
    try {
      errorDetail = await res.json();
    } catch {
      errorDetail = { detail: { message: res.statusText } };
    }
    const message = errorDetail?.detail?.message || errorDetail?.detail || 'An error occurred';
    const err = new Error(message);
    (err as any).data = errorDetail;
    (err as any).status = res.status;
    throw err;
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  login: async (email: string, password: string) => {
    const data = await request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.access_token);
    setCurrentUser(data.user);
    return data;
  },

  getMe: () => request<User>('/auth/me'),

  getReference: () => request<ReferenceConfig>('/admin/reference'),

  listShows: (params?: { q?: string; section?: string; status?: string }) => {
    const qry = new URLSearchParams();
    if (params?.q) qry.set('q', params.q);
    if (params?.section) qry.set('section', params.section);
    if (params?.status) qry.set('status', params.status);
    return request<Show[]>(`/admin/shows?${qry.toString()}`);
  },

  getShow: (id: number) => request<Show>(`/admin/shows/${id}`),

  createShow: (show: Partial<Show>) =>
    request<Show>('/admin/shows', {
      method: 'POST',
      body: JSON.stringify(show),
    }),

  updateShow: (id: number, show: Partial<Show>) =>
    request<Show>(`/admin/shows/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(show),
    }),

  deleteShow: (id: number) =>
    request<void>(`/admin/shows/${id}`, {
      method: 'DELETE',
    }),

  listSeasons: (showId: number) => request<Season[]>(`/admin/shows/${showId}/seasons`),

  createSeason: (showId: number, season: { season_number: number; title?: string }) =>
    request<Season>(`/admin/shows/${showId}/seasons`, {
      method: 'POST',
      body: JSON.stringify(season),
    }),

  updateSeason: (id: number, season: { season_number?: number; title?: string }) =>
    request<Season>(`/admin/seasons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(season),
    }),

  deleteSeason: (id: number) =>
    request<void>(`/admin/seasons/${id}`, {
      method: 'DELETE',
    }),

  listEpisodes: (params?: { q?: string; status?: string; language?: string; show_id?: number; season_id?: number }) => {
    const qry = new URLSearchParams();
    if (params?.q) qry.set('q', params.q);
    if (params?.status) qry.set('status', params.status);
    if (params?.language) qry.set('language', params.language);
    if (params?.show_id) qry.set('show_id', String(params.show_id));
    if (params?.season_id) qry.set('season_id', String(params.season_id));
    return request<Episode[]>(`/admin/episodes?${qry.toString()}`);
  },

  getEpisode: (id: number) => request<Episode>(`/admin/episodes/${id}`),

  createEpisode: (seasonId: number, episode: Partial<Episode>) =>
    request<Episode>(`/admin/seasons/${seasonId}/episodes`, {
      method: 'POST',
      body: JSON.stringify(episode),
    }),

  updateEpisode: (id: number, episode: Partial<Episode>) =>
    request<Episode>(`/admin/episodes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(episode),
    }),

  deleteEpisode: (id: number) =>
    request<void>(`/admin/episodes/${id}`, {
      method: 'DELETE',
    }),

  uploadArtwork: (episodeId: number, artworkType: string, file: File) => {
    const formData = new FormData();
    formData.append('artwork_type', artworkType);
    formData.append('file', file);
    return request<Artwork>(`/admin/episodes/${episodeId}/artworks`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteArtwork: (artworkId: number) =>
    request<void>(`/admin/artworks/${artworkId}`, {
      method: 'DELETE',
    }),

  getValidationReport: () => request<ValidationReport>('/admin/validation-report'),

  publishCatalogue: () =>
    request<PublishRun>('/admin/catalog/publish', {
      method: 'POST',
    }),

  getPublishHistory: () => request<PublishRun[]>('/admin/publish-runs'),
};
