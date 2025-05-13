import path from 'path';
import spawn from 'cross-spawn';
import { parentPort } from 'node:worker_threads';

type Options = {
  format: string;
  extensions: string[];
  quality: number;
  scalePercentage: number;
  outputDir: string;
  bitDepth: 8 | 10 | 12;
};

const convert = async (sourcePath: string, outputPath: string, options: Options) => {

  console.log(`converting ${path.basename(sourcePath)}`);
  const isCover = path.basename(sourcePath).startsWith('_');
  const imOptions: string[] = [];
  if (options.quality) {
    imOptions.push('-quality', isCover ? '90' : options.quality.toString());
  }
  if (options.scalePercentage && !isCover) {
    imOptions.push('-scale', `${options.scalePercentage}%`);
  }
  const imArgs = [sourcePath, ...imOptions, outputPath];
  await new Promise((resolve, reject) => {
    const child = spawn('magick', imArgs, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', resolve);
  });
};

parentPort?.on('message', async (json: string) => {
  try {
    const { sourcePath, outputPath, options } = JSON.parse(json);
    await convert(sourcePath, outputPath, options);
  } catch (err) {
    console.log(json);
    console.log(err);
  }
  parentPort?.postMessage(0);
});
