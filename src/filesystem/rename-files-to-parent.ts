import fs from 'fs/promises';
import path from 'path';
import { program } from 'commander';

program
  .argument('<directoryPath>', 'Directory that contains directory files to rename')
  .option('-a, --append-parent', 'Append parent directory name to the file name')
  .option('-s, --skip-underscore', 'Skip files prepended with underscore')
  .parse();

const dir = program.args[0];
const { appendParent } = program.opts();

const renameFiles = async (dirPath: string, duplicateName: boolean) => {
  const directoryName = path.basename(dirPath);
  const dirFiles = (await fs.readdir(dirPath)).filter((file) => file !== '.DS_Store');
  const dirLength = dirFiles.length;
  if (dirLength === 0) return;
  const padding = dirLength.toString().length;
  let count = 1;
  for (const dirFile of dirFiles) {
    const currentPath = path.join(dirPath, dirFile);
    const stat = await fs.stat(currentPath);
    if (stat.isDirectory()) {
      console.log('Renaming files in subdirectory:', currentPath);
      await renameFiles(currentPath, directoryName === dirFile);
      continue;
    }
    if (dirFile.startsWith('_')) continue;
    const ext = path.extname(dirFile);
    const newFileName = `${directoryName}_${String(count).padStart(padding, '0')}${ext}`.replace(' ', '-');
    const newPath = duplicateName ? path.join(path.dirname(dirPath), newFileName) : path.join(dirPath, newFileName);
    const oldPath = path.join(dirPath, dirFile);
    await fs.rename(oldPath, newPath);
    console.log(`Renamed to ${newFileName}`);
    count++;
  }
  if (duplicateName) {
    await fs.rmdir(dirPath);
    console.log('Deleted directory:', dirPath);
  }
};

const renameFilesToParentDirectoryName = async (directoryPath: string) => {
  const directoryName = path.basename(directoryPath);
  // Read the directory
  const files = (await fs.readdir(directoryPath)).filter((file) => file !== '.DS_Store');
  // filter directories
  const directories = files.filter((file) =>
    fs.stat(path.join(directoryPath, file)).then((stats) => stats.isDirectory()),
  );

  for (const directory of directories) {
    const dirPath = path.join(directoryPath, directory);
    await renameFiles(dirPath, false);
    if (appendParent) {
      const newDirName = `${directory} - ${directoryName}`;
      const newDirPath = path.join(directoryPath, newDirName);
      await fs.rename(dirPath, newDirPath);
      console.log(`Renamed directory to ${newDirName}`);
    }
  }
};

renameFilesToParentDirectoryName(dir);
