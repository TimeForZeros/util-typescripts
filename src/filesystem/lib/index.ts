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
  console.log(console.log(`Getting all files in directory: ${dir}`));
  const { files, directories } = await getDirContents(dir);
  console.log(`Found ${files.length} files and ${directories.length} directories`);
  const result: string[] = [...files];
  (await Promise.all(directories.map(getAllFiles))).forEach((res) => {
    result.push(...res);
  });
  console.log(`Found ${result.length} files in total`);
  return result;
};

const ensureEmptyDir = async (dir: string): Promise<boolean> => {
  console.log(`Ensuring directory is empty: ${dir}`);
  const files: string[] = (await fs.readdir(dir)).filter(
    (file) => file !== '.DS_Store',
  );
  if (files.length) {
    console.warn(`Directory ${dir} is not empty`);
    return false;
  }
  console.log(`Directory ${dir} is empty`);
  return true;
};

const removeEmptyDirs = async (dir: string) => {
  const { directories } = await getDirContents(dir);
  await Promise.all(
    directories.map(async (dir): Promise<void> => {
      if (!(await ensureEmptyDir(dir))) return;
      console.log(`Removing empty directory: ${dir}`);
      await fs.remove(dir);
    }),
  );
};

const flattenDir = async (dir: string, cleanup: boolean) => {
  console.log(`Flattening directory: ${dir}`);
  const files = await getAllFiles(dir);
  for (const file of files) {
    const newPath = path.join(dir, path.basename(file));
    if (file !== newPath) {
      console.log(`Moving ${file} to ${newPath}`);
      await fs.move(file, newPath);
    }
  }
  if (cleanup) {
    const { directories } = await getDirContents(dir);
    await Promise.all(
      directories.map((dir) => {
        console.log(`Removing empty directory: ${dir}`);
        return fs.remove(dir);
      }),
    );
  }
  console.log(`Flattened directory: ${dir}`);
};

export { getDirContents, getAllFiles, flattenDir };
