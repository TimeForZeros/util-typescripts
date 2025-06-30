import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';
import { moveFile } from './lib/index.js';

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
  .option('-n, --name-index <NAME INDEX>', 'the name of the moved directory', parseInteger)
  .option('--dry-run', 'dry run', false)
  .action(
    async (
      dir: string,
      {
        splitText,
        index = 0,
        nameIndex,
        dryRun,
      }: { splitText: string; index: number; nameIndex: number; dryRun: boolean },
    ) => {
      console.log('started');
      await Promise.allSettled(
        (
          await fs.readdir(dir)
        ).map(async (content) => {
          if (!(await fs.stat(path.join(dir, content))).isDirectory()) return;
          const nameParts = content.split(splitText);
          if (nameParts.length < 2) return;
          if (!nameParts[index].length) return;
          const destDir = path.join(dir, nameParts[index]);
          const destName = Number.isInteger(nameIndex) && nameParts[nameIndex]?.length ? nameParts[nameIndex] : content;
          const destPath = path.join(destDir, destName);
          console.log(`moving ${content} to ${destPath}`);
          if (dryRun) return;
          await fs.ensureDir(destDir);
          await moveFile(path.join(dir, content), destPath);
        }),
      );
      console.log('done');
    },
  )
  .parse();
