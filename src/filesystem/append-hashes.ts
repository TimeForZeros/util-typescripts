import path from 'path';
import { Command } from 'commander';
import { appendHash, moveFile, getDirContentPaths } from './lib/index.js';

const program = new Command();

program
  .command('dir <dir>')
  .option('--dry-run', 'dry run')
  .action(async (dir: string, { dryRun = false }: { dryRun: boolean }) => {
    console.log(dir);
    const { files } = await getDirContentPaths(dir);
    if (!files.length) {
      console.log('no files to consider');
      process.exit(0);
    }
    const movePromises = files.map(async (filePath: string) => {
      if (filePath.includes('_hash-')) {
        console.log(`seems like ${path.basename(filePath)} already has a hash`);
        return;
      }
      const hashedPath = await appendHash(filePath);
      console.log(`renaming ${path.basename(filePath)} to ${hashedPath}`);
      if (dryRun) return;
      return moveFile(filePath, hashedPath);
    });
    await Promise.allSettled(movePromises);
    console.log('done');
  })
  .parse();
