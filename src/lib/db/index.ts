interface RecentlyPlayedEntry {
    userId: number;
    songId: number;
}

async function addRecentlyPlayedSong(entry: RecentlyPlayedEntry): Promise<void> {
    try {
        const query = `
            INSERT INTO recently_played (user_id, song_id, played_at)
            VALUES ($1, $2, NOW())
        `;
        const values = [entry.userId, entry.songId];
        await db.query(query, values);
    } catch (error) {
        console.error(`Error adding recently played song: ${error}`);
    }
}