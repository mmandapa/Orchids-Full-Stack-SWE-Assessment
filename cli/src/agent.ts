#!/usr/bin/env node
import { OpenAI } from 'openai';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';
import { writeFile } from 'fs/promises';

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

// Function to create or update a file
async function updateFile(filePath: string, content: string) {
  try {
    const fullPath = join(process.cwd(), filePath);
    console.log(chalk.yellow(`📝 Updating file: ${fullPath}`));
    await writeFile(fullPath, content, 'utf8');
    console.log(chalk.green('✅ File updated successfully!'));
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
  
  console.log(chalk.dim('Found TypeScript files:'), files.map(f => f.file));
  return files;
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
          content: `You are a database agent that helps modify a Spotify clone project. When responding to queries about adding or modifying data:

1. ALWAYS include SQL commands in \`\`\`sql\`\`\` blocks
2. For frontend/backend code changes, include TypeScript code in \`\`\`typescript\`\`\` blocks with "// File: path/to/file.ts" header
3. Use NOW() for timestamps
4. Use dynamic values where possible
5. Include proper error handling
6. Break complex operations into multiple commands

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
      for (const command of sqlCommands) {
        await executeSql(command);
      }
    } else {
      console.log(chalk.yellow('  - No SQL commands found in response'));
    }

    // Step 4: Update TypeScript files
    console.log(chalk.yellow('\n📝 Step 4: Updating TypeScript Files'));
    const tsFiles = extractTypeScriptCode(aiResponse);
    if (tsFiles.length > 0) {
      for (const { file, code } of tsFiles) {
        await updateFile(file, code);
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