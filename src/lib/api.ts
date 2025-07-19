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
  try {
    const params = new URLSearchParams({ table: 'recently_played' });
    if (userId) params.append('userId', userId.toString());
    
    const response = await fetch(`/api/db?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data, error } = await response.json();
    if (error) throw new Error(error);
    return data || [];
  } catch (error) {
    console.error('Error fetching recently played:', error);
    return [];
  }
}

export async function fetchMadeForYou(userId?: number): Promise<MadeForYou[]> {
  try {
    const params = new URLSearchParams({ table: 'made_for_you' });
    if (userId) params.append('userId', userId.toString());
    
    const response = await fetch(`/api/db?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data, error } = await response.json();
    if (error) throw new Error(error);
    return data || [];
  } catch (error) {
    console.error('Error fetching made for you:', error);
    return [];
  }
}

export async function fetchPopularAlbums(): Promise<PopularAlbum[]> {
  try {
    const params = new URLSearchParams({ table: 'popular_albums' });
    
    const response = await fetch(`/api/db?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { data, error } = await response.json();
    if (error) throw new Error(error);
    return data || [];
  } catch (error) {
    console.error('Error fetching popular albums:', error);
    return [];
  }
}

export async function addRecentlyPlayed(data: Omit<RecentlyPlayed, 'id' | 'playedAt'>) {
  try {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'recently_played', data }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error adding recently played:', error);
    throw error;
  }
}

export async function addMadeForYou(data: Omit<MadeForYou, 'id' | 'createdAt'>) {
  try {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'made_for_you', data }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error adding made for you:', error);
    throw error;
  }
}

export async function addPopularAlbum(data: Omit<PopularAlbum, 'id' | 'createdAt'>) {
  try {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'popular_albums', data }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error adding popular album:', error);
    throw error;
  }
} 