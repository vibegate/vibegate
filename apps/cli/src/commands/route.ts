import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

export async function routeCommand(options: any) {
  if (options.list) {
    await listRoutes();
  } else if (options.add) {
    await addRoute();
  } else if (options.delete) {
    await deleteRoute(options.delete);
  } else if (options.update) {
    await updateRoute(options.update);
  } else {
    console.log(chalk.yellow('Please specify an action: --list, --add, --delete <id>, or --update <id>'));
  }
}

async function listRoutes() {
  const spinner = ora('Fetching routes...').start();

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/vibegate/api/admin/routes`);

    if (!response.ok) {
      throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }

    const routes = await response.json();
    spinner.stop();

    if (routes.length === 0) {
      console.log(chalk.yellow('\nNo routes configured yet.'));
      return;
    }

    console.log(chalk.blue.bold('\n📍 Proxy Routes\n'));
    console.log(chalk.gray('-'.repeat(80)));

    routes.forEach((route: any) => {
      console.log(chalk.cyan(`ID: ${route.id}`));
      console.log(`  Path: ${chalk.white(route.path)}`);
      console.log(`  Target: ${chalk.green(route.target)}`);
      console.log(`  Auth Required: ${route.requireAuth ? chalk.red('Yes') : chalk.gray('No')}`);
      console.log(`  Priority: ${chalk.yellow(route.priority)}`);
      console.log(chalk.gray('-'.repeat(80)));
    });
  } catch (error) {
    spinner.fail('Failed to fetch routes');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function addRoute() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Route path (e.g., /api/users):',
      validate: (input) => input.startsWith('/') ? true : 'Path must start with /'
    },
    {
      type: 'input',
      name: 'target',
      message: 'Target URL (e.g., http://localhost:4000):',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'confirm',
      name: 'requireAuth',
      message: 'Require authentication?',
      default: false
    },
    {
      type: 'number',
      name: 'priority',
      message: 'Priority (lower number = higher priority):',
      default: 10
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
    }
  ]);

  const spinner = ora('Adding route...').start();

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/vibegate/api/admin/routes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(answers)
    });

    if (!response.ok) {
      throw new Error(`Failed to add route: ${response.statusText}`);
    }

    const route = await response.json();
    spinner.succeed('Route added successfully');
    console.log(chalk.green(`\n✅ Route created with ID: ${route.id}`));
  } catch (error) {
    spinner.fail('Failed to add route');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function deleteRoute(id: string) {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete route ${id}?`,
      default: false
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('Deletion cancelled'));
    return;
  }

  const spinner = ora('Deleting route...').start();

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/vibegate/api/admin/routes/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete route: ${response.statusText}`);
    }

    spinner.succeed('Route deleted successfully');
  } catch (error) {
    spinner.fail('Failed to delete route');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function updateRoute(id: string) {
  const spinner = ora('Fetching route details...').start();

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/vibegate/api/admin/routes/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch route: ${response.statusText}`);
    }

    const currentRoute = await response.json();
    spinner.stop();

    console.log(chalk.blue(`\nUpdating route ${id}`));
    console.log(chalk.gray('Press enter to keep current value'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: `Route path (${currentRoute.path}):`,
        default: currentRoute.path
      },
      {
        type: 'input',
        name: 'target',
        message: `Target URL (${currentRoute.target}):`,
        default: currentRoute.target
      },
      {
        type: 'confirm',
        name: 'requireAuth',
        message: `Require authentication (${currentRoute.requireAuth ? 'Yes' : 'No'}):`,
        default: currentRoute.requireAuth
      },
      {
        type: 'number',
        name: 'priority',
        message: `Priority (${currentRoute.priority}):`,
        default: currentRoute.priority
      }
    ]);

    const updateSpinner = ora('Updating route...').start();

    const updateResponse = await fetch(`${apiUrl}/vibegate/api/admin/routes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(answers)
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update route: ${updateResponse.statusText}`);
    }

    updateSpinner.succeed('Route updated successfully');
  } catch (error) {
    spinner.fail('Failed to update route');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
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