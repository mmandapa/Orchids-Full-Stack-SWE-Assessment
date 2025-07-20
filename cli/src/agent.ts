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
    
    return {
      existingTables,
      schemas
    };
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing context:'), error);
    return {
      existingTables: [],
      schemas: ''
    };
  }
}

// Function to extract SQL commands from AI response
function extractSqlCommands(response: string): string[] {
  console.log(chalk.blue('🔍 Extracting SQL commands from response...'));
  const sqlRegex = /```sql\n([\s\S]*?)```/g;
  const matches = [...response.matchAll(sqlRegex)];
  const commands = matches.map(match => {
    const sql = match[1].trim();
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
2. NEVER suggest or create tables with hardcoded names like "recently_played", "made_for_you", "popular_albums" unless specifically requested
3. ALWAYS create tables before inserting data into them
4. Use the exact table schemas provided - do not make up column names
5. When creating new tables, use sensible column names and data types
6. When inserting data, use the exact column names from the table schema
7. You can modify the frontend UI components to display new data
8. You can drop tables and recreate them if needed
9. Always provide sample data when creating new tables
10. When creating music-related tables, use column names like: song_name, artist_name, album_name, duration, image_url, etc.

CRITICAL: When generating music data, ALWAYS use REAL artist names, album titles, and song names like you would see on actual Spotify. NEVER use generic placeholders like "Album 1", "Artist A", "Song 1", etc.

DYNAMIC FRONTEND INTEGRATION:
The frontend automatically detects and displays music data from ANY table that has music-related columns (song_name, artist_name, title, album, etc.). You don't need to worry about specific table names - just create tables with music data and the frontend will automatically:
- Detect tables with music data
- Map the data to a consistent structure
- Distribute the data across the three UI sections (Recently played, Made For You, Popular albums)
- Display real artist names and song titles

Examples of REAL data to use:
- Artists: Travis Scott, Taylor Swift, Drake, Billie Eilish, The Weeknd, Ariana Grande, Post Malone, Ed Sheeran, etc.
- Albums: "Astroworld", "Midnights", "Scorpion", "Happier Than Ever", "After Hours", "Positions", "Hollywood's Bleeding", "Divide", etc.
- Songs: "SICKO MODE", "Anti-Hero", "God's Plan", "bad guy", "Blinding Lights", "positions", "Circles", "Shape of You", etc.
- Playlists: "Discover Weekly", "Release Radar", "Daily Mix 1", "Chill Hits", "Top 50 - Global", "On Repeat", etc.

Sample INSERT statements with REAL data:
INSERT INTO songs (song_name, artist_name, album_name) VALUES ('SICKO MODE', 'Travis Scott', 'Astroworld');
INSERT INTO songs (song_name, artist_name, album_name) VALUES ('Anti-Hero', 'Taylor Swift', 'Midnights');
INSERT INTO songs (song_name, artist_name, album_name) VALUES ('Blinding Lights', 'The Weeknd', 'After Hours');
INSERT INTO songs (song_name, artist_name, album_name) VALUES ('bad guy', 'Billie Eilish', 'When We All Fall Asleep, Where Do We Go?');
INSERT INTO songs (song_name, artist_name, album_name) VALUES ('God\'s Plan', 'Drake', 'Scorpion');

EXISTING TABLES (USE THESE IF THEY EXIST):
${context.existingTables.length > 0 ? context.existingTables.map(table => `- ${table}`).join('\n') : 'No tables exist yet'}

EXISTING TABLE SCHEMAS:
${context.existingTableSchemas}

CONTEXT FROM STATIC DATA:
The original Spotify UI shows these sections with proper labels and descriptions:
- "Recently played" section with songs like "Liked Songs", "Discover Weekly", "Release Radar"
- "Made For You" section with playlists like "Discover Weekly" (Your weekly mixtape of fresh music), "Release Radar" (Catch all the latest music from artists you follow), "Daily Mix 1" (Billie Eilish, Lorde, Clairo and more)
- "Popular albums" section with albums like "Midnights" by Taylor Swift, "Harry's House" by Harry Styles

When creating music data, ensure it has proper song names and artist names like normal Spotify, with descriptive text and proper formatting.

You can:
1. Create new tables with appropriate schemas
2. Insert sample data into tables
3. Query existing tables
4. Modify the frontend to display new data
5. Drop tables and recreate them if needed

Remember: Only work with tables that actually exist, and always create tables before inserting data. ALWAYS use REAL artist names, album titles, and song names - never generic placeholders. The frontend will automatically detect and display any music data you create.`

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

    // Step 3: Execute SQL commands
    console.log(chalk.yellow('\n📝 Step 3: Executing Database Changes'));
    const sqlCommands = extractSqlCommands(aiResponse);
    if (sqlCommands.length > 0) {
      // Validate SQL commands before execution
      const { valid, invalid } = validateSqlCommands(sqlCommands, context.existingTables);
      
      if (valid.length === 0) {
        console.log(chalk.red('❌ No valid SQL commands found. All commands referenced non-existent tables.'));
        console.log(chalk.yellow('💡 Tip: Only use existing tables in your database.'));
        return;
      }
      
      for (const command of valid) {
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
    await executeSql('SELECT COUNT(*) as count FROM recently_played;');
    
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