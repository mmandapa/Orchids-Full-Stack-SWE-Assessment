// Types for our database tables
export interface RecentlyPlayed {
  id: number;
  userId: number;
  songId: number;
  playedAt: string;
}

export interface MadeForYou {
  id: number;
  userId: number;
  playlistId: number;
  title: string;
  description?: string;
  coverImage?: string;
  createdAt: string;
}

export interface PopularAlbum {
  id: number;
  title: string;
  artist: string;
  coverImage?: string;
  releaseDate?: string;
  totalTracks?: number;
  popularity?: number;
  createdAt: string;
}

// API functions
export async function fetchRecentlyPlayed(userId?: number): Promise<RecentlyPlayed[]> {
  const params = new URLSearchParams({ table: 'recently_played' });
  if (userId) params.append('userId', userId.toString());
  
  const response = await fetch(`/api/db?${params}`);
  const { data } = await response.json();
  return data;
}

export async function fetchMadeForYou(userId?: number): Promise<MadeForYou[]> {
  const params = new URLSearchParams({ table: 'made_for_you' });
  if (userId) params.append('userId', userId.toString());
  
  const response = await fetch(`/api/db?${params}`);
  const { data } = await response.json();
  return data;
}

export async function fetchPopularAlbums(): Promise<PopularAlbum[]> {
  const params = new URLSearchParams({ table: 'popular_albums' });
  
  const response = await fetch(`/api/db?${params}`);
  const { data } = await response.json();
  return data;
}

export async function addRecentlyPlayed(data: Omit<RecentlyPlayed, 'id' | 'playedAt'>) {
  const response = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'recently_played', data }),
  });
  return response.json();
}

export async function addMadeForYou(data: Omit<MadeForYou, 'id' | 'createdAt'>) {
  const response = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'made_for_you', data }),
  });
  return response.json();
}

export async function addPopularAlbum(data: Omit<PopularAlbum, 'id' | 'createdAt'>) {
  const response = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: 'popular_albums', data }),
  });
  return response.json();
} 