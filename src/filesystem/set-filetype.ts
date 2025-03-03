import { fileTypeFromFile } from 'file-type';
import { program } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getAllFilePaths, generateHashFromFile } from './lib/index.js';

const getFileTypePathName = async (filePath: string): Promise<string> => {
  const fileType = await fileTypeFromFile(filePath);
  if (!fileType) {
    console.error(`no filetype found for ${path.basename(filePath)}`);
    return '';
  }
  const oldExt = path.extname(filePath);
  const newExt = `.${fileType.ext}`;
  if (oldExt === `.${fileType.ext}`) {
    console.log('extension does not require updating');
    return '';
  }
  return filePath.replace(oldExt, newExt);
};

const renameFile = async (source: string, dest: string): Promise<void> => {
  try {
    await fs.move(source, dest);
  } catch(err: any) {
    if (err?.message === 'dest already exists.') {
      console.log('name collsion, appending hash');
      const hash = await generateHashFromFile(source)
      const ext = path.extname(dest);
      const updatedDest = dest.replace(ext, `-${hash.substring(0, 4)}${ext}`);
      return renameFile(source, updatedDest);
    }
  }
}

async function setFileType(
  dir: string,
  { dryRun = false }: { dryRun: boolean },
) {
  const files = await getAllFilePaths(dir);
  if (!files.length) {
    console.log('No files to consider');
  }
  await Promise.all(
    files.map(async (filePath) => {
      const newPath = await getFileTypePathName(filePath);
      if (!newPath) return;
      console.log(`${path.basename(filePath)} --> ${path.basename(newPath)}`);
      if (dryRun) return;
      try {
        await renameFile(filePath, newPath);
      } catch(err: any) {
        console.error(err?.message);
      }
    }),
  );
}

program
  .description('Set file type')
  .command('dirPath <directoryPath>')
  .option('--dry-run', 'Show what would be done without doing it')
  .action(setFileType)
  .parse();
