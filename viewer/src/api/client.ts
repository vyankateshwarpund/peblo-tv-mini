import { CatalogueRoot, CatalogueShow } from '../types';

export const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const getMediaUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const viewerApi = {
  getCatalogue: async (): Promise<CatalogueRoot> => {
    const res = await fetch(`${API_BASE}/catalog`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Catalogue has not been published yet. Please publish via CMS.');
      }
      throw new Error('Failed to load published catalogue');
    }
    return res.json();
  },

  searchCatalogue: async (params?: {
    q?: string;
    category?: string;
    language?: string;
    section?: string;
  }): Promise<CatalogueShow[]> => {
    const qry = new URLSearchParams();
    if (params?.q) qry.set('q', params.q);
    if (params?.category) qry.set('category', params.category);
    if (params?.language) qry.set('language', params.language);
    if (params?.section) qry.set('section', params.section);

    const res = await fetch(`${API_BASE}/catalog/search?${qry.toString()}`);
    if (!res.ok) return [];
    return res.json();
  },
};
