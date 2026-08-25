#!/usr/bin/env node
import { spawn } from 'child_process';

const command = process.argv[2];

function runCommand(cmd: string, args: string[], stdio: any = 'inherit') {
  const child = spawn(cmd, args, { stdio });
  child.on('error', (err) => {
    console.error(`Failed to start subprocess: ${err.message}`);
  });
  return child;
}

switch (command) {
  case 'dev':
    console.log('Starting LogiFlow Dev Server...');
    runCommand(process.execPath, ['./node_modules/vite/bin/vite.js'], ['ignore', 'inherit', 'inherit']);
    runCommand(process.execPath, ['./node_modules/tsx/dist/cli.mjs', 'watch', 'src/server.ts'], ['ignore', 'inherit', 'inherit']);
    break;
  case 'db:migrate':
    console.log('Running database migrations...');
    runCommand(process.execPath, ['./node_modules/drizzle-kit/bin.cjs', 'push', '--force']);
    break;
  case 'db:seed':
    console.log('Seeding database...');
    runCommand(process.execPath, ['./node_modules/tsx/dist/cli.mjs', 'src/db/seeds/index.ts']);
    break;
  case 'db:fixtures':
    console.log('Loading fixtures...');
    // runCommand(process.execPath, ['./node_modules/tsx/dist/cli.mjs', 'src/db/fixtures/index.ts']);
    break;
  case 'lint':
    runCommand(process.execPath, ['./node_modules/eslint/bin/eslint.js', '.']);
    break;
  case 'typecheck':
    runCommand(process.execPath, ['./node_modules/typescript/bin/tsc', '--noEmit']);
    break;
  case 'build':
    runCommand(process.execPath, ['./node_modules/vite/bin/vite.js', 'build']);
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log('Available commands: dev, db:migrate, db:seed, db:fixtures, lint, typecheck, build');
    break;
}
