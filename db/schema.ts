import { pgTable, serial, varchar, timestamp, text, integer, date } from 'drizzle-orm/pg-core';

export const recentlyPlayed = pgTable('recently_played', {
  id: serial('id').primaryKey(),
  songTitle: varchar('song_title', { length: 255 }).notNull(),
  artistName: varchar('artist_name', { length: 255 }).notNull(),
  playedAt: timestamp('played_at').defaultNow().notNull()
});

export const madeForYou = pgTable('made_for_you', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  playlistId: integer('playlist_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const popularAlbums = pgTable('popular_albums', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  coverImage: text('cover_image'),
  releaseDate: timestamp('release_date'),
  totalTracks: integer('total_tracks'),
  popularity: integer('popularity'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}); 