import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';

const renameArchiveDir = async (dir: string) => {
  const files = await fs.readdir(dir);
  const dirPromises = files.map(async (file) => {
    const stat = await fs.stat(path.join(dir, file));
    if (!stat.isDirectory()) return;
    const sourcePath = path.join(dir, file);
    const destinationName = `${file.toLowerCase().replaceAll(' ', '-')}_originals`;
    const destinationPath = path.join(dir, destinationName);
    console.log(`renaming: ${file} -> ${destinationName}`)
    await fs.rename(sourcePath, destinationPath);
  });
  await Promise.allSettled(dirPromises);
};

program.argument('dir', 'directory to search').action(renameArchiveDir).parse();
