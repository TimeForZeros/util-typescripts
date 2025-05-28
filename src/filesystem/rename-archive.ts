import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';

const renameArchiveDir = async (dir: string, { undo = false }) => {
  const files = await fs.readdir(dir);
  const dirPromises = files.map(async (file) => {
    const stat = await fs.stat(path.join(dir, file));
    if (!stat.isDirectory()) return;
    const sourcePath = path.join(dir, file);
    const destinationName = undo
      ? file
          .replace('_originals', '')
          .split('-')
          .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
          .join(' ')
      : `${file.toLowerCase().replaceAll(' ', '-')}_originals`;
    const destinationPath = path.join(dir, destinationName);
    console.log(`renaming: ${file} -> ${destinationName}`);
    await fs.rename(sourcePath, destinationPath);
  });
  await Promise.allSettled(dirPromises);
};

program
  .argument('dir', 'directory to search')
  .option('-u, --undo', 'undo-archival name')
  .action(renameArchiveDir)
  .parse();
