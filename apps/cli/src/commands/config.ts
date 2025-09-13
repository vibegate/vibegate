import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

export async function configCommand(options: any) {
  if (options.show) {
    await showConfig(options.env);
  } else {
    await updateConfig(options.env);
  }
}

async function showConfig(envFile: string) {
  try {
    const envPath = path.resolve(process.cwd(), envFile);
    const envContent = await fs.readFile(envPath, 'utf-8');
    const config = dotenv.parse(envContent);

    console.log(chalk.blue.bold('\n📋 Current Configuration\n'));
    console.log(chalk.gray('Environment file: ') + chalk.white(envPath));
    console.log(chalk.gray('-'.repeat(50)));

    for (const [key, value] of Object.entries(config)) {
      if (key.includes('SECRET') || key.includes('PASSWORD')) {
        console.log(chalk.cyan(key + ':'), chalk.gray('*'.repeat(8)));
      } else {
        console.log(chalk.cyan(key + ':'), chalk.white(value));
      }
    }

    if (await fs.access('vibegate.json').then(() => true).catch(() => false)) {
      const vgConfig = JSON.parse(await fs.readFile('vibegate.json', 'utf-8'));
      console.log(chalk.gray('\n' + '-'.repeat(50)));
      console.log(chalk.blue.bold('VibeGate Configuration:'));
      console.log(chalk.cyan('Version:'), chalk.white(vgConfig.version));
      console.log(chalk.cyan('Database:'), chalk.white(vgConfig.database));
      console.log(chalk.cyan('Web UI:'), chalk.white(vgConfig.includeWebUI ? 'Enabled' : 'Disabled'));
    }
  } catch (error) {
    console.error(chalk.red('Error reading configuration:'), error);
    process.exit(1);
  }
}

async function updateConfig(envFile: string) {
  const envPath = path.resolve(process.cwd(), envFile);

  let currentConfig: any = {};
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    currentConfig = dotenv.parse(envContent);
  } catch (error) {
    console.log(chalk.yellow('No existing .env file found. Creating new one...'));
  }

  const choices = [
    { name: 'Port', value: 'PORT' },
    { name: 'JWT Secret', value: 'JWT_SECRET' },
    { name: 'Node Environment', value: 'NODE_ENV' },
    { name: 'Database URL', value: 'DATABASE_URL' },
    { name: 'Add custom variable', value: 'CUSTOM' },
    { name: 'Done', value: 'DONE' }
  ];

  let done = false;
  while (!done) {
    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'What would you like to configure?',
        choices
      }
    ]);

    if (option === 'DONE') {
      done = true;
      break;
    }

    if (option === 'CUSTOM') {
      const { key, value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'key',
          message: 'Variable name:',
          validate: (input) => input.length > 0 ? true : 'Variable name is required'
        },
        {
          type: 'input',
          name: 'value',
          message: 'Variable value:',
          validate: (input) => input.length > 0 ? true : 'Variable value is required'
        }
      ]);
      currentConfig[key] = value;
    } else {
      const currentValue = currentConfig[option] || '';
      const isSecret = option.includes('SECRET') || option.includes('PASSWORD');

      const { value } = await inquirer.prompt([
        {
          type: isSecret ? 'password' : 'input',
          name: 'value',
          message: `${option} (current: ${isSecret && currentValue ? '********' : currentValue || 'not set'}):`,
          default: isSecret ? undefined : currentValue,
          mask: isSecret ? '*' : undefined
        }
      ]);

      if (value) {
        currentConfig[option] = value;
      }
    }
  }

  const envContent = Object.entries(currentConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(envPath, envContent);
  console.log(chalk.green(`\n✅ Configuration saved to ${envPath}`));
}