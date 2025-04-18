import { getDirContentPaths } from './lib/index.js';
import { Command } from 'commander';

const program = new Command();

program
  .command('dir <dir> pattern [pattern]')
  .action(async (dir: string, pattern: string) => {
    console.log('getting all directory paths');
    const dirs: string[] = [];
    const getAllDirs = async (sourceDir: string) => {
      if (sourceDir.includes(pattern)) {
        dirs.push(sourceDir);
        return;
      }
      const { directories } = await getDirContentPaths(sourceDir);
      for (const subDir of directories) {
        const subPaths = await getDirContentPaths(subDir);
        if (subPaths.directories.length) {
          await getAllDirs(subDir);
        }
      }
    };
    await getAllDirs(dir);
    const results = Array.from(new Set(dirs.map((dirPath) => dirPath.split(pattern).pop()))).sort();
    console.log(results);
  })
  .parse();
