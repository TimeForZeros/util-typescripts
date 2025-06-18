import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';
import { moveFile } from '../filesystem/lib/index.js';

const blacklist = ['"', "'", ':', ';', '`', '\\'];

const stripChars = (str: string, idx: number = 0) => {
  let strippedStr = str
    .split('')
    .filter((char) => char.charCodeAt(0) < 127 && !blacklist.includes(char))
    .join('')
    .trim();
  if (!strippedStr.length) {
    strippedStr = `default-${idx}`;
  }
  return strippedStr;
};
const stripCharsSearch = async (dir: string) => {
  const contents = await fs.readdir(dir);
  for (let i = 0; i < contents.length; i += 1) {
    const content = contents[i];
    // if (content === '.DS_Store') {
    //   console.log('removing ds store');
    //   await fs.rm(path.join(dir, '.DS_Store'));
    // }
    const contentPath = path.join(dir, content);
    const stat = await fs.stat(contentPath);
    if (stat.isDirectory()) {
      await stripCharsSearch(contentPath);
      const strippedName = stripChars(content);
      if (strippedName !== content) {
        console.log(`renaming: ${content} -> ${strippedName}`);
        await moveFile(contentPath, path.join(dir, strippedName));
      } else {
        console.log(`no need to rename: ${content}`);
      }
    } else {
      const fileExt = path.extname(content);
      const fileName = path.basename(content, fileExt);
      let strippedName = stripChars(fileName, i);
      if (strippedName !== fileName) {
        console.log(`renaming: ${fileName} -> ${strippedName}`);
        const destination = path.join(dir, `${strippedName}${fileExt}`);
        await moveFile(contentPath, destination);
      } else {
        console.log(`no need to rename: ${content}`);
      }
    }
  }
};

program.command('dir <directory>').action(stripCharsSearch).parse();
