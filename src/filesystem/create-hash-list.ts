import crypto from 'crypto';
import { getDirContentPaths } from './lib/index.js';
import { Command } from 'commander';
import fs from 'fs-extra';
import path, { parse } from 'path';

const program = new Command();

const generateHashFromFile = async (filePath: string) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const readStream = fs.createReadStream(filePath);
    readStream.on('data', (data) => {
      hash.update(data);
    });
    readStream.on('close', () => resolve(hash.digest('hex')));
    readStream.on('error', reject);
  });

program
  .command('dir <dirPath>')
  .option('-o, --output-file <string>', 'the file to write md5 hashes')
  .action(async (dirPath, { outputFile }) => {
    const { files } = await getDirContentPaths(dirPath);
    const outputFilePath = outputFile
      ? outputFile
      : path.join(dirPath, '_hashes.json');
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
