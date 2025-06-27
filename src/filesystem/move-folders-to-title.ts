import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';

program
  .description('moves subdirectories to dedicated dirs matching their title')
  .command('dir <directory>')
  .action(async (dir: string) => {
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
        await fs.ensureDir(destDir);
        console.log(`moving ${content}`);
        await fs.move(path.join(dir, content), path.join(destDir, content));
      }),
    );
    console.log('done');
  })
  .parse();
