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
import inquirer from 'inquirer';
import readline from 'readline';
import figlet from 'figlet';
import gradient from 'gradient-string';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

// Load environment variables from root .env file
const envPath = join(__dirname, '../..', '.env');
dotenv.config({ path: envPath });

if (!process.env.OPENAI_API_KEY) {
  console.error(chalk.red('❌ Error: OPENAI_API_KEY is not set in .env file'));
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to display Claude-like logo
function displayLogo() {
  console.clear();
  const logo = figlet.textSync('DB-AGENT', {
    font: 'Big',
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true
  });
  
  console.log(gradient.rainbow(logo));
  console.log(chalk.cyan.dim('(by orchids)'));
  console.log('');
  console.log(chalk.blue.bold('Database Agent'));
  console.log(chalk.dim('AI-powered database operations for Spotify clone'));
  console.log(chalk.dim('─'.repeat(80)));
  console.log(chalk.yellow('Keyboard shortcuts:'));
  console.log(chalk.dim('  Arrow keys: Navigate options'));
  console.log(chalk.dim('  Type: Search options'));
  console.log(chalk.dim('  Enter: Select option'));
  console.log(chalk.dim('  Ctrl+C: Exit anytime'));
  console.log(chalk.dim('─'.repeat(80)));
  console.log('');
}

// Function to get all tables
async function getAllTables(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('psql -d spotify_clone -c "\\dt"');
    const lines = stdout.split('\n');
    const tables: string[] = [];
    
    // Parse table names from PostgreSQL output
    for (const line of lines) {
      // Look for lines that contain table information
      const match = line.match(/\|\s+(\w+)\s+\|/);
      if (match && match[1]) {
        const tableName = match[1];
        // Filter out sequences and system tables
        if (!tableName.includes('_seq') && 
            !tableName.includes('schema') && 
            tableName !== 'Name' &&
            tableName !== 'PopAlb_backup') {
          tables.push(tableName);
        }
      }
    }
    
    // Validate each table exists
    const validTables: string[] = [];
    for (const table of tables) {
      try {
        // Test if table exists by trying to get its schema
        await execAsync(`psql -d spotify_clone -c "\\d "${table}""`);
        validTables.push(table);
      } catch (error) {
        console.log(chalk.dim(`Skipping non-existent table: ${table}`));
      }
    }
    
    return validTables;
  } catch (error) {
    console.error(chalk.red('❌ Error getting tables:'), error);
    return [];
  }
}

// Function to view table data
async function viewTable(tableName: string, limit: number = 10) {
  try {
    console.log(chalk.blue(`Viewing table: ${tableName}`));
    console.log(chalk.dim('─'.repeat(50)));
    
    // First verify the table exists
    try {
      await execAsync(`psql -d spotify_clone -c "\\d "${tableName}""`);
    } catch (error) {
      console.error(chalk.red(`❌ Table '${tableName}' does not exist or cannot be accessed.`));
      return;
    }
    
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
    
    console.log(chalk.green(`Displayed up to ${limit} rows from ${tableName}`));
  } catch (error) {
    console.error(chalk.red(`Error viewing table ${tableName}:`), error);
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

// Function to create interactive menu
async function createInteractiveMenu() {
  const choices = [
    {
      name: 'List all database tables',
      value: 'tables',
      description: 'Show all available tables in the database'
    },
    {
      name: 'View table data',
      value: 'view',
      description: 'Display data from a specific table'
    },
    {
      name: 'Process AI query',
      value: 'query',
      description: 'Ask AI to perform database operations'
    },
    {
      name: 'Reset database (wipe all data)',
      value: 'reset',
      description: 'Drop all tables and restore UI to original form'
    },
    {
      name: 'Show help',
      value: 'help',
      description: 'Display detailed help and examples'
    },
    {
      name: 'Exit (Ctrl+C)',
      value: 'exit',
      description: 'Close the application'
    }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do? (Use arrow keys or type to search)',
      choices: choices,
      pageSize: 10
    }
  ]);

  return action;
}

// Function to handle table selection
async function selectTable(): Promise<string> {
  const tables = await getAllTables();
  
  if (tables.length === 0) {
    console.log(chalk.yellow('⚠️ No tables found or database connection failed'));
    return '';
  }

  const { selectedTable } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedTable',
      message: 'Select a table to view:',
      choices: tables.map(table => ({
        name: table,
        value: table
      }))
    }
  ]);

  return selectedTable;
}

