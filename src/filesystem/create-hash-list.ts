import crypto from 'crypto';
import { getDirContentPaths, generateHashFromFile } from './lib/index.js';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

program
  .command('dir <dirPath>')
  .option('-o, --output-file <string>', 'the file to write md5 hashes')
  .action(async (dirPath, { outputFile }) => {
    const { files } = await getDirContentPaths(dirPath);
    const outputFilePath = outputFile
      ? outputFile
      : path.join(dirPath, '.hashes.json');
    let hashList = await Promise.all(
      files.filter((file) => file !== outputFilePath).map(generateHashFromFile),
    );
    if (await fs.pathExists(outputFilePath)) {
      const existingData = await fs.readJson(outputFilePath);
      console.log(existingData);
      hashList = Array.from(new Set([...existingData, ...hashList]));
    }
    await fs.writeJSON(outputFilePath, hashList);
  })
  .parse();
