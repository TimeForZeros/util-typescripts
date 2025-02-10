import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getAllFilePaths } from './lib/index.js';

const program = new Command();

const compareHandbrakeOutput = async (dir: string, options: { outputDir: string }) => {
  const files = await getAllFilePaths(dir);
  const outputFiles = files.filter((file) => file.endsWith('_AV1.mp4') || file.endsWith('_H.265.mp4'));
  for (const outputFilePath of outputFiles) {
    const originalFilePattern = path.basename(outputFilePath).replace(/(_AV1|_H\.265).mp4/, '');
    const foundPath = files.find((file: string) => file.includes(originalFilePattern) && !file.endsWith('_AV1.mp4') && !file.endsWith('_H.265.mp4'));
    if (!foundPath) continue;
    const outputSize = (await fs.stat(outputFilePath)).size;
    const originalSize = (await fs.stat(foundPath)).size;
    if (outputSize < originalSize) {
      console.log(`Removing larger file: ${foundPath}`);
      await fs.remove(foundPath);
    } else {
      console.log(`Removing larger file: ${outputFilePath}`);
      await fs.remove(outputFilePath);
    }

  }
};

program
  .argument('containing dir <dir>')
  .option('-o, --output-dir, the output directory')
  .action(compareHandbrakeOutput)
  .parse();

