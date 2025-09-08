import { fileTypeFromFile } from 'file-type';
import { program } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { moveFile } from './lib/index.js';

const getFileTypePathName = async (filePath: string): Promise<string> => {
  const fileType = await fileTypeFromFile(filePath);
  if (!fileType) {
    console.error(`no filetype found for ${path.basename(filePath)}`);
    return '';
  }
  const oldExt = path.extname(filePath);
  const newExt = `.${fileType.ext}`;
  if (oldExt === `.${fileType.ext}`) {
    console.log(`extension does not require updating for: ${path.basename(filePath)}`);
    return '';
  }
  return filePath.replace(oldExt, newExt);
};

type Options = {
  dryRun: boolean;
};

const renameFileExtension = async (filePath: string, dryRun: boolean) => {
  const newPath = await getFileTypePathName(filePath);
  if (!newPath) return;
  console.log(`${path.basename(filePath)} --> ${path.basename(newPath)}`);
  if (dryRun) return;
  try {
    await moveFile(filePath, newPath);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error('Unknown Error Occurred');
    }
  }
};

async function setFileType(dir: string, { dryRun = false }: Options) {
  console.log(`checking directory ${dir}`);
  const contents = await fs.readdir(dir);
  const count = contents.length;
  if (!count) {
    console.log('No files to consider');
  }
  const promiseArr = [];
  for (const content of contents) {
    const contentPath = path.join(dir, content);
    if ((await fs.stat(contentPath)).isDirectory()) {
      await setFileType(contentPath, { dryRun });
    } else {
      promiseArr.push(renameFileExtension(contentPath, dryRun));
    }
  }
  await Promise.allSettled(promiseArr);
}

program
  .description('Set file type')
  .command('dirPath <directoryPath>')
  .option('--dry-run', 'Show what would be done without doing it')
  .action(setFileType)
  .parse();
