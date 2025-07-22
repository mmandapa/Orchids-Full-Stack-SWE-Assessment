#!/usr/bin/env node
import { OpenAI } from 'openai';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';
import { writeFile, readFile, copyFile, access, mkdir } from 'fs/promises';

// Load environment variables
const envPath = join(process.cwd(), '.env');
console.log(chalk.blue('📁 Loading environment from:', envPath));
dotenv.config({ path: envPath });

const execAsync = promisify(exec);

// Function to execute SQL commands
async function executeSql(sqlCommand: string) {
  try {
    console.log(chalk.yellow('📝 Executing SQL command:'));
    console.log(chalk.dim(sqlCommand));
    
    // Add error handling for database connection
    const testConnection = await execAsync('psql -d spotify_clone -c "SELECT 1;"');
    console.log(chalk.green('✅ Database connection successful'));
    
    const { stdout, stderr } = await execAsync(`psql -d spotify_clone -c "${sqlCommand.replace(/"/g, '\\"')}"`);
    if (stderr) {
      console.warn(chalk.yellow('⚠️ SQL Warning:'), stderr);
    }
    if (stdout) {
      console.log(chalk.dim('Output:'), stdout);
    }
    console.log(chalk.green('✅ SQL command executed successfully!'));
    return stdout;
  } catch (error) {
    console.error(chalk.red('❌ Error executing SQL:'), error);
    if (error instanceof Error) {
      console.error(chalk.red('Error details:'), {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

// Function to backup a file before modification
async function backupFile(filePath: string): Promise<string> {
  try {
    const fullPath = join(process.cwd(), filePath);
    const backupPath = fullPath + '.backup';
    await copyFile(fullPath, backupPath);
    console.log(chalk.blue(`📦 Backed up: ${filePath}`));
    return backupPath;
  } catch (error) {
    console.error(chalk.red('❌ Error backing up file:'), error);
    throw error;
  }
}

// Function to restore a file from backup
async function restoreFile(filePath: string, backupPath: string) {
  try {
    const fullPath = join(process.cwd(), filePath);
    await copyFile(backupPath, fullPath);
    console.log(chalk.green(`🔄 Restored: ${filePath}`));
  } catch (error) {
    console.error(chalk.red('❌ Error restoring file:'), error);
    throw error;
  }
}

// Function to test if a file is valid by checking for common errors
async function testFileValidity(filePath: string): Promise<boolean> {
  try {
    const fullPath = join(process.cwd(), filePath);
    const content = await readFile(fullPath, 'utf8');
    
    // Check for common error patterns
    const errorPatterns = [
      /import.*query.*from.*lib\/db/,  // Wrong import pattern
      /export.*default.*async.*function.*handler/,  // Old API route pattern
      /NextApiRequest.*NextApiResponse/,  // Old Next.js API pattern
    ];
    
    for (const pattern of errorPatterns) {
      if (pattern.test(content)) {
        console.log(chalk.red(`❌ Invalid file detected: ${filePath}`));
        console.log(chalk.yellow(`🔍 Pattern found: ${pattern}`));
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Error testing file validity:'), error);
    return false;
  }
}

// Function to ensure directory exists
async function ensureDirectoryExists(filePath: string) {
  try {
    const fullPath = join(process.cwd(), filePath);
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    console.log(chalk.blue(`📁 Ensured directory exists: ${dir}`));
  } catch (error) {
    // Directory might already exist, which is fine
    console.log(chalk.dim(`📁 Directory check: ${dirname(join(process.cwd(), filePath))}`));
  }
}

// Function to create or update a file with backup and validation
async function updateFile(filePath: string, content: string) {
  try {
    const fullPath = join(process.cwd(), filePath);
    console.log(chalk.yellow(`📝 Updating file: ${fullPath}`));
    
    // Ensure directory exists
    await ensureDirectoryExists(filePath);
    
    // Check if file exists for backup
    let backupPath: string | null = null;
    try {
      await access(fullPath);
      // File exists, create backup
      backupPath = await backupFile(filePath);
    } catch (error) {
      // File doesn't exist, no backup needed
      console.log(chalk.blue(`📄 Creating new file: ${filePath}`));
    }
    
    // Update or create the file
    await writeFile(fullPath, content, 'utf8');
    console.log(chalk.green('✅ File updated successfully!'));
    
    // Test if the updated file is valid (only for existing files)
    if (backupPath) {
      const isValid = await testFileValidity(filePath);
      if (!isValid) {
        console.log(chalk.red('❌ File validation failed!'));
        console.log(chalk.yellow('🔄 Auto-restoring from backup...'));
        await restoreFile(filePath, backupPath);
        console.log(chalk.green('✅ File restored successfully!'));
        throw new Error(`File validation failed for ${filePath}`);
      }
    }
    
    return backupPath;
  } catch (error) {
    console.error(chalk.red('❌ Error updating file:'), error);
    if (error instanceof Error) {
      console.error(chalk.red('Error details:'), {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

// Function to clean up backup files
async function cleanupBackup(filePath: string, backupPath: string | null) {
  if (!backupPath) {
    return; // No backup to clean up
  }
  
  try {
    await access(backupPath);
    await writeFile(backupPath, ''); // Clear the backup file
    console.log(chalk.blue(`🧹 Cleaned up backup: ${filePath}`));
  } catch (error) {
    // Backup file doesn't exist, which is fine
  }
}

// Function to analyze project context
async function analyzeContext(query: string) {
  console.log(chalk.blue('🔍 Analyzing project context...'));
  console.log(chalk.dim('Query:', query));
  console.log(chalk.dim('  - Scanning project files'));
  console.log(chalk.dim('  - Checking existing database schema'));
  console.log(chalk.dim('  - Analyzing query requirements'));
  console.log(chalk.dim('  - Parsing frontend code for music data'));
  
  try {
    // Get current table schemas dynamically
    const { stdout: schemas } = await execAsync('psql -d spotify_clone -c "\\d+"');
    console.log(chalk.dim('Current schema:'), schemas);
    
    // Get list of existing tables dynamically
    const { stdout: tablesOutput } = await execAsync('psql -d spotify_clone -c "\\dt"');
    const existingTables: string[] = [];
    const lines = tablesOutput.split('\n');
    for (const line of lines) {
      const match = line.match(/\|\s+(\w+)\s+\|/);
      if (match && match[1] && !match[1].includes('_seq')) {
        existingTables.push(match[1]);
      }
    }
    
    console.log(chalk.dim('Existing tables:'), existingTables);
    
    // Parse frontend data
    const frontendData = await parseFrontendData();
    
    return {
      existingTables,
      schemas,
      frontendData
    };
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing context:'), error);
    return {
      existingTables: [],
      schemas: '',
      frontendData: {}
    };
  }
}

// Function to extract SQL commands from AI response
function extractSqlCommands(response: string): string[] {
  console.log(chalk.blue('🔍 Extracting SQL commands from response...'));
  console.log(chalk.dim('Response length:'), response.length);
  
  // Try different regex patterns
  const sqlRegex1 = /```sql\n([\s\S]*?)```/g;
  const sqlRegex2 = /```sql\s*\n([\s\S]*?)```/g;
  const sqlRegex3 = /```sql([\s\S]*?)```/g;
  
  let matches = [...response.matchAll(sqlRegex1)];
  console.log(chalk.dim('Pattern 1 matches:'), matches.length);
  
  if (matches.length === 0) {
    matches = [...response.matchAll(sqlRegex2)];
    console.log(chalk.dim('Pattern 2 matches:'), matches.length);
  }
  
  if (matches.length === 0) {
    matches = [...response.matchAll(sqlRegex3)];
    console.log(chalk.dim('Pattern 3 matches:'), matches.length);
  }
  
  const commands = matches.map(match => {
    const sql = match[1].trim();
    console.log(chalk.dim('Raw SQL block:'), sql);
    // Split multiple commands if they exist
    return sql.split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
      .map(cmd => cmd + ';');
  }).flat();
  
  console.log(chalk.dim('Found SQL commands:'), commands);
  return commands;
}

// Function to extract TypeScript code from AI response
function extractTypeScriptCode(response: string): { file: string; code: string }[] {
  console.log(chalk.blue('🔍 Extracting TypeScript code from response...'));
  const tsRegex = /```typescript\s*\/\/\s*File:\s*([^\n]+)\n([\s\S]*?)```/g;
  const matches = [...response.matchAll(tsRegex)];
  const files = matches.map(match => ({
    file: match[1].trim(),
    code: match[2].trim()
  }));
  
  // Allow frontend file modifications since UI was restored
  console.log(chalk.dim('Found TypeScript files:'), files.map(f => f.file));
  return files;
}

// Function to validate SQL commands against existing tables
function validateSqlCommands(sqlCommands: string[], existingTables: string[]): { valid: string[], invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const sql of sqlCommands) {
    let isValid = true;
    
    // Check for table references in the SQL
    const tableMatches = sql.match(/(?:FROM|INTO|UPDATE|DELETE FROM)\s+(\w+)/gi);
    if (tableMatches) {
      for (const match of tableMatches) {
        const tableName = match.replace(/(?:FROM|INTO|UPDATE|DELETE FROM)\s+/i, '').trim();
        
        // If table doesn't exist, we need to create it first
        if (!existingTables.includes(tableName)) {
          console.log(chalk.yellow(`⚠️ Table '${tableName}' does not exist - will create it first`));
          // Don't mark as invalid, just note that we need to create it
        }
      }
    }
    
    valid.push(sql);
  }

  return { valid, invalid };
}

// Function to clear all data from tables
async function clearAllTables() {
  console.log(chalk.blue('🧹 Clearing all data from tables...'));
  
  try {
    // Get list of existing tables
    const { stdout: tablesOutput } = await execAsync('psql -d spotify_clone -c "\\dt"');
    const existingTables: string[] = [];
    
    // Parse table names from output
    const lines = tablesOutput.split('\n');
    for (const line of lines) {
      const match = line.match(/\|\s+(\w+)\s+\|/);
      if (match && match[1] && !match[1].includes('_seq')) {
        existingTables.push(match[1]);
      }
    }
    
    // Clear data from each table (excluding system tables)
    const userTables = existingTables.filter(table => 
      !table.includes('_seq') && 
      !table.includes('schema') && 
      table !== 'Name'
    );
    
    for (const table of userTables) {
      console.log(chalk.yellow(`Clearing table: ${table}`));
      await execAsync(`psql -d spotify_clone -c "DELETE FROM "${table}";"`);
      console.log(chalk.green(`✅ Cleared table: ${table}`));
    }
    
    console.log(chalk.green('✅ All tables cleared successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Error clearing tables:'), error);
    throw error;
  }
}

// Function to parse frontend code and extract music data
async function parseFrontendData() {
  console.log(chalk.blue('🔍 Parsing frontend code for music data...'));
  
  try {
    // Read the main Spotify component file
    const frontendPath = join(process.cwd(), 'src/components/spotify-main-content.tsx');
    const content = await readFile(frontendPath, 'utf8');
    
    // Extract fallback data arrays
    const recentlyPlayedMatch = content.match(/const fallbackRecentlyPlayed = \[([\s\S]*?)\]/);
    const madeForYouMatch = content.match(/const fallbackMadeForYou = \[([\s\S]*?)\]/);
    const popularAlbumsMatch = content.match(/const fallbackPopularAlbums = \[([\s\S]*?)\]/);
    
    const extractedData: { [key: string]: any[] } = {};
    
    if (recentlyPlayedMatch) {
      const recentlyPlayedData = parseDataArray(recentlyPlayedMatch[1]);
      extractedData.recentlyPlayed = recentlyPlayedData;
      console.log(chalk.green(`✅ Extracted ${recentlyPlayedData.length} recently played items`));
    }
    
    if (madeForYouMatch) {
      const madeForYouData = parseDataArray(madeForYouMatch[1]);
      extractedData.madeForYou = madeForYouData;
      console.log(chalk.green(`✅ Extracted ${madeForYouData.length} made for you items`));
    }
    
    if (popularAlbumsMatch) {
      const popularAlbumsData = parseDataArray(popularAlbumsMatch[1]);
      extractedData.popularAlbums = popularAlbumsData;
      console.log(chalk.green(`✅ Extracted ${popularAlbumsData.length} popular albums`));
    }
    
    return extractedData;
  } catch (error) {
    console.error(chalk.red('❌ Error parsing frontend data:'), error);
    return {};
  }
}

// Function to parse data array from frontend code
function parseDataArray(arrayString: string): any[] {
  const items: any[] = [];
  
  // Split by individual objects
  const objectMatches = arrayString.match(/\{[^}]*\}/g);
  
  if (objectMatches) {
    for (const objectStr of objectMatches) {
      const item: any = {};
      
      // Extract key-value pairs
      const keyValueMatches = objectStr.match(/(\w+):\s*"([^"]*)"/g);
      
      if (keyValueMatches) {
        for (const kv of keyValueMatches) {
          const match = kv.match(/(\w+):\s*"([^"]*)"/);
          if (match) {
            const [, key, value] = match;
            item[key] = value;
          }
        }
      }
      
      if (Object.keys(item).length > 0) {
        items.push(item);
      }
    }
  }
  
  return items;
}

// Function to escape SQL strings properly
function escapeSqlString(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// Main query processing function
export async function processQuery(query: string, openai: OpenAI) {
  try {
    console.log(chalk.blue('\n🤖 Database Agent: Starting query processing'));
    console.log(chalk.dim('Query:', query));
    console.log(chalk.dim('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY));

    // Step 1: Analyze project context
    console.log(chalk.yellow('\n📊 Step 1: Analyzing Context'));
    const context = await analyzeContext(query);
    
    // Step 2: Generate AI response
    console.log(chalk.yellow('\n🧠 Step 2: Generating AI Response'));
    console.log(chalk.dim('  - Calling OpenAI API...'));
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set in environment variables');
    }
    
    const systemPrompt = `You are a database agent for a Spotify clone application. Your role is to help users manage their database by creating, modifying, and querying tables and data.

IMPORTANT RULES:
1. NEVER assume a table exists unless it's explicitly mentioned in the existing tables list
2. ALWAYS create tables before inserting data into them
3. Use the exact table schemas provided - do not make up column names
4. When creating new tables, use sensible column names and data types
5. When inserting data, use the exact column names from the table schema
6. You can modify the frontend UI component to display data from any table structure

CRITICAL SQL GENERATION RULES:
- ALWAYS generate COMPLETE SQL statements with REAL data
- NEVER use placeholders like "..." or "etc." in SQL statements
- ALWAYS include ALL the data you want to insert in the SQL statement
- If you need to insert multiple rows, include ALL rows in the INSERT statement
- NEVER use incomplete SQL statements
- ALWAYS escape apostrophes in SQL strings by doubling them (e.g., "can't" becomes "can''t")
- ALWAYS escape backslashes in SQL strings by doubling them (e.g., "path\\file" becomes "path\\\\file")

CRITICAL DATA RULES:
- ALWAYS generate REAL artist names, song titles, and album names - NEVER use test names, placeholders, or generic names
- ALWAYS display the SONG TITLE, ARTIST NAME, or ALBUM NAME in the UI - NEVER display IDs or technical identifiers
- Examples of REAL data to generate:
  * Artists: "Taylor Swift", "Drake", "The Weeknd", "Bad Bunny", "Ed Sheeran", "Ariana Grande", "Post Malone", "Billie Eilish"
  * Songs: "Cruel Summer", "Flowers", "Last Night", "Vampire", "Kill Bill", "Anti-Hero", "As It Was", "Unholy"
  * Albums: "Midnights", "SOS", "One Thing at a Time", "GUTS", "Renaissance", "Un Verano Sin Ti", "= (Equals)", "Happier Than Ever"
  * Playlists: "Today's Top Hits", "RapCaviar", "All Out 2010s", "Rock Classics", "Chill Hits", "Peaceful Piano", "Deep Focus", "Instrumental Study"

SPOTIFY UI STRUCTURE - UNDERSTAND THE LAYOUT:
The frontend has EXACTLY THREE main sections that display music data in this specific order:

1. "Recently Played" section (FIRST section)
   - Shows recently listened songs, albums, and playlists
   - Contains individual tracks, albums, or playlists the user has recently played
   - Examples: "Cruel Summer - Taylor Swift", "Midnights - Taylor Swift", "Today's Top Hits - Spotify"

2. "Made For You" section (SECOND section)  
   - Shows personalized playlists, daily mixes, and recommendations
   - Contains curated playlists and personalized content
   - Examples: "Daily Mix 1 - Spotify", "Discover Weekly - Spotify", "Release Radar - Spotify"

3. "Popular Albums" section (THIRD section)
   - Shows trending albums, new releases, and popular music
   - Contains popular albums and new releases
   - Examples: "SOS - SZA", "One Thing at a Time - Morgan Wallen", "GUTS - Olivia Rodrigo"

DATA CHARACTERISTICS BY SECTION - UNDERSTAND WHAT TO GENERATE:

"Recently Played" Section Data Characteristics:
- Individual songs the user has recently listened to
- Recent albums the user has played
- Playlists the user has recently accessed
- Mix of genres and artists the user actually listens to
- Personal listening history and activity
- Data should feel like actual user behavior and preferences
- Include both individual tracks and full albums/playlists
- Mix of popular and personal music choices

"Made For You" Section Data Characteristics:
- Curated playlists created by Spotify's algorithm
- Daily Mixes (Daily Mix 1, Daily Mix 2, etc.)
- Weekly discovery playlists (Discover Weekly, Release Radar)
- Personalized recommendations based on user taste
- Themed playlists (Chill Hits, Peaceful Piano, Deep Focus)
- Time-based playlists (On Repeat, Time Capsule)
- Genre-specific mixes and mood-based playlists
- Data should feel algorithmically curated and personalized
- Include descriptive text about the playlist's purpose
- Mix of familiar artists and new discoveries

"Popular Albums" Section Data Characteristics:
- Trending and chart-topping albums
- New releases from popular artists
- Albums that are currently popular globally
- Hit albums and successful releases
- Albums from major artists and rising stars
- Current music trends and popular genres
- Data should feel like current music charts and trends
- Include both established and emerging artists
- Focus on full albums, not individual songs
- Mix of different genres and styles

CONTENT PATTERNS AND EXAMPLES:

For "Recently Played" - Generate data that represents:
- Individual song titles with artist names
- Album names with artist names  
- Playlist names with creator/curator names
- Mix of recent listening activity
- Personal music choices and preferences
- Realistic listening patterns and behavior

For "Made For You" - Generate data that represents:
- Playlist names with descriptive subtitles
- Daily Mix playlists (Daily Mix 1, Daily Mix 2, etc.)
- Weekly discovery playlists (Discover Weekly, Release Radar)
- Themed playlists (Chill Hits, Peaceful Piano, Deep Focus)
- Personalized recommendation playlists
- Time-based playlists (On Repeat, Time Capsule)
- Include descriptive text about the playlist's purpose or theme

For "Popular Albums" - Generate data that represents:
- Album titles with artist names
- New releases and trending albums
- Chart-topping and popular albums
- Albums from major artists and rising stars
- Current music trends and popular genres
- Focus on full albums, not individual songs

CRITICAL DATA GENERATION RULES:
- ALWAYS use the EXACT data from the frontend fallback arrays (fallbackRecentlyPlayed, fallbackMadeForYou, fallbackPopularAlbums)
- NEVER generate fake data - use the real data from the frontend code
- Use the exact titles, artists, and images from the frontend data
- NEVER use test names, placeholders, or generic names
- Make data feel authentic and realistic
- Match the content type expected for each section
- Include appropriate descriptive text and context
- Ensure data fits the Spotify-like experience for each section

FRONTEND DATA TO USE:
The frontend contains real data in these arrays:
- fallbackRecentlyPlayed: Contains 6 real playlists/songs with exact titles, artists, and image URLs
- fallbackMadeForYou: Contains 6 real playlists with exact titles, artists, and image URLs  
- fallbackPopularAlbums: Contains 6 real albums with exact titles, artists, and image URLs

ALWAYS extract and use this exact data when populating the database.

INTELLIGENT QUERY MAPPING - MATCH REQUESTS TO CORRECT SECTIONS:
When users make requests, you MUST intelligently identify which UI section they're referring to and update the correct section:

KEYWORDS THAT MAP TO "Recently Played" (FIRST section):
- "recently played" / "recent" / "played" / "recently listened" / "recently played songs"
- "songs" / "tracks" / "music" (when context suggests recent activity)
- "individual songs" / "recent tracks" / "what I played"
- "my recent music" / "recently played albums"
- "history" / "listening history" / "recent activity"
- "what I've been playing" / "my recent tracks"

KEYWORDS THAT MAP TO "Made For You" (SECOND section):
- "made for you" / "made" / "for you" / "personalized" / "recommendations"
- "playlists" / "daily mix" / "discover weekly" / "release radar"
- "curated" / "personalized playlists" / "recommended"
- "daily mixes" / "discover" / "weekly" / "radar"
- "personalized" / "recommendations" / "curated for me"
- "my playlists" / "personal playlists" / "custom playlists"

KEYWORDS THAT MAP TO "Popular Albums" (THIRD section):
- "popular albums" / "popular" / "albums" / "trending" / "new releases"
- "trending albums" / "popular music" / "new albums"
- "top albums" / "charting albums" / "hit albums"
- "new releases" / "latest albums" / "trending music"
- "chart toppers" / "hit songs" / "popular artists"

SMART TABLE NAMING CONVENTION:
When creating tables, use these naming patterns to help the frontend automatically map data to the correct sections:

For "Recently Played" section:
- Table names: "recently_played_songs", "recent_tracks", "listening_history", "recent_activity"
- Data type: Individual songs, albums, or playlists the user has recently played

For "Made For You" section:
- Table names: "made_for_you_playlists", "personalized_mixes", "daily_mixes", "recommended_playlists"
- Data type: Curated playlists, daily mixes, personalized recommendations

For "Popular Albums" section:
- Table names: "popular_albums", "trending_albums", "new_releases", "chart_toppers"
- Data type: Popular albums, new releases, trending music

EXAMPLES OF CORRECT MAPPING:
- User says "create a table with recently played songs" → Create "recently_played_songs" table → Update "Recently Played" section (FIRST)
- User says "add some made for you playlists" → Create "made_for_you_playlists" table → Update "Made For You" section (SECOND)  
- User says "update popular albums" → Create "popular_albums" table → Update "Popular Albums" section (THIRD)
- User says "add songs to recently played" → Update "recently_played_songs" table → Update "Recently Played" section (FIRST)
- User says "create playlists for made for you" → Create "made_for_you_playlists" table → Update "Made For You" section (SECOND)

CONTEXT-AWARE MAPPING:
If the user doesn't specify a section explicitly, analyze the context:
- If they mention "songs" or "tracks" → Likely "Recently Played"
- If they mention "playlists" or "mixes" → Likely "Made For You"  
- If they mention "albums" or "releases" → Likely "Popular Albums"
- If they mention "popular" or "trending" → Likely "Popular Albums"
- If they mention "personalized" or "recommended" → Likely "Made For You"

CRITICAL: When a user asks to update a specific section, you MUST:
1. Identify which of the THREE UI sections they're referring to
2. Create or update a table with data appropriate for that specific section
3. Use table names that clearly indicate the section (e.g., "recently_played_songs", "made_for_you_playlists", "popular_albums")
4. Generate data that fits the style and content type of that specific section
5. The frontend will automatically detect and display the data in the correct section

ORIGINAL SPOTIFY UI CONTEXT:
The frontend has three main sections that should always be populated with real Spotify-like content:
1. "Recently Played" - Shows recently listened songs, albums, and playlists
2. "Made For You" - Shows personalized playlists, daily mixes, and recommendations  
3. "Popular Albums" - Shows trending albums, new releases, and popular music

ALWAYS use the original Spotify UI as your reference for:
- What type of content belongs in each section
- How to structure the data (title, artist, album, cover image)
- What labels and descriptions to use
- The overall user experience and data presentation

When creating or updating data, ensure it fits the original UI's style and content type for each section. The frontend will automatically adapt to any table structure you create, but you must provide real, Spotify-like data that matches the original UI's expectations.

IMPORTANT TABLE SCHEMAS:
- recently_played_music table: id (SERIAL), title (VARCHAR), artist (VARCHAR), album (VARCHAR), image (VARCHAR)
- made_for_you_playlists table: id (SERIAL), title (VARCHAR), artist (VARCHAR), album (VARCHAR), image (VARCHAR) - USE EXACT ORIGINAL STRUCTURE
- popular_albums table: id (SERIAL), title (VARCHAR), artist (VARCHAR), cover_image (VARCHAR), release_date (DATE), total_tracks (INTEGER), popularity (INTEGER), created_at (TIMESTAMP)

ALWAYS use the exact column names from the existing tables when inserting data.

Remember: The frontend is completely dynamic and will work with ANY table structure you create. Just focus on generating real music data and matching user queries to the correct UI sections.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Query: ${query}\nContext: ${JSON.stringify(context, null, 2)}`
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content || '';
    console.log(chalk.green('\n✨ AI Response Received:'));
    console.log(chalk.dim(aiResponse));

    console.log(chalk.blue('🔍 About to start Step 3...'));

    // Step 3: Execute SQL commands
    console.log(chalk.yellow('\n📝 Step 3: Executing Database Changes'));
    const sqlCommands = extractSqlCommands(aiResponse);
    console.log(chalk.blue(`Found ${sqlCommands.length} SQL commands to execute`));
    
    if (sqlCommands.length > 0) {
      // Validate SQL commands before execution
      const { valid, invalid } = validateSqlCommands(sqlCommands, context.existingTables);
      console.log(chalk.blue(`Valid commands: ${valid.length}, Invalid commands: ${invalid.length}`));
      
      if (valid.length === 0) {
        console.log(chalk.red('❌ No valid SQL commands found. All commands referenced non-existent tables.'));
        console.log(chalk.yellow('💡 Tip: Only use existing tables in your database.'));
        return;
      }
      
      console.log(chalk.green('Executing SQL commands...'));
      for (const command of valid) {
        console.log(chalk.blue(`Executing: ${command}`));
        await executeSql(command);
      }
    } else {
      console.log(chalk.yellow('  - No SQL commands found in response'));
    }

    // Step 4: Update TypeScript files with backup and validation
    console.log(chalk.yellow('\n📝 Step 4: Updating TypeScript Files'));
    const tsFiles = extractTypeScriptCode(aiResponse);
    if (tsFiles.length > 0) {
      const backups: { file: string; backup: string | null }[] = [];
      for (const { file, code } of tsFiles) {
        try {
          console.log(chalk.blue(`📝 Processing file: ${file}`));
          const backupPath = await updateFile(file, code);
          if (backupPath) {
            backups.push({ file, backup: backupPath });
          } else {
            backups.push({ file, backup: null });
          }
          console.log(chalk.green(`✅ Successfully processed: ${file}`));
        } catch (error) {
          console.log(chalk.red(`❌ Failed to update ${file}:`));
          if (error instanceof Error) {
            console.log(chalk.dim(`   Error: ${error.message}`));
          }
          console.log(chalk.yellow(`   Skipping file and continuing...`));
        }
      }
      
      // Clean up successful backups
      for (const { file, backup } of backups) {
        if (backup) {
          try {
            await cleanupBackup(file, backup);
          } catch (error) {
            console.log(chalk.yellow(`⚠️ Could not cleanup backup for ${file}`));
          }
        }
      }
    } else {
      console.log(chalk.yellow('  - No TypeScript files to update'));
    }

    // Step 5: Verify changes
    console.log(chalk.yellow('\n🔍 Step 5: Verifying Changes'));
    
    // Get updated list of tables to verify changes
    const { stdout: updatedTablesOutput } = await execAsync('psql -d spotify_clone -c "\\dt"');
    const updatedTables: string[] = [];
    const lines = updatedTablesOutput.split('\n');
    for (const line of lines) {
      const match = line.match(/\|\s+(\w+)\s+\|/);
      if (match && match[1] && !match[1].includes('_seq')) {
        updatedTables.push(match[1]);
      }
    }
    
    // Verify data in relevant tables
    for (const table of updatedTables) {
      if (table.includes('recently') || table.includes('made') || table.includes('popular')) {
        try {
          const { stdout: countResult } = await execAsync(`psql -d spotify_clone -c "SELECT COUNT(*) as count FROM "${table}";"`);
          console.log(chalk.green(`✅ Table ${table} has data: ${countResult.trim()}`));
        } catch (error) {
          console.log(chalk.yellow(`⚠️ Could not verify table ${table}`));
        }
      }
    }
    
    console.log(chalk.green('\n✅ Query processing completed successfully!'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error in processQuery:'), error);
    if (error instanceof Error) {
      console.error(chalk.red('Error details:'), {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      if ('response' in error) {
        console.error(chalk.red('OpenAI API Error Response:'), error.response);
      }
    }
    throw error;
  }
} 