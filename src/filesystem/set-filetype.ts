import { fileTypeFromFile } from 'file-type';
import { program } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getAllFilePaths, moveFile } from './lib/index.js';

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

async function setFileType(
  dir: string,
  { dryRun = false }: { dryRun: boolean },
) {
  const files = await getAllFilePaths(dir);
  if (!files.length) {
    console.log('No files to consider');
  }
  console.log('starting file setting')
  // await Promise.all(
  //   files.map(async (filePath) => {
  for (const filePath of files) {
      const newPath = await getFileTypePathName(filePath);
      if (!newPath) continue;
      console.log(`${path.basename(filePath)} --> ${path.basename(newPath)}`);
      if (dryRun) continue;
      try {
        await moveFile(filePath, newPath);
      } catch(err: any) {
        console.error(err?.message);
      }
    }
    // }),
  // );
}

program
  .description('Set file type')
  .command('dirPath <directoryPath>')
  .option('--dry-run', 'Show what would be done without doing it')
  .action(setFileType)
  .parse();
