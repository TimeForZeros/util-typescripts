import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';

const parseInteger = (index: string) => {
  const int = parseInt(index);
  if (Number.isNaN(int)) {
    throw new Error('index value is invalid');
  }
  return int;
};

program
  .description('moves subdirectories to dedicated dirs matching their title')
  .command('dir <directory>')
  .option('-s, --split-text <TEXT>', 'the text to split filenames by', ' - ')
  .option('-i, --index <INDEX>', 'the index where the title lies', parseInteger)
  .option('--dry-run', 'dry run', false)
  .action(
    async (dir: string, { splitText, index = 0, dryRun }: { splitText: string; index: number; dryRun: boolean }) => {
      console.log('started');
      await Promise.allSettled(
        (
          await fs.readdir(dir)
        ).map(async (content) => {
          if (!(await fs.stat(path.join(dir, content))).isDirectory()) return;
          const nameParts = content.split(' - ');
          if (nameParts.length < 2) return;
          if (!nameParts[1].length) return;
          const destDir = path.join(dir, nameParts[1]);
          console.log(`moving ${content}`);
          if (dryRun) return;
          await fs.ensureDir(destDir);
          await fs.move(path.join(dir, content), path.join(destDir, content));
        }),
      );
      console.log('done');
    },
  )
  .parse();
