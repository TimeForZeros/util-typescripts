import path from 'path';
import { Command } from 'commander';
import { appendHash, moveFile, getDirContentPaths } from './lib/index.js';

const program = new Command();

program
  .command('dir <dir>')
  .option('--dry-run', 'dry run')
  .action(async (dir: string, { dryRun = false }: { dryRun: boolean }) => {
    console.log(`appending hashes to the contents of ${dir}`);
    const { files } = await getDirContentPaths(dir);
    if (!files.length) {
      console.log('no files to consider');
      process.exit(0);
    }
    let fileCount = files.length;
    for (const filePath of files) {
      if (filePath.includes('_hash-')) {
        console.log(`seems like ${path.basename(filePath)} already has a hash`);
        continue;
      }
      const hashedPath = await appendHash(filePath);
      console.log(`renaming ${path.basename(filePath)} to ${hashedPath}`);
      if (!dryRun) await moveFile(filePath, hashedPath);
      console.log(`remaining files: ${--fileCount}`);
    }
    console.log('done');
  })
  .parse();
