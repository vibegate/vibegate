#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { configCommand } from './commands/config.js';
import { initCommand } from './commands/init.js';
import { routeCommand } from './commands/route.js';
import { userCommand } from './commands/user.js';
import { injectCommand } from './commands/inject.js';

const program = new Command();

program
  .name('vibegate')
  .description('VibeGate CLI - Manage your API gateway configuration')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new VibeGate project')
  .action(initCommand);

program
  .command('config')
  .description('Configure VibeGate settings')
  .option('-s, --show', 'Show current configuration')
  .option('-e, --env <file>', 'Path to .env file', '.env')
  .action(configCommand);

program
  .command('route')
  .description('Manage proxy routes')
  .option('-l, --list', 'List all routes')
  .option('-a, --add', 'Add a new route')
  .option('-d, --delete <id>', 'Delete a route by ID')
  .option('-u, --update <id>', 'Update a route by ID')
  .action(routeCommand);

program
  .command('user')
  .description('Manage users')
  .option('-l, --list', 'List all users')
  .option('-a, --add', 'Add a new user')
  .option('-d, --delete <id>', 'Delete a user by ID')
  .option('--make-admin <id>', 'Make user an admin')
  .action(userCommand);

program
  .command('inject')
  .description('Inject predefined content into CLAUDE.md')
  .option('-l, --list', 'List available templates')
  .option('-t, --template <name>', 'Specify template to inject')
  .option('-o, --open', 'Open CLAUDE.md after injection')
  .action(injectCommand);

program.parse();