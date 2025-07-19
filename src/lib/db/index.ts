import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { recentlyPlayed, madeForYou, popularAlbums } from '../../../db/schema';

// Create postgres client
const client = postgres(process.env.DATABASE_URL || 'postgres://maharshi12@localhost:5432/spotify_clone');

// Create drizzle database instance
export const db = drizzle(client);