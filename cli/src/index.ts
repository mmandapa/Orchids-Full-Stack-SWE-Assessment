#!/usr/bin/env node
import { Command } from 'commander';
import { OpenAI } from 'openai';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { processQuery } from './agent.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Load environment variables from root .env file
const envPath = join(__dirname, '../..', '.env');
console.log(chalk.blue('📁 Loading environment from:', envPath));
dotenv.config({ path: envPath });

if (!process.env.OPENAI_API_KEY) {
  console.error(chalk.red('❌ Error: OPENAI_API_KEY is not set in .env file'));
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get all tables
async function getAllTables(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('psql -d spotify_clone -c "\\dt"');
    const lines = stdout.split('\n');
    const tables: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/\|\s+(\w+)\s+\|/);
      if (match && match[1] && !match[1].includes('_seq')) {
        tables.push(match[1]);
      }
    }
    
    return tables.filter(table => table.length > 0);
  } catch (error) {
    console.error(chalk.red('❌ Error getting tables:'), error);
    return [];
  }
}

// Function to view table data
async function viewTable(tableName: string, limit: number = 10) {
  try {
    console.log(chalk.blue(`📊 Viewing table: ${tableName}`));
    console.log(chalk.dim('─'.repeat(50)));
    
    const { stdout } = await execAsync(`psql -d spotify_clone -c "SELECT * FROM "${tableName}" LIMIT ${limit};"`);
    
    // Format the output nicely
    const lines = stdout.split('\n');
    let inTable = false;
    
    for (const line of lines) {
      if (line.includes('----')) {
        inTable = !inTable;
        if (inTable) {
          console.log(chalk.cyan('┌' + '─'.repeat(78) + '┐'));
        } else {
          console.log(chalk.cyan('└' + '─'.repeat(78) + '┘'));
        }
      } else if (inTable && line.trim()) {
        console.log(chalk.cyan('│') + ' ' + line + ' '.repeat(Math.max(0, 78 - line.length)) + chalk.cyan('│'));
      } else if (line.trim() && !line.includes('rows)')) {
        console.log(chalk.dim(line));
      }
    }
    
    console.log(chalk.green(`✅ Displayed up to ${limit} rows from ${tableName}`));
  } catch (error) {
    console.error(chalk.red(`❌ Error viewing table ${tableName}:`), error);
  }
}

// Function to show available commands
function showAvailableCommands() {
  console.log(chalk.blue('🎯 Available Commands:'));
  console.log(chalk.dim('─'.repeat(50)));
  
  const commands = [
    {
      command: 'db-agent',
      description: 'Interactive mode - shows this menu and allows command execution',
      example: 'db-agent'
    },
    {
      command: 'db-agent query <query>',
      description: 'Process a database-related query with AI',
      example: 'db-agent query "Add a new song to recently played"'
    },
    {
      command: 'db-agent tables',
      description: 'List all available database tables',
      example: 'db-agent tables'
    },
    {
      command: 'db-agent view <table>',
      description: 'View data from a specific table (shows first 10 rows)',
      example: 'db-agent view recently_played'
    },
    {
      command: 'db-agent view <table> --limit <number>',
      description: 'View data from a table with custom row limit',
      example: 'db-agent view recently_played --limit 5'
    }
  ];
  
  commands.forEach((cmd, index) => {
    console.log(chalk.yellow(`${index + 1}. ${cmd.command}`));
    console.log(chalk.dim(`   ${cmd.description}`));
    console.log(chalk.green(`   Example: ${cmd.example}`));
    console.log('');
  });
}

// Function to run interactive mode
async function runInteractiveMode() {
  console.log(chalk.blue('🤖 Database Agent - Interactive Mode'));
  console.log(chalk.dim('─'.repeat(50)));
  
  showAvailableCommands();
  
  console.log(chalk.blue('💡 Interactive Commands:'));
  console.log(chalk.dim('─'.repeat(50)));
  
  const interactiveCommands = [
    { key: '1', action: 'List all tables', command: 'tables' },
    { key: '2', action: 'View table data', command: 'view <table>' },
    { key: '3', action: 'Process AI query', command: 'query <your question>' },
    { key: '4', action: 'Show this help', command: 'help' },
    { key: 'q', action: 'Quit', command: 'quit' }
  ];
  
  interactiveCommands.forEach(cmd => {
    console.log(chalk.yellow(`${cmd.key}. ${cmd.action}`));
    console.log(chalk.dim(`   Command: ${cmd.command}`));
  });
  
  console.log(chalk.dim('─'.repeat(50)));
  console.log(chalk.blue('🎯 Enter a command or number:'));
  
  // For now, we'll just show the available options
  // In a full implementation, you'd use a library like inquirer for true interactivity
  console.log(chalk.green('✅ Interactive mode ready! Use the commands above.'));
  console.log(chalk.dim('💡 Tip: Use "db-agent query <your question>" for AI-powered database operations'));
}

