import { flattenDir } from './lib/index.js';
import { Command } from 'commander';

const program = new Command();

program
  .command('flatten <dir>')
  .option('-c, --cleanup', 'remove empty directories')
  .action(async (dir: string, options: { cleanup: boolean }) => {
    await flattenDir(dir, options.cleanup);
  })
  .parse();
