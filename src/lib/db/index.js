import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { recentlyPlayed, madeForYou, popularAlbums } from '../../../db/schema';
// Create postgres client for Supabase
const client = postgres(process.env.DATABASE_URL || 'postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres');
// Create drizzle database instance
export const db = drizzle(client);
// Export tables for easy access
export { recentlyPlayed, madeForYou, popularAlbums };
//# sourceMappingURL=index.js.map