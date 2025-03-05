import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';

function generateRandomString(length: number) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

const appendBeforeExt = (filePath: string, append: string) => {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath);
  const appendedExt = `${append}${ext}`;
  const newFileName = basename.replace(ext, appendedExt);
  return filePath.replace(basename, newFileName);
};

const moveFile = async (source: string, destination: string) => {
  try {
    await fs.move(source, destination);
  } catch (err: any) {
    if (err.message !== 'dest already exists.') throw err;
    console.log('destination already exists, adding hash to filename');
    const hash = `-${generateRandomString(4)}`;
    const newDest = appendBeforeExt(destination, hash);
    return moveFile(source, newDest);
  }
};

const getDirContentPaths = async (dir: string): Promise<{ files: string[]; directories: string[] }> => {
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
    stat.isDirectory() ? result.directories.push(filePath) : result.files.push(filePath);
  }
  return result;
};
const getAllFilePaths = async (dir: string, filterList?: string[]): Promise<string[]> => {
  console.log(console.log(`Getting all files in directory: ${dir}`));
  const { files, directories } = await getDirContentPaths(dir);
  console.log(`Found ${files.length} files and ${directories.length} directories`);
  const result: string[] = [...files];
  const dirs = filterList
    ? directories.filter((directory) => !filterList.includes(directory))
    : directories;
  (await Promise.all(dirs.map((directory) => getAllFilePaths(directory, filterList)))).forEach((res) =>
    result.push(...res),
  );
  console.log(`Found ${result.length} files in total`);
  return result;
};

const ensureEmptyDir = async (dir: string): Promise<boolean> => {
  console.log(`Ensuring directory is empty: ${dir}`);
  const files: string[] = (await fs.readdir(dir)).filter((file) => file !== '.DS_Store');
  if (files.length) {
    console.warn(`Directory ${dir} is not empty`);
    return false;
  }
  console.log(`Directory ${dir} is empty`);
  return true;
};

const removeEmptyDirs = async (dir: string): Promise<void> => {
  const { directories } = await getDirContentPaths(dir);
  await Promise.all(
    directories.map(async (dir): Promise<void> => {
      if (!(await ensureEmptyDir(dir))) return;
      console.log(`Removing empty directory: ${dir}`);
      await fs.remove(dir);
    }),
  );
  console.log(`Removed empty directories in: ${dir}`);
};

// all levels
const flattenDir = async (dir: string, cleanup: boolean): Promise<void> => {
  console.log(`Flattening directory: ${dir}`);
  const files = await getAllFilePaths(dir);
  for (const file of files) {
    const newPath = path.join(dir, path.basename(file));
    if (file !== newPath) {
      console.log(`Moving ${file} to ${newPath}`);
      await fs.move(file, newPath);
    }
  }
  if (cleanup) await removeEmptyDirs(dir);
  console.log(`Flattened directory: ${dir}`);
};

// single level
const moveContentsToParent = async (dir: string): Promise<void> => {
  const parentDir = path.dirname(dir);
  const { files, directories } = await getDirContentPaths(dir);
  const moveToParent = async (contentPath: string) => {
    const newPath = path.join(parentDir, path.basename(contentPath));
    console.log(`Moving ${path.basename(contentPath)} to ${newPath}`);
    await fs.move(contentPath, newPath);
  };
  for (const filePath of files) {
    await moveToParent(filePath);
  }
  for (const nestedDir of directories) {
    await moveToParent(nestedDir);
  }
  if (await ensureEmptyDir(dir)) {
    console.log(`Removing empty directory: ${dir}`);
    await fs.remove(dir);
  }
};
const findDuplicateNestedDir = async (dir: string, flatten: boolean) => {
  const { directories } = await getDirContentPaths(dir);
  if (!directories.length) return;
  for (const nestedDir of directories) {
    const nestedDirName = path.basename(nestedDir);
    if (nestedDirName === path.basename(dir)) {
      console.log(`Found duplicate nested directory: ${nestedDir}`);
      if (flatten) await moveContentsToParent(dir);
    } else {
      await findDuplicateNestedDir(nestedDir, flatten);
    }
  }
};

const generateHashFromFile = async (filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const readStream = fs.createReadStream(filePath);
    readStream.on('data', (data) => {
      hash.update(data);
    });
    readStream.on('close', () => resolve(hash.digest('hex')));
    readStream.on('error', reject);
  });

const appendHash = async (filePath: string) => {
  const hash = await generateHashFromFile(filePath);
  return appendBeforeExt(filePath, `_hash-${hash.substring(0, 8)}`);
};

const appendCodec = async (filePath: string) => {
  const videoData: FfprobeData = await new Promise((resolve, reject) =>
    ffmpeg.ffprobe(filePath, (err, data) => (err ? reject(err) : resolve(data))),
  );
  const codec = videoData.streams.find((stream) => stream.codec_type === 'video')?.codec_name;
  if (!codec) throw new Error('file has no codec data');
  return appendBeforeExt(filePath, `_codec:${codec}`);
};

export {
  getDirContentPaths,
  getAllFilePaths,
  flattenDir,
  generateHashFromFile,
  appendHash,
  appendCodec,
  moveFile,
  removeEmptyDirs,
};
