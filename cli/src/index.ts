#!/usr/bin/env node
import { Command } from 'commander';
import { OpenAI } from 'openai';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { processQuery } from './agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: join(__dirname, '../..', '.env') });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create CLI program
const program = new Command();

program
  .name('db-agent')
  .description('AI-powered database agent for Spotify clone')
  .version('1.0.0');

program
  .command('query')
  .description('Process a database-related query')
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
      process.exit(1);
    }
  });

program.parse(); 