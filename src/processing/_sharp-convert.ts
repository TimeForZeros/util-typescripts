import path from 'path';
import sharp from 'sharp';
import async from 'async';
import fs from 'fs-extra';
import { program } from 'commander';
import { parentPort, workerData, MessagePort } from 'node:worker_threads';

type Options = {
  format: string;
  extensions: string[];
  quality: number;
  scalePercentage: number;
  outputDir: string;
  bitDepth: 8 | 10 | 12;
};

const convert = async (sourcePath: string, outputPath: string, options: Options) => {
  // if (!sourcePath || !outputPath) return;
  console.log(`converting ${path.basename(sourcePath)}`);
  const metadata = await sharp(sourcePath).metadata();
  if (!metadata.width) return;
  const isCover = path.basename(sourcePath).startsWith('_');
  const convertOpts = {
    quality: isCover ? 80 : options.quality,
    bitdepth: options.bitDepth,
  };
  const buffer = sharp(sourcePath).clone().avif(convertOpts);
  if (options.scalePercentage !== 0 && !isCover) {
    buffer.resize((metadata.width * options.scalePercentage) / 100);
  }
  await buffer.toFile(outputPath);
};

parentPort?.on('message', async (json: string) => {
  try {
    const { sourcePath, outputPath, options } = JSON.parse(json);
    await convert(sourcePath, outputPath, options);
  } catch(err) {
    console.log(json);
    console.log(err);
  }
  parentPort?.postMessage(0);
});
