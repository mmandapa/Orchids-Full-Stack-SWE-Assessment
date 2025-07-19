import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Recently Played Songs Table
export const recentlyPlayed = pgTable('recently_played', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  songId: integer('song_id').notNull(),
  playedAt: timestamp('played_at').defaultNow().notNull(),
});

// Made For You Table
export const madeForYou = pgTable('made_for_you', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  playlistId: integer('playlist_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Popular Albums Table
export const popularAlbums = pgTable('popular_albums', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  coverImage: text('cover_image'),
  releaseDate: timestamp('release_date'),
  totalTracks: integer('total_tracks'),
  popularity: integer('popularity'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}); 