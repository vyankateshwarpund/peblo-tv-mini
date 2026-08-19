export interface ArtworkMap {
  poster?: string | null;
  banner?: string | null;
  thumbnail?: string | null;
}

export interface CatalogueEpisode {
  content_group: string;
  episode_number: number;
  title: string;
  duration_seconds?: number | null;
  languages: string[];
  artwork: ArtworkMap;
}

export interface CatalogueSeason {
  season_number: number;
  title: string;
  episodes: CatalogueEpisode[];
}

export interface CatalogueShow {
  show_id: number;
  title: string;
  slug: string;
  synopsis: string;
  section: string;
  categories: string[];
  artwork: ArtworkMap;
  seasons: CatalogueSeason[];
  trailers: CatalogueEpisode[];
}

export interface CatalogueRoot {
  generated_at: string;
  sections: Record<string, CatalogueShow[]>;
}
