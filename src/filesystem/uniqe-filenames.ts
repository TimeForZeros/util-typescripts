import { nanoid } from 'nanoid';
import { Command } from 'commander';
import path from 'path';
import { getDirContentPaths, moveFile } from './lib/index.js';

const program = new Command();

const renameFiles = (files: string[], serialize: boolean = false) => {
  const uniqueFilename = async (file: string, index: number) => {
    const basename = path.basename(file, path.extname(file));
    const orderNumber = (index + 1).toString().padStart(files.length, '0');
    const newName = serialize ? `${orderNumber}_${nanoid(12)}` : nanoid(12);
    const destination = file.replace(basename, newName);
    console.log(`new path name: ${destination}`);
    await moveFile(file, destination);
  };
  const renamePromises = files.map(uniqueFilename);
  return Promise.allSettled(renamePromises);
};

const uniquifyFiles = async (dir: string, { serialize }: { serialize: boolean }) => {
  console.log(dir);
  const { files, directories } = await getDirContentPaths(dir);
  if (files.length) await renameFiles(files, serialize);
  if (directories.length) {
    for (const directory of directories) {
      await uniquifyFiles(directory, { serialize });
    }
  }
};

program
  .command('dir <dir>')
  .option('-s, --serialize', 'serialize files in directory', false)
  .action(uniquifyFiles)
  .parse();