// Create CLI program
const program = new Command();

program
  .name('db-agent')
  .description('AI-powered database agent for Spotify clone')
  .version('1.0.0');

// Main command (no subcommand) - interactive mode
program
  .description('Interactive database agent')
  .action(async () => {
    await runInteractiveMode();
  });

// Query command
program
  .command('query')
  .description('Process a database-related query with AI')
  .argument('<query>', 'The query to process')
  .action(async (query: string) => {
    try {
      console.log(chalk.blue('🤖 Database Agent: Processing your query...'));
      console.log(chalk.dim(`Query: ${query}`));
      
      // Process the query using our agent
      await processQuery(query, openai);
      
      console.log(chalk.green('✨ Query processing completed!'));
    } catch (error) {
      console.error(chalk.red('Error processing query:'), error);
      if (error instanceof Error) {
        console.error(chalk.red('Error details:'), {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      process.exit(1);
    }
  });

// Tables command
program
  .command('tables')
  .description('List all available database tables')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Available Database Tables:'));
      console.log(chalk.dim('─'.repeat(50)));
      
      const tables = await getAllTables();
      
      if (tables.length === 0) {
        console.log(chalk.yellow('⚠️ No tables found or database connection failed'));
        return;
      }
      
      tables.forEach((table, index) => {
        console.log(chalk.green(`${index + 1}. ${table}`));
      });
      
      console.log(chalk.dim('─'.repeat(50)));
      console.log(chalk.blue(`📈 Total tables: ${tables.length}`));
      console.log(chalk.dim('💡 Use "db-agent view <table>" to see table data'));
    } catch (error) {
      console.error(chalk.red('❌ Error listing tables:'), error);
    }
  });

// View command
program
  .command('view')
  .description('View data from a specific table')
  .argument('<table>', 'Table name to view')
  .option('-l, --limit <number>', 'Number of rows to display', '10')
  .action(async (table: string, options: { limit: string }) => {
    try {
      const limit = parseInt(options.limit);
      if (isNaN(limit) || limit < 1) {
        console.error(chalk.red('❌ Invalid limit. Must be a positive number.'));
        return;
      }
      
      await viewTable(table, limit);
    } catch (error) {
      console.error(chalk.red('❌ Error viewing table:'), error);
    }
  });

// Help command
program
  .command('help')
  .description('Show detailed help and examples')
  .action(() => {
    console.log(chalk.blue('🤖 Database Agent - Help'));
    console.log(chalk.dim('─'.repeat(50)));
    
    showAvailableCommands();
    
    console.log(chalk.blue('🔧 Common Use Cases:'));
    console.log(chalk.dim('─'.repeat(50)));
    
    const useCases = [
      {
        scenario: 'Add data to database',
        command: 'db-agent query "Add a new song called \'New Song\' by \'New Artist\' to recently played"',
        description: 'AI will create the appropriate SQL and execute it'
      },
      {
        scenario: 'Create backup tables',
        command: 'db-agent query "Create a backup of the popular_albums table"',
        description: 'AI will create a new table with the same structure and data'
      },
      {
        scenario: 'View table structure',
        command: 'db-agent view recently_played',
        description: 'See the actual data in a table'
      },
      {
        scenario: 'List all tables',
        command: 'db-agent tables',
        description: 'See what tables exist in the database'
      }
    ];
    
    useCases.forEach((useCase, index) => {
      console.log(chalk.yellow(`${index + 1}. ${useCase.scenario}`));
      console.log(chalk.green(`   Command: ${useCase.command}`));
      console.log(chalk.dim(`   ${useCase.description}`));
      console.log('');
    });
  });

program.parse(); 