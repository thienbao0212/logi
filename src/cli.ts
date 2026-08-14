#!/usr/bin/env node
import { spawn } from 'child_process';

const command = process.argv[2];

function runCommand(cmd: string, args: string[]) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: true });
  child.on('error', (err) => {
    console.error(`Failed to start subprocess: ${err.message}`);
  });
  return child;
}

switch (command) {
  case 'dev':
    console.log('Starting LogiFlow Dev Server...');
    runCommand('npx', ['vite']);
    runCommand('npx', ['tsx', 'watch', 'src/server.ts']);
    break;
  case 'db:migrate':
    console.log('Running database migrations...');
    runCommand('npx', ['drizzle-kit', 'push']);
    break;
  case 'db:seed':
    console.log('Seeding database...');
    runCommand('npx', ['tsx', 'src/db/seeds/index.ts']);
    break;
  case 'db:fixtures':
    console.log('Loading fixtures...');
    // runCommand('npx', ['tsx', 'src/db/fixtures/index.ts']);
    break;
  case 'lint':
    runCommand('npx', ['eslint', '.']);
    break;
  case 'typecheck':
    runCommand('npx', ['tsc', '--noEmit']);
    break;
  case 'build':
    runCommand('npx', ['vite', 'build']);
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log('Available commands: dev, db:migrate, db:seed, db:fixtures, lint, typecheck, build');
    break;
}