// Function to get query input
async function getQueryInput(): Promise<string> {
  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: 'Enter your database query:',
      validate: (input: string) => {
        if (input.trim().length === 0) {
          return 'Please enter a query';
        }
        return true;
      }
    }
  ]);

  return query;
}

// Function to get table view limit
async function getTableLimit(): Promise<number> {
  const { limit } = await inquirer.prompt([
    {
      type: 'number',
      name: 'limit',
      message: 'How many rows to display?',
      default: 10,
      validate: (input: any) => {
        const num = Number(input);
        if (isNaN(num) || num < 1 || num > 100) {
          return 'Please enter a number between 1 and 100';
        }
        return true;
      }
    }
  ]);

  return Number(limit);
}

// Function to run interactive mode
async function runInteractiveMode() {
  displayLogo();
  
  while (true) {
    try {
      const action = await createInteractiveMenu();
      
      switch (action) {
        case 'tables':
          console.log(chalk.blue('Available Database Tables:'));
          console.log(chalk.dim('─'.repeat(50)));
          
          const tables = await getAllTables();
          
          if (tables.length === 0) {
            console.log(chalk.yellow('No tables found or database connection failed'));
          } else {
            tables.forEach((table, index) => {
              console.log(chalk.green(`${index + 1}. ${table}`));
            });
            
            console.log(chalk.dim('─'.repeat(50)));
            console.log(chalk.blue(`Total tables: ${tables.length}`));
          }
          break;
          
        case 'view':
          const selectedTable = await selectTable();
          if (selectedTable) {
            const limit = await getTableLimit();
            await viewTable(selectedTable, limit);
          }
          break;
          
        case 'query':
          const query = await getQueryInput();
          console.log(chalk.blue('Database Agent: Processing your query...'));
          console.log(chalk.dim(`Query: ${query}`));
          
          await processQuery(query, openai);
          console.log(chalk.green('Query processing completed!'));
          break;
          
        case 'reset':
          await resetDatabase();
          break;
          
        case 'help':
          console.log(chalk.blue('Database Agent - Help'));
          console.log(chalk.dim('─'.repeat(50)));
          
          showAvailableCommands();
          
          console.log(chalk.blue('Common Use Cases:'));
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
          break;
          
        case 'exit':
          console.log(chalk.blue('Goodbye!'));
          process.exit(0);
          break;
      }
      
      console.log('');
      console.log(chalk.dim('Press Enter to continue...'));
      await new Promise(resolve => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question('', () => {
          rl.close();
          resolve(undefined);
        });
      });
      
      displayLogo();
      
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      console.log(chalk.dim('Press Enter to continue...'));
      await new Promise(resolve => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question('', () => {
          rl.close();
          resolve(undefined);
        });
      });
      displayLogo();
    }
  }
}

async function resetDatabase() {
  console.log(chalk.red('⚠️  RESET DATABASE OPERATION'));
  console.log(chalk.yellow('This will:'));
  console.log(chalk.yellow('  • Drop all tables in the database'));
  console.log(chalk.yellow('  • Clear all data'));
  console.log(chalk.yellow('  • Restore UI to original static form'));
  console.log(chalk.yellow('  • This action cannot be undone!'));
  console.log('');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to reset the database?',
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.green('Reset cancelled.'));
    return;
  }

  const { confirmFinal } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmFinal',
      message: 'Final confirmation: This will delete ALL data. Continue?',
      default: false
    }
  ]);

  if (!confirmFinal) {
    console.log(chalk.green('Reset cancelled.'));
    return;
  }

  try {
    console.log(chalk.blue('🔄 Resetting database...'));
    
    // Get list of all tables
    const { stdout: tablesOutput } = await execAsync('psql -d spotify_clone -c "\\dt"');
    const tables: string[] = [];
    const lines = tablesOutput.split('\n');
    for (const line of lines) {
      const match = line.match(/\|\s+(\w+)\s+\|/);
      if (match && match[1] && !match[1].includes('_seq')) {
        tables.push(match[1]);
      }
    }

    // Drop all tables
    for (const table of tables) {
      console.log(chalk.yellow(`Dropping table: ${table}`));
      await execAsync(`psql -d spotify_clone -c "DROP TABLE IF EXISTS ${table} CASCADE;"`);
    }

    console.log(chalk.green('✅ Database reset complete!'));
    console.log(chalk.blue('📝 All tables have been dropped.'));
    console.log(chalk.blue('🔄 The UI will now show original static content.'));
    console.log(chalk.blue('💡 Use the agent to create new tables and add data.'));
    
  } catch (error) {
    console.error(chalk.red('❌ Error resetting database:'), error);
  }
}

