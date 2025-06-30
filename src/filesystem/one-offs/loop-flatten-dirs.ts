import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';

program
  .command('dir <directory>')
  .action(async (dir: string) => {
    const contents = await fs.readdir(dir);
    for (let content of contents) {
      const contentPath = path.join(dir, content);
      const stat = await fs.stat(contentPath);
      if (!stat.isDirectory()) continue;
      const subContents = await fs.readdir(contentPath);
      for (let subContent of subContents) {
        const subPath = path.join(contentPath, subContent);
        const subStat = await fs.stat(subPath);
        if (!subStat.isDirectory()) continue;
        const destPath = path.join(dir, subContent);
        console.log(`${subPath} -> ${destPath}`);
        await fs.move(subPath, destPath);
      }
    }
  })
  .parse();
