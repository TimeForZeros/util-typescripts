import path from 'path';
import fs from 'fs-extra';

const getDirContents = async (
  dir: string,
): Promise<{ files: string[]; directories: string[] }> => {
  const files = await fs.readdir(dir);
  const result: { files: string[]; directories: string[] } = {
    files: [],
    directories: [],
  };
  for (const file of files) {
    if (file === '.DS_Store') {
      fs.remove(path.join(dir, file));
      continue;
    }
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    stat.isDirectory()
      ? result.directories.push(filePath)
      : result.files.push(filePath);
  }
  return result;
};
const getAllFiles = async (dir: string): Promise<string[]> => {
  const { files, directories } = await getDirContents(dir);
  const result: string[] = [...files];
  (await Promise.all(directories.map(getAllFiles))).forEach((res) => {
    result.push(...res);
  });
  return result;
}

const flattenDir = async (dir: string, cleanup: boolean) => {
  const files = await getAllFiles(dir);
  for (const file of files) {
    const newPath = path.join(dir, path.basename(file));
    if (file !== newPath) {
      await fs.move(file, newPath);
    }
  }
  if (cleanup) {
    const { directories } = await getDirContents(dir);
    await Promise.all(directories.map((dir) => fs.remove(dir)));
  }
};

export { getDirContents, getAllFiles, flattenDir };