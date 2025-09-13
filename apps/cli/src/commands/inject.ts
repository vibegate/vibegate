import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';

const INJECT_TEMPLATES = {
  testing: {
    name: 'Testing Guidelines',
    content: `
## Testing Guidelines

### Unit Tests
- All new functions should have corresponding unit tests
- Use Jest for testing Node.js code
- Use Vitest for testing Vite-based frontend code
- Aim for at least 80% code coverage

### Integration Tests
- Test API endpoints with supertest
- Mock external dependencies where appropriate
- Test database operations with test database

### Test Commands
\`\`\`bash
pnpm test              # Run all tests
pnpm test:unit         # Run unit tests only
pnpm test:integration  # Run integration tests
pnpm test:coverage     # Generate coverage report
\`\`\`
`
  },
  docker: {
    name: 'Docker Configuration',
    content: `
## Docker Configuration

### Building Images
\`\`\`bash
docker build -t vibegate-gateway ./apps/gateway
docker build -t vibegate-web ./apps/web
\`\`\`

### Docker Compose
\`\`\`bash
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
\`\`\`

### Environment Variables for Docker
- \`DOCKER_GATEWAY_PORT\`: Gateway port mapping (default: 3000)
- \`DOCKER_WEB_PORT\`: Web UI port mapping (default: 5173)
- \`DOCKER_DB_PORT\`: Database port mapping (default: 5432)
`
  },
  deployment: {
    name: 'Deployment Instructions',
    content: `
## Deployment Instructions

### Production Build
\`\`\`bash
NODE_ENV=production pnpm build
\`\`\`

### Environment Setup
1. Set \`NODE_ENV=production\`
2. Configure \`DATABASE_URL\` for PostgreSQL
3. Set secure \`JWT_SECRET\`
4. Configure SSL certificates if needed

### Process Management
Recommended to use PM2 for process management:
\`\`\`bash
pm2 start apps/gateway/dist/server.js --name vibegate
pm2 save
pm2 startup
\`\`\`

### Health Checks
- Health endpoint: \`/vibegate/api/health\`
- Monitor logs: \`pm2 logs vibegate\`
`
  },
  api: {
    name: 'API Documentation',
    content: `
## API Documentation

### Authentication Endpoints
- \`POST /vibegate/api/auth/register\` - Register new user
- \`POST /vibegate/api/auth/login\` - User login
- \`POST /vibegate/api/auth/logout\` - User logout
- \`GET /vibegate/api/auth/me\` - Get current user

### Admin Endpoints
- \`GET /vibegate/api/admin/users\` - List all users (admin only)
- \`PATCH /vibegate/api/admin/users/:id\` - Update user (admin only)
- \`DELETE /vibegate/api/admin/users/:id\` - Delete user (admin only)
- \`GET /vibegate/api/admin/routes\` - List proxy routes
- \`POST /vibegate/api/admin/routes\` - Create proxy route
- \`PUT /vibegate/api/admin/routes/:id\` - Update proxy route
- \`DELETE /vibegate/api/admin/routes/:id\` - Delete proxy route

### Request Headers
- \`Authorization: Bearer <token>\` - JWT authentication
- \`Content-Type: application/json\` - For POST/PUT requests
`
  },
  security: {
    name: 'Security Best Practices',
    content: `
## Security Best Practices

### Authentication & Authorization
- JWT tokens are stored in HTTP-only cookies
- Implement rate limiting on authentication endpoints
- Use strong JWT secret (minimum 32 characters)
- Implement token refresh mechanism for long sessions

### Database Security
- Use parameterized queries to prevent SQL injection
- Encrypt sensitive data at rest
- Regular database backups
- Use least privilege principle for database users

### API Security
- Implement CORS properly
- Use HTTPS in production
- Validate and sanitize all inputs
- Implement request size limits
- Add security headers (CSP, X-Frame-Options, etc.)

### Monitoring
- Log all authentication attempts
- Monitor for unusual activity patterns
- Set up alerts for failed login attempts
- Regular security audits
`
  },
  plugins: {
    name: 'Plugin Development',
    content: `
## Plugin Development

### Creating a Plugin
Plugins should export a default function that receives the gateway instance:

\`\`\`typescript
import { PluginContext } from '@vibegate/plugin-sdk';

export default function myPlugin(context: PluginContext) {
  // Register hooks
  context.hooks.on('request', async (req, res, next) => {
    // Handle request
    next();
  });

  context.hooks.on('response', async (req, res) => {
    // Modify response
  });

  // Register routes
  context.registerRoute('/my-plugin', (req, res) => {
    res.json({ message: 'Hello from plugin' });
  });
}
\`\`\`

### Plugin Configuration
Place plugins in \`apps/gateway/src/plugins/\` directory.
Plugins are loaded automatically on gateway startup.

### Available Hooks
- \`request\` - Before request is processed
- \`response\` - After response is prepared
- \`auth\` - During authentication
- \`proxy\` - Before proxying request
`
  },
  performance: {
    name: 'Performance Optimization',
    content: `
## Performance Optimization

### Gateway Performance
- Enable HTTP/2 for better multiplexing
- Implement response caching where appropriate
- Use connection pooling for database
- Enable gzip compression

### Database Optimization
- Add indexes for frequently queried columns
- Use connection pooling (max connections: 20)
- Implement query result caching
- Regular VACUUM for PostgreSQL

### Frontend Optimization
- Enable code splitting
- Lazy load routes and components
- Optimize bundle size with tree shaking
- Use CDN for static assets

### Monitoring
- Track response times with metrics
- Monitor memory usage
- Set up performance budgets
- Use APM tools (e.g., New Relic, DataDog)
`
  },
  troubleshooting: {
    name: 'Troubleshooting Guide',
    content: `
## Troubleshooting Guide

### Common Issues

#### Port Already in Use
\`\`\`bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
\`\`\`

#### Database Connection Failed
- Check DATABASE_URL format
- Verify database is running
- Check network connectivity
- Verify credentials

#### Authentication Issues
- Check JWT_SECRET is set
- Verify cookie settings
- Check CORS configuration
- Clear browser cookies

#### Build Failures
\`\`\`bash
# Clean and rebuild
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
\`\`\`

### Debug Mode
Enable debug logging:
\`\`\`bash
DEBUG=vibegate:* pnpm dev
\`\`\`

### Logs Location
- Development: Console output
- Production: \`logs/vibegate.log\`
`
  }
};

