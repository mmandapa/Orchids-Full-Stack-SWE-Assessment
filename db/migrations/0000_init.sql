-- Create recently_played table
CREATE TABLE IF NOT EXISTS recently_played (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create made_for_you table
CREATE TABLE IF NOT EXISTS made_for_you (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  playlist_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create popular_albums table
CREATE TABLE IF NOT EXISTS popular_albums (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_image TEXT,
  release_date TIMESTAMP,
  total_tracks INTEGER,
  popularity INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 