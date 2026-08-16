export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  rating: number;
  source: 'webporting' | 'steam' | 'archive';
  embedUrl: string;
  genres: string[];
}