async function interactiveMode() {
  console.clear();
  
  // Display logo
  const logo = figlet.textSync('DB-AGENT', { font: 'Big' });
  const gradientLogo = gradient.rainbow(logo);
  console.log(gradientLogo);
  console.log(chalk.dim('(by orchids)'));
  console.log('');
  console.log(chalk.blue('Database Agent'));
  console.log(chalk.dim('AI-powered database operations for Spotify clone'));
  console.log('─'.repeat(64));
  console.log(chalk.dim('Keyboard shortcuts:'));
  console.log(chalk.dim('  Arrow keys: Navigate options'));
  console.log(chalk.dim('  Type: Search options'));
  console.log(chalk.dim('  Enter: Select option'));
  console.log(chalk.dim('  Ctrl+C: Exit anytime'));
  console.log('─'.repeat(64));
  console.log('');

  while (true) {
    try {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Process AI query', value: 'query' },
            { name: 'View tables', value: 'view-tables' },
            { name: 'View table data', value: 'view-data' },
            { name: 'Reset database (wipe all data)', value: 'reset' },
            { name: 'Exit', value: 'exit' }
          ]
        }
      ]);

      if (action === 'exit') {
        console.log(chalk.green('👋 Goodbye!'));
        process.exit(0);
      }

      if (action === 'reset') {
        await resetDatabase();
        console.log('');
        continue;
      }

      if (action === 'query') {
        const { query } = await inquirer.prompt([
          {
            type: 'input',
            name: 'query',
            message: 'Enter your database query:'
          }
        ]);

        console.log(chalk.blue('Database Agent: Processing your query...'));
        console.log(chalk.dim('Query:', query));
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        await processQuery(query, openai);
        console.log('');
      }

      if (action === 'view-tables') {
        try {
          const { stdout } = await execAsync('psql -d spotify_clone -c "\\dt"');
          console.log(chalk.blue('📊 Available tables:'));
          console.log(stdout);
        } catch (error) {
          console.error(chalk.red('❌ Error viewing tables:'), error);
        }
        console.log('');
      }

      if (action === 'view-data') {
        try {
          const { stdout: tablesOutput } = await execAsync('psql -d spotify_clone -c "\\dt"');
          const tables: string[] = [];
          const lines = tablesOutput.split('\n');
          for (const line of lines) {
            const match = line.match(/\|\s+(\w+)\s+\|/);
            if (match && match[1] && !match[1].includes('_seq')) {
              tables.push(match[1]);
            }
          }

          if (tables.length === 0) {
            console.log(chalk.yellow('No tables found in database.'));
            console.log('');
            continue;
          }

          const { table } = await inquirer.prompt([
            {
              type: 'list',
              name: 'table',
              message: 'Select a table to view:',
              choices: tables
            }
          ]);

          const { rows } = await inquirer.prompt([
            {
              type: 'number',
              name: 'rows',
              message: 'How many rows to display?',
              default: 5
            }
          ]);

          const { stdout } = await execAsync(`psql -d spotify_clone -c "SELECT * FROM ${table} LIMIT ${rows};"`);
          console.log(chalk.blue(`Viewing table: ${table}`));
          console.log('─'.repeat(34));
          console.log(stdout);
          console.log(`Displayed up to ${rows} rows from ${table}`);
          
          await inquirer.prompt([
            {
              type: 'input',
              name: 'continue',
              message: 'Press Enter to continue...'
            }
          ]);
        } catch (error) {
          console.error(chalk.red('❌ Error viewing table data:'), error);
        }
        console.log('');
      }

    } catch (error) {
      if (error && typeof error === 'object' && 'isTtyError' in error) {
        console.log(chalk.red('❌ Interactive mode not supported in this environment.'));
        process.exit(1);
      } else {
        console.error(chalk.red('❌ Error:'), error);
      }
    }
  }
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
    await interactiveMode();
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