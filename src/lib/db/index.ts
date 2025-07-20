import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { recentlyPlayed, madeForYou, popularAlbums } from '../../../db/schema';

// Create postgres client
const client = postgres(process.env.DATABASE_URL || 'postgres://maharshi12@localhost:5432/spotify_clone');

// Create drizzle database instance
export const db = drizzle(client);

// Helper function for adding recently played songs
export async function addRecentlyPlayedSong(songTitle: string, artistName: string): Promise<void> {
    try {
        await db.insert(recentlyPlayed).values({
            songTitle,
            artistName,
            playedAt: new Date()
        });
    } catch (error) {
        console.error(`Error adding song to recently played: ${error}`);
        throw error;
    }
}