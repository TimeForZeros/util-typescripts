import path from 'path';
import fs from 'fs-extra';
import { Command } from 'commander';

const program = new Command();

const getNumberStr = (fileName: string) => {
  let numberStr = '';
  for (let i = fileName.length - 1; i >= 0; i -= 1) {
    const char = fileName.charAt(i);
    if (Number.isNaN(parseInt(char))) break;
    numberStr = char + numberStr;
  }
  return numberStr;
};

const renameToPadding = async (filePath: string, padLength: number) => {
  const fileName = path.basename(filePath, path.extname(filePath));
  const numberStr = getNumberStr(fileName);
  if (!numberStr) return;
  const paddedNumber = numberStr.padStart(padLength, '0');
  const paddedName = fileName.replace(numberStr, paddedNumber);
  const paddedPath = filePath.replace(fileName, paddedName);
  if (paddedPath === filePath) return;
  console.log(`before: ${filePath}`);
  console.log(`after: ${paddedPath}`);
  await fs.rename(filePath, paddedPath);
};

const setPadding = async (dir: string) => {
  const contents = await fs.readdir(dir);
  const promiseArr = [];
  const contentLength = contents.length;
  if (!contents.length) {
    console.log(`Nothing to consider in ${dir}`);
    return;
  }
  const padLength = contentLength.toString(10).length;
  for (const content of contents) {
    const contentPath = path.join(dir, content);
    const isDir = (await fs.stat(contentPath)).isDirectory();
    if (isDir) {
      await setPadding(contentPath);
    } else {
      promiseArr.push(renameToPadding(contentPath, padLength));
    }
  }
  await Promise.allSettled(promiseArr);
};

program.command('dir <dir>').action(setPadding).parse();
