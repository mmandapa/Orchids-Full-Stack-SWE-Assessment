# Spotify Clone - Full Stack Assessment

A modern Spotify clone built with Next.js, featuring an AI-powered CLI tool for database management and a beautiful, responsive music streaming interface.

## 🚀 Features

- **Spotify-like Interface**: Modern, responsive design with dark theme
- **AI-Powered CLI**: Natural language database management
- **Real-time Data**: Dynamic content from PostgreSQL database
- **Interactive Player**: Music playback simulation
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Database Studio**: Built-in database management interface

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** (v12 or higher)
- **Git**

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Orchids-Full-Stack-SWE-Assessment
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/spotify_clone"

# OpenAI API Key (for CLI functionality)
OPENAI_API_KEY="your-openai-api-key-here"

# Environment
NODE_ENV="development"
```

### 3. Database Setup

#### Option A: Using PostgreSQL locally

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create the database**:
   ```bash
   createdb spotify_clone
   ```

#### Option B: Using Neon (Cloud PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file

### 4. Install Dependencies

```bash
# Install main application dependencies
npm install

# Install CLI tool dependencies
cd cli
npm install
cd ..
```

### 5. Database Migration

```bash
# Push the schema to the database
npm run db:push

# (Optional) Run initial migration
npm run db:migrate
```

## 🎮 Usage

### Starting the Application

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Using the CLI Tool

The CLI tool allows you to manage the database using natural language commands:

```bash
# Basic usage
npm run db:agent "your query here"

# Examples:
npm run db:agent "Can you store the recently played songs in a table"
npm run db:agent "Can you store the 'Made for you' and 'Popular albums' in a table"
npm run db:agent "Create a table for user playlists"
```

#### CLI Features

- **Natural Language Processing**: Use plain English to describe database changes
- **Schema Generation**: Automatically creates and modifies database schemas
- **API Integration**: Sets up corresponding API endpoints
- **Data Population**: Can populate tables with sample data
- **Migration Management**: Handles database migrations automatically

### Database Management

```bash
# Open Drizzle Studio (database GUI)
npm run db:studio

# Push schema changes
npm run db:push

# Generate new migration
npx drizzle-kit generate
```

## 🏗️ Project Structure

```
Orchids-Full-Stack-SWE-Assessment/
├── cli/                          # AI-powered CLI tool
│   ├── src/
│   │   ├── agent.ts             # Main CLI logic
│   │   └── index.ts             # CLI entry point
│   ├── package.json             # CLI dependencies
│   └── README.md               # CLI documentation
├── db/                          # Database configuration
│   ├── migrations/              # Database migrations
│   ├── schema.ts               # Database schema
│   └── schema.d.ts             # Generated types
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   └── db/           # Database API endpoints
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── blocks/           # UI block components
│   │   ├── ui/               # Reusable UI components
│   │   ├── spotify-*.tsx     # Spotify-specific components
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── api.ts           # API utilities
│   │   ├── db/              # Database utilities
│   │   └── utils.ts         # General utilities
│   └── ...
├── public/                    # Static assets
├── drizzle.config.ts          # Drizzle ORM configuration
├── package.json               # Main dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🗄️ Database Schema

The application uses three main tables:

### Recently Played Songs
```sql
Table: recently_played
- id: serial primary key
- songTitle: varchar(255) not null
- artistName: varchar(255) not null
- playedAt: timestamp default now()
```

### Made For You Playlists
```sql
Table: made_for_you
- id: serial primary key
- userId: integer not null
- playlistId: integer not null
- title: text not null
- description: text
- coverImage: text
- createdAt: timestamp default now()
```

### Popular Albums
```sql
Table: popular_albums
- id: serial primary key
- title: text not null
- artist: text not null
- coverImage: text
- releaseDate: timestamp
- totalTracks: integer
- popularity: integer
- createdAt: timestamp default now()
```

## 🔌 API Endpoints

### Database API

- **GET** `/api/db` - Query database tables
  - Query params: `table` (required), `userId` (optional)
- **POST** `/api/db` - Insert data into tables
  - Body: `{ "table": "table_name", "data": {...} }`

### Database Tables API

- **GET** `/api/db/tables` - List all available tables

## 🎨 UI Components

The application includes a comprehensive set of UI components:

- **Music Cards**: Interactive music/playlist cards with hover effects
- **Player Interface**: Spotify-like music player
- **Navigation**: Responsive sidebar and header
- **Grid Layouts**: Responsive grid systems for content
- **Loading States**: Skeleton loaders and animations
- **Interactive Elements**: Buttons, forms, and modals

## 🚀 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:push         # Push schema to database
npm run db:studio       # Open Drizzle Studio
npm run db:agent        # Run CLI agent
npm run db:migrate      # Run database migrations

# CLI (from cli/ directory)
cd cli
npm run build          # Build CLI tool
npm run dev            # Run CLI in development
npm run start          # Run built CLI
```

### Development Workflow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open Drizzle Studio** (in another terminal):
   ```bash
   npm run db:studio
   ```

3. **Use the CLI for database changes**:
   ```bash
   npm run db:agent "Create a table for user favorites"
   ```

4. **View changes in real-time** at [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

The application includes comprehensive error handling and fallback states:

- **Database Connection**: Graceful fallback when database is unavailable
- **Data Loading**: Skeleton loaders and loading states
- **Error Boundaries**: User-friendly error messages
- **Empty States**: Helpful messages when no data is available

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Configure build settings for Next.js
- **Railway**: Add PostgreSQL add-on
- **Heroku**: Use Heroku Postgres add-on
- **AWS/GCP**: Use managed PostgreSQL services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**:
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- Verify the database exists: `createdb spotify_clone`

**CLI Not Working**:
- Ensure you have an OpenAI API key
- Check that the CLI dependencies are installed: `cd cli && npm install`
- Verify the CLI is built: `cd cli && npm run build`

**Build Errors**:
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all environment variables are set

**Port Already in Use**:
- Change the port: `npm run dev -- -p 3001`
- Or kill the process using the port

### Getting Help

- Check the console for error messages
- Use Drizzle Studio to inspect the database
- Review the CLI logs for database agent errors
- Ensure all environment variables are properly set

## 🎯 Next Steps

- Add user authentication
- Implement real music playback
- Add playlist management
- Create user profiles
- Add social features
- Implement search functionality
- Add music recommendations
- Create mobile app
