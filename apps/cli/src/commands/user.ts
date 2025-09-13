import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import crypto from 'crypto';

export async function userCommand(options: any) {
  if (options.list) {
    await listUsers();
  } else if (options.add) {
    await addUser();
  } else if (options.delete) {
    await deleteUser(options.delete);
  } else if (options.makeAdmin) {
    await makeAdmin(options.makeAdmin);
  } else {
    console.log(chalk.yellow('Please specify an action: --list, --add, --delete <id>, or --make-admin <id>'));
  }
}

async function listUsers() {
  const spinner = ora('Fetching users...').start();

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/vibegate/api/admin/users`);

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const users = await response.json();
    spinner.stop();

    if (users.length === 0) {
      console.log(chalk.yellow('\nNo users registered yet.'));
      return;
    }

    console.log(chalk.blue.bold('\n👥 Users\n'));
    console.log(chalk.gray('-'.repeat(80)));

    users.forEach((user: any) => {
      console.log(chalk.cyan(`ID: ${user.id}`));
      console.log(`  Email: ${chalk.white(user.email)}`);
      console.log(`  Name: ${chalk.white(user.name || 'Not set')}`);
      console.log(`  Admin: ${user.isAdmin ? chalk.green('Yes') : chalk.gray('No')}`);
      console.log(`  Created: ${chalk.gray(new Date(user.createdAt).toLocaleString())}`);
      console.log(chalk.gray('-'.repeat(80)));
    });
  } catch (error) {
    spinner.fail('Failed to fetch users');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function addUser() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email address:',
      validate: (input) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(input) ? true : 'Please enter a valid email address';
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password:',
      mask: '*',
      validate: (input) => input.length >= 6 ? true : 'Password must be at least 6 characters'
    },
    {
      type: 'input',
      name: 'name',
      message: 'Full name (optional):'
    },
    {
      type: 'confirm',
      name: 'isAdmin',
      message: 'Grant admin privileges?',
      default: false
    }
  ]);

  const spinner = ora('Creating user...').start();

  try {
    const apiUrl = await getApiUrl();
    const passwordHash = hashPassword(answers.password);

    const response = await fetch(`${apiUrl}/vibegate/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: answers.email,
        password: answers.password,
        name: answers.name || undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create user: ${response.statusText}`);
    }

    const result = await response.json();
    spinner.succeed('User created successfully');

    if (answers.isAdmin) {
      await makeAdmin(result.user.id, true);
    }

    console.log(chalk.green(`\n✅ User created with ID: ${result.user.id}`));
  } catch (error) {
    spinner.fail('Failed to create user');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function deleteUser(id: string) {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete user ${id}?`,
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Deletion cancelled'));
    return;
  }

  const spinner = ora('Deleting user...').start();

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/vibegate/api/admin/users/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }

    spinner.succeed('User deleted successfully');
  } catch (error) {
    spinner.fail('Failed to delete user');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function makeAdmin(id: string, silent = false) {
  const spinner = ora('Updating user privileges...').start();

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/vibegate/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isAdmin: true })
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }

    spinner.succeed('User privileges updated');
    if (!silent) {
      console.log(chalk.green(`\n✅ User ${id} is now an admin`));
    }
  } catch (error) {
    spinner.fail('Failed to update user');
    console.error(chalk.red('Error:'), error);
    if (!silent) {
      process.exit(1);
    }
  }
}

async function getApiUrl(): Promise<string> {
  const envPath = '.env';
  try {
    const { default: dotenv } = await import('dotenv');
    const fs = await import('fs/promises');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const config = dotenv.parse(envContent);
    const port = config.PORT || '3000';
    return `http://localhost:${port}`;
  } catch {
    return 'http://localhost:3000';
  }
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}