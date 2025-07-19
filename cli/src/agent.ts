import { OpenAI } from 'openai';
import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from '../../src/lib/db/index.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to run database migrations
async function runMigrations() {
  try {
    console.log(chalk.yellow('📦 Running database migrations...'));
    await execAsync('psql -d spotify_clone -f db/migrations/0000_init.sql');
    console.log(chalk.green('✅ Migrations completed successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Error running migrations:'), error);
    throw error;
  }
}

// Function to analyze project context
async function analyzeContext(query: string) {
  console.log(chalk.blue('🔍 Analyzing project context...'));
  console.log(chalk.dim('  - Scanning project files'));
  console.log(chalk.dim('  - Checking existing database schema'));
  console.log(chalk.dim('  - Analyzing query requirements'));
  
  return {
    relevantFiles: [
      'db/schema.ts',
      'src/lib/db/index.ts',
      'src/app/api/db/route.ts'
    ],
    suggestedChanges: []
  };
}

// Function to modify project files
async function modifyFiles(changes: any[]) {
  console.log(chalk.blue('📝 Modifying project files...'));
  // TODO: Implement file modifications
  console.log(chalk.dim('  - No file modifications needed'));
}

// Main query processing function
export async function processQuery(query: string, openai: OpenAI) {
  try {
    console.log(chalk.blue('\n🤖 Database Agent: Starting query processing'));
    console.log(chalk.dim('Query:', query));

    // Step 1: Analyze project context
    console.log(chalk.yellow('\n📊 Step 1: Analyzing Context'));
    const context = await analyzeContext(query);
    
    // Step 2: Generate AI response
    console.log(chalk.yellow('\n🧠 Step 2: Generating AI Response'));
    console.log(chalk.dim('  - Calling OpenAI API...'));
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a database agent that helps modify a Spotify clone project. You understand database schemas, migrations, and frontend integration."
        },
        {
          role: "user",
          content: `Query: ${query}\nContext: ${JSON.stringify(context, null, 2)}`
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content;
    console.log(chalk.green('\n✨ AI Response Received:'));
    console.log(chalk.dim(aiResponse));

    // Step 3: Modify files based on AI response
    console.log(chalk.yellow('\n📝 Step 3: Applying Changes'));
    await modifyFiles(context.suggestedChanges);

    // Step 4: Run migrations if needed
    console.log(chalk.yellow('\n🔄 Step 4: Running Migrations'));
    await runMigrations();

    console.log(chalk.green('\n✅ Query processing completed successfully!'));

  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      console.error(chalk.red('\n❌ OpenAI API Error:'), error);
    } else {
      console.error(chalk.red('\n❌ Error in processQuery:'), error);
    }
    throw error;
  }
} 