import path from 'path';
import { Command } from 'commander';
import { generateHashFromFile, getAllFilePaths, moveFile } from './lib/index.js';

const program = new Command();

program
  .command('dir <dir>')
  .action(async (dir: string) => {
    const filePaths = await getAllFilePaths(dir);
    console.log(`Renaming files in: ${dir}`);
    let remaining = filePaths.length;
    for (const filePath of filePaths) {
      const hash = await generateHashFromFile(filePath);
      const ext = path.extname(filePath);
      const newPath = path.join(path.dirname(filePath), `${hash}${ext}`);
      console.log(`Renaming ${filePath} to ${newPath}`);
      await moveFile(filePath, newPath);
      remaining -= 1;
      console.log(`Remaining: ${remaining}`);
    }
    console.log(`Renamed files in: ${dir}`);
  })
  .parse();
