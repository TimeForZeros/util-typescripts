import { findRedundantNest } from './lib/index.js';
import { Command } from 'commander';

const program = new Command();

program
  .command('dir <dir>')
  .action(async (dir: string) => {
    await findRedundantNest(dir, true);
  })
  .parse();
