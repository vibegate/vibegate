import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

export async function initCommand() {
  console.log(chalk.blue.bold('\n🚀 VibeGate Project Initialization\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'vibegate-app'
    },
    {
      type: 'list',
      name: 'database',
      message: 'Choose database:',
      choices: [
        { name: 'SQLite (Development)', value: 'sqlite' },
        { name: 'PostgreSQL (Production)', value: 'postgres' }
      ]
    },
    {
      type: 'input',
      name: 'port',
      message: 'Gateway port:',
      default: '3000',
      validate: (input) => {
        const port = parseInt(input);
        return port > 0 && port < 65536 ? true : 'Please enter a valid port number';
      }
    },
    {
      type: 'password',
      name: 'jwtSecret',
      message: 'JWT Secret (leave empty to generate):',
      mask: '*'
    },
    {
      type: 'confirm',
      name: 'includeWebUI',
      message: 'Include admin web UI?',
      default: true
    }
  ]);

  const spinner = ora('Creating project configuration...').start();

  try {
    const jwtSecret = answers.jwtSecret || generateSecret();

    let envContent = `# VibeGate Configuration
NODE_ENV=development
PORT=${answers.port}
JWT_SECRET=${jwtSecret}
`;

    if (answers.database === 'postgres') {
      const dbAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'dbHost',
          message: 'PostgreSQL host:',
          default: 'localhost'
        },
        {
          type: 'input',
          name: 'dbPort',
          message: 'PostgreSQL port:',
          default: '5432'
        },
        {
          type: 'input',
          name: 'dbName',
          message: 'Database name:',
          default: 'vibegate'
        },
        {
          type: 'input',
          name: 'dbUser',
          message: 'Database user:',
          default: 'postgres'
        },
        {
          type: 'password',
          name: 'dbPassword',
          message: 'Database password:',
          mask: '*'
        }
      ]);

      envContent += `
# Database Configuration
DATABASE_URL=postgresql://${dbAnswers.dbUser}:${dbAnswers.dbPassword}@${dbAnswers.dbHost}:${dbAnswers.dbPort}/${dbAnswers.dbName}
`;
    } else {
      envContent += `
# Database Configuration (SQLite)
# DATABASE_URL is not set - will use SQLite by default
`;
    }

    await fs.writeFile('.env', envContent);
    spinner.succeed('Created .env file');

    const packageJson = {
      name: answers.projectName,
      scripts: {
        dev: answers.includeWebUI ? 'pnpm dev' : 'pnpm dev --filter gateway',
        build: 'pnpm build',
        start: 'pnpm start --filter gateway',
        lint: 'pnpm lint',
        'check-types': 'pnpm check-types'
      }
    };

    await fs.writeFile('vibegate.json', JSON.stringify({
      version: '0.1.0',
      port: parseInt(answers.port),
      database: answers.database,
      includeWebUI: answers.includeWebUI,
      createdAt: new Date().toISOString()
    }, null, 2));

    spinner.succeed('Created vibegate.json configuration');

    console.log(chalk.green.bold('\n✅ VibeGate project initialized successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white('  1. Install dependencies: ') + chalk.yellow('pnpm install'));
    console.log(chalk.white('  2. Start development: ') + chalk.yellow('pnpm dev'));
    console.log(chalk.white('  3. Configure routes: ') + chalk.yellow('vibegate route --add'));

  } catch (error) {
    spinner.fail('Failed to initialize project');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}