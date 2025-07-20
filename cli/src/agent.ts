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
    // Get current table schemas
    const { stdout: schemas } = await execAsync('psql -d spotify_clone -c "\\d+"');
    console.log(chalk.dim('Current schema:'), schemas);
    
    // Get current table data samples
    const { stdout: recentlyPlayed } = await execAsync('psql -d spotify_clone -c "SELECT * FROM recently_played LIMIT 3;"');
    console.log(chalk.dim('Sample data:'), recentlyPlayed);
    
    // Get actual table schemas dynamically
    const { stdout: artistsSchema } = await execAsync('psql -d spotify_clone -c "\\d artists"');
    const { stdout: popularAlbumsSchema } = await execAsync('psql -d spotify_clone -c "\\d popular_albums"');
    const { stdout: madeForYouSchema } = await execAsync('psql -d spotify_clone -c "\\d made_for_you"');
    
    return {
      relevantFiles: [
        'db/schema.ts',
        'src/lib/db/index.ts',
        'src/app/api/db/route.ts',
        'src/components/spotify-main-content.tsx'
      ],
      schemas,
      samples: {
        recentlyPlayed
      },
      exactSchema: {
        recently_played: ['id', 'song_title', 'artist_name', 'played_at'],
        popular_albums: ['id', 'title', 'artist', 'cover_image', 'release_date', 'total_tracks', 'popularity', 'created_at'],
        made_for_you: ['id', 'user_id', 'playlist_id', 'title', 'description', 'cover_image', 'created_at'],
        artists: ['id', 'name', 'bio', 'created_at', 'updated_at']
      },
      tableSchemas: {
        artists: artistsSchema,
        popular_albums: popularAlbumsSchema,
        made_for_you: madeForYouSchema
      }
    };
  } catch (error) {
    console.error(chalk.red('❌ Error analyzing context:'), error);
    if (error instanceof Error) {
      console.error(chalk.red('Error details:'), {
        message: error.message,
        stack: error.stack
      });
    }
    return {
      relevantFiles: [
        'db/schema.ts',
        'src/lib/db/index.ts',
        'src/app/api/db/route.ts',
        'src/components/spotify-main-content.tsx'
      ],
      schemas: '',
      samples: {}
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
  
  // STRICT PROTECTION: Completely block any frontend file modifications
  const protectedFiles = [
    'src/components/',
    'src/app/page.tsx',
    'src/app/layout.tsx',
    'src/app/api/db/route.ts'
  ];
  
  const allowedFiles = files.filter(f => {
    const isProtected = protectedFiles.some(protectedPath => f.file.includes(protectedPath));
    if (isProtected) {
      console.log(chalk.red(`🚫 BLOCKED: Attempted to modify protected frontend file: ${f.file}`));
      console.log(chalk.yellow('💡 Tip: Frontend files are protected to prevent UI changes.'));
    }
    return !isProtected;
  });
  
  console.log(chalk.dim('Found TypeScript files:'), allowedFiles.map(f => f.file));
  return allowedFiles;
}

// Function to validate SQL commands against existing tables
async function validateSqlCommands(sqlCommands: string[]): Promise<string[]> {
  console.log(chalk.blue('🔍 Validating SQL commands against existing tables...'));
  
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
  
  console.log(chalk.dim('Existing tables:'), existingTables);
  
  // Validate each SQL command
  const validCommands: string[] = [];
  for (const command of sqlCommands) {
    let isValid = true;
    let errorReason = '';
    
    // Check for table references
    const tableRegex = /(?:FROM|INTO|UPDATE|DELETE FROM)\s+(\w+)/gi;
    const matches = [...command.matchAll(tableRegex)];
    
    for (const match of matches) {
      const tableName = match[1].toLowerCase();
      if (!existingTables.some(existing => existing.toLowerCase() === tableName)) {
        isValid = false;
        errorReason = `Table '${tableName}' does not exist. Available tables: ${existingTables.join(', ')}`;
        break;
      }
    }
    
    if (isValid) {
      validCommands.push(command);
      console.log(chalk.green(`✅ Valid SQL: ${command.substring(0, 50)}...`));
    } else {
      console.log(chalk.red(`❌ Invalid SQL: ${command.substring(0, 50)}...`));
      console.log(chalk.yellow(`   Reason: ${errorReason}`));
    }
  }
  
  return validCommands;
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
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a database agent that helps modify a Spotify clone project. 

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. ONLY use tables that actually exist in the database
2. NEVER reference non-existent tables
3. ALWAYS use the exact column names from the schema below
4. If a table doesn't exist, either create it first or use an existing table

EXISTING TABLES ONLY (USE THESE):
${context.exactSchema}

ACTUAL TABLE SCHEMAS (USE THESE EXACT COLUMNS):
${JSON.stringify(context.tableSchemas, null, 2)}

When responding to queries about adding or modifying data:

1. ALWAYS include SQL commands in \`\`\`sql\`\`\` blocks
2. For backend code changes only, include TypeScript code in \`\`\`typescript\`\`\` blocks with "// File: path/to/file.ts" header
3. NEVER suggest changes to frontend files (src/components/, src/app/page.tsx, src/app/layout.tsx)
4. Use NOW() for timestamps
5. Use dynamic values where possible
6. Include proper error handling
7. Break complex operations into multiple commands
8. Focus on database operations and API routes only
9. ALWAYS use the exact column names from the ACTUAL TABLE SCHEMAS above
10. NEVER modify any files in src/components/ directory
11. NEVER modify src/app/page.tsx or src/app/layout.tsx
12. NEVER modify src/app/api/db/route.ts
13. NEVER reference tables that don't exist in the EXISTING TABLES list above

STRICTLY PROTECTED FILES (ABSOLUTELY NO MODIFICATIONS):
- ANY file in src/components/ directory
- src/app/page.tsx
- src/app/layout.tsx
- src/app/api/db/route.ts

Current database schema:
${context.schemas}

Example data:
${JSON.stringify(context.samples, null, 2)}`
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
      const validCommands = await validateSqlCommands(sqlCommands);
      
      if (validCommands.length === 0) {
        console.log(chalk.red('❌ No valid SQL commands found. All commands referenced non-existent tables.'));
        console.log(chalk.yellow('💡 Tip: Only use existing tables in your database.'));
        return;
      }
      
      for (const command of validCommands) {
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