export async function injectCommand(options: any) {
  const claudeMdPath = path.resolve(process.cwd(), 'CLAUDE.md');

  try {
    // Check if CLAUDE.md exists
    await fs.access(claudeMdPath);
  } catch {
    console.log(chalk.yellow('CLAUDE.md not found. Creating it...'));
    await fs.writeFile(claudeMdPath, '# CLAUDE.md\n\nThis file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.\n');
  }

  if (options.list) {
    console.log(chalk.blue.bold('\n📚 Available Templates\n'));
    Object.entries(INJECT_TEMPLATES).forEach(([key, template]) => {
      console.log(chalk.cyan(`  ${key}`) + chalk.gray(' - ') + chalk.white(template.name));
    });
    console.log('\n' + chalk.gray('Use: vibegate inject --template <name>'));
    return;
  }

  let templateKey = options.template;

  if (!templateKey) {
    const choices = Object.entries(INJECT_TEMPLATES).map(([key, template]) => ({
      name: `${template.name}`,
      value: key
    }));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Choose content to inject:',
        choices: [
          ...choices,
          new inquirer.Separator(),
          { name: 'All templates', value: 'all' },
          { name: 'Custom content', value: 'custom' }
        ]
      }
    ]);
    templateKey = answer.template;
  }

  const spinner = ora('Injecting content into CLAUDE.md...').start();

  try {
    let currentContent = await fs.readFile(claudeMdPath, 'utf-8');
    let contentToAdd = '';

    if (templateKey === 'all') {
      // Add all templates
      for (const template of Object.values(INJECT_TEMPLATES)) {
        if (!currentContent.includes(template.name)) {
          contentToAdd += template.content + '\n';
        }
      }
      if (!contentToAdd) {
        spinner.warn('All templates already exist in CLAUDE.md');
        return;
      }
    } else if (templateKey === 'custom') {
      spinner.stop();

      const { customContent } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'customContent',
          message: 'Enter custom content to inject:'
        }
      ]);

      contentToAdd = '\n## Custom Section\n' + customContent + '\n';
      spinner.start('Injecting custom content...');
    } else {
      const template = INJECT_TEMPLATES[templateKey as keyof typeof INJECT_TEMPLATES];

      if (!template) {
        spinner.fail(`Template '${templateKey}' not found`);
        console.log(chalk.red('Available templates:'), Object.keys(INJECT_TEMPLATES).join(', '));
        return;
      }

      // Check if content already exists
      if (currentContent.includes(template.name)) {
        spinner.warn(`Template '${template.name}' already exists in CLAUDE.md`);

        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: 'Do you want to replace it?',
            default: false
          }
        ]);

        if (!overwrite) {
          spinner.info('Injection cancelled');
          return;
        }

        // Replace existing section
        const sectionRegex = new RegExp(`## ${template.name}[\\s\\S]*?(?=\\n## |$)`, 'g');
        currentContent = currentContent.replace(sectionRegex, '');
      }

      contentToAdd = template.content;
    }

    // Append content
    await fs.writeFile(claudeMdPath, currentContent + '\n' + contentToAdd);
    spinner.succeed('Content injected successfully into CLAUDE.md');

    // Show summary
    const lines = contentToAdd.split('\n').length;
    console.log(chalk.green(`✅ Added ${lines} lines to CLAUDE.md`));

    if (options.open) {
      console.log(chalk.cyan('Opening CLAUDE.md in default editor...'));
      const { exec } = await import('child_process');
      exec(`open ${claudeMdPath}`);
    }

  } catch (error) {
    spinner.fail('Failed to inject content');
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}