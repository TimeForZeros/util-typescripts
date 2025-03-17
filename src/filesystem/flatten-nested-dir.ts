import { findDuplicateNestedDir } from './lib/index.js';
import { Command } from 'commander';

const program = new Command();

program
  .command('dir <dir>')
  .action(async (dir: string) => {
    await findDuplicateNestedDir(dir, true);
  })
  .parse();
