import path from 'path';
import fs from 'fs-extra';
import { Command } from 'commander';
import { generateHashFromFile, getDirContentPaths } from './lib/index.js';

const program = new Command();

const checkHashes = async (
  dirPath: string,
  {
    hashFile,
    dryRun = false,
  }: {
    hashFile: string;
    dryRun: boolean;
  },
) => {
  const hashList = await fs.readJSON(hashFile);
  const { files } = await getDirContentPaths(dirPath);
  const hashComparisonPromiseList = files.map(async (file: string) => {
    const fileHash = await generateHashFromFile(file);
    if (!hashList.includes(fileHash)) return;
    console.log(`Hash match found for: ${path.basename(file)}`);
    if (dryRun) return;
    await fs.rm(file);
  });
  const results = await Promise.allSettled(hashComparisonPromiseList);
  console.log(results);
};

program
  .command('directory <dir>')
  .requiredOption('--hash-file <file>', 'hash file to check against')
  .option('-d, --dry-run', 'dry run')
  .action(checkHashes)
  .parse();
