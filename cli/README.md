# Spotify Clone Database Agent

This CLI tool helps manage database features for the Spotify clone project. It uses AI to understand natural language queries and implement database-related changes.

## Setup

1. Create a `.env` file in the root directory with:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spotify_clone"
OPENAI_API_KEY="your-api-key-here"
NODE_ENV="development"
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Create the database
createdb spotify_clone

# Run migrations
npm run db:push
```

## Usage

Use the database agent by running:

```bash
npm run db:agent "your query here"
```

Example queries:
- "Can you store the recently played songs in a table"
- "Can you store the 'Made for you' and 'Popular albums' in a table"

## Features

The database agent can:
- Create and modify database schemas
- Run migrations
- Set up API endpoints
- Integrate with the frontend
- Handle data population

## Database Schema

The current schema includes:

1. Recently Played Songs
```sql
Table: recently_played
- id: serial primary key
- userId: integer
- songId: integer
- playedAt: timestamp
```

2. Made For You
```sql
Table: made_for_you
- id: serial primary key
- userId: integer
- playlistId: integer
- title: text
- description: text
- coverImage: text
- createdAt: timestamp
```

3. Popular Albums
```sql
Table: popular_albums
- id: serial primary key
- title: text
- artist: text
- coverImage: text
- releaseDate: timestamp
- totalTracks: integer
- popularity: integer
- createdAt: timestamp
```

## API Endpoints

The following endpoints are available:

### GET /api/db
Query parameters:
- table: The table to query (required)
- userId: Filter by user ID (optional)

### POST /api/db
Body:
```json
{
  "table": "table_name",
  "data": {
    // table-specific fields
  }
}
```

## Development

To start the development server:
```bash
npm run dev
```

To open the database studio:
```bash
npm run db:studio
``` 