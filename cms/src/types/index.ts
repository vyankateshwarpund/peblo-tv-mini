export interface User {
  id: number;
  email: string;
  role: 'editor' | 'admin';
  created_at: string;
}

export interface Artwork {
  id: number;
  episode_id: number;
  artwork_type: 'poster' | 'banner' | 'thumbnail';
  storage_key: string;
  url: string;
  width: number;
  height: number;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Episode {
  id: number;
  season_id: number;
  episode_number: number;
  episode_title: string;
  duration_seconds: number | null;
  language: 'en' | 'hi';
  content_group: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  artworks: Artwork[];
}

export interface Season {
  id: number;
  show_id: number;
  season_number: number;
  title: string;
  created_at: string;
  updated_at: string;
  episode_count?: number;
  episodes?: Episode[];
}

export interface Show {
  id: number;
  title: string;
  slug: string;
  synopsis: string;
  section: string | null;
  categories: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  season_count?: number;
  episode_count?: number;
  seasons?: Season[];
}

export interface ValidationErrorItem {
  entity_type: 'show' | 'season' | 'episode' | 'artwork';
  entity_id: number | null;
  entity_title: string | null;
  field: string;
  message: string;
}

export interface ValidationReport {
  can_publish: boolean;
  total_issues: number;
  errors: ValidationErrorItem[];
}

export interface PublishRun {
  id: number;
  triggered_by: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'failed';
  published_show_count: number;
  published_episode_count: number;
  error_message: string | null;
}

export interface ReferenceConfig {
  sections: string[];
  categories: string[];
  languages: string[];
  artwork_specs: {
    poster: { aspect: string; target_px: [number, number]; max_kb: number };
    banner: { aspect: string; target_px: [number, number]; max_kb: number };
    thumbnail: { aspect: string; target_px: [number, number]; max_kb: number };
  };
}
