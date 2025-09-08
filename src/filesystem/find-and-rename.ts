import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

type Options = {
  pattern: string;
  replace: string;
  dryRun: boolean;
  recursive: boolean;
};

const findAndRename = async (dir: string, options: Options) => {
  const iterateContents = async (contents: string[]) => {
    const promiseArr = [];
    for (const content of contents) {
      const contentPath = path.join(dir, content);
      if ((await fs.stat(contentPath)).isDirectory()) {
        await findAndRename(contentPath, options);
      }
      if (!content.includes(options.pattern)) continue;
      if (!options.replace) {
        console.log(contentPath);
        continue;
      }
      const ext = path.extname(content);
      const newName = path.basename(content, ext).replaceAll(options.pattern, options.replace);
      const newPath = path.join(dir, `${newName}${ext}`);
      if (options.dryRun) continue;
      promiseArr.push(fs.rename(contentPath, path.join(dir, newName)))
    }
    return Promise.allSettled(promiseArr);
  };
  const contents = await fs.readdir(dir);
  if (!contents.length) {
    console.log('No contents to consider');
    return;
  }
  await iterateContents(contents);
};

new Command()
  .command('dir <dir>')
  .requiredOption('-p, --pattern <string>', 'search pattern', '')
  .option('--dry-run', 'dry run', false)
  .option('--replace <string>', 'the string to replace pattern with', '')
  .option('-r, --recursive', 'recurse through directories', false)
  .action(findAndRename)
  .parse();
