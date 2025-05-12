import path from 'path';
import fs from 'fs-extra';
import { Worker, MessageChannel, MessagePort, isMainThread, parentPort } from 'node:worker_threads';
import { program } from 'commander';
import WorkerQueue from './WorkerQueue.js';
import type { ConvertOptions, Options } from './types.js';

const workerScript = './src/processing/_sharp-convert.ts';



const convertQueue: ConvertOptions[] = [];

function* arrayIterator(arr: ConvertOptions[]) {
  for (let i = 0; i < arr.length; i++) {
    yield arr[i];
  }
}

const parseExt = (extStr: string) => extStr.split(',').filter(Boolean);

const getOutputPath = (filePath: string, outputDir: string, format: string | undefined) =>
  path.join(
    outputDir,
    format ? path.basename(filePath).replace(path.extname(filePath), `.${format}`) : path.basename(filePath),
  );

const sharpConvert = async (dir: string, options: Options, dest: string = '') => {
  console.log(`working on ${path.basename(dir)}`);
  const files = await fs.readdir(dir);
  const convertList: string[] = [];
  if (!files.length) return;
  if (!options.outputDir) {
    options.outputDir = path.join(path.dirname(dir), '_output');
  }

  const outputDir = path.join(dest || options.outputDir, path.basename(dir));

  await fs.ensureDir(outputDir);
  for (let file of files) {
    console.log(file);
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await sharpConvert(filePath, options, outputDir);
      continue;
    }

    const kbSize = Math.round(stat.size / 1024);
    if (kbSize < 10 && file.startsWith('.')) {
      console.log(`removing ${file}`);
      await fs.remove(filePath);
      continue;
    }

    const ext = path.extname(file).replace('.', '');
    if (options.extensions.includes(ext)) {
      convertList.push(filePath);
    } else {
      console.log(`copying ${file} to _other directory`);
      const otherDir = path.join(outputDir, '_other');
      await fs.ensureDir(otherDir);
      await fs.copy(filePath, getOutputPath(file, otherDir, undefined));
    }
  }
  convertList.forEach((convertFile) => {
    convertQueue.push({
      sourcePath: convertFile,
      outputPath: getOutputPath(convertFile, outputDir, options.format),
      options,
    });
  });
};

const multiConvert = async (dir: string, options: Options) => {
  console.time();
  const shouldQuit = [false, false];
  let iterator = null;
  console.log('starting');
  await sharpConvert(dir, options);
  iterator = arrayIterator(convertQueue);
  const worker1 = new Worker(workerScript);
  const worker2 = new Worker(workerScript);
  worker1.postMessage(JSON.stringify(iterator.next().value));
  worker2.postMessage(JSON.stringify(iterator.next().value));
  worker1?.on('message', (value) => {
    if (value !== 0) return;
    const result = iterator.next();
    if (result.done) {
      shouldQuit[0] = true;
      if (shouldQuit.every(Boolean)) {
        console.log('queue is empty');
        console.timeEnd();
        process.exit(0);
      }
    }
    worker1.postMessage(JSON.stringify(result.value));
  });
  worker2?.on('message', (value) => {
    if (value !== 0) return;
    const result = iterator.next();
    if (result.done) {
      shouldQuit[1] = true;
      if (shouldQuit.every(Boolean)) {
        console.log('queue is empty');
        console.timeEnd();
        process.exit(0);
      }
    }
    worker2.postMessage(JSON.stringify(result.value));
  });
};

const getInt = (input: string) => {
  const inputNum = parseInt(input, 10);
  if (Number.isNaN(inputNum)) {
    throw Error('input requires a valid integer');
  }
  return inputNum;
};

const verifyDir = (dir: string) => {
  const exists = fs.existsSync(dir);
  if (exists) return dir;
  throw Error(`path ${dir} does not exist`);
};

program
  .argument('<dir>', 'the directory to convert', verifyDir)
  .option('-f, --format <image format>', 'the format to convert the images', 'avif')
  .option(
    '-s, --scale-percentage <scale percentage>',
    'number representing the percentage to scale the image by',
    getInt,
    0,
  )
  .option('-q, --quality <quality number>', 'number for quality', getInt, 80)
  .option('-o, --output-dir <dir path>', 'dir path for processed files')
  .option('-b, --bit-depth <<8 | 10 | 12>>', 'bit depth', getInt, 8)
  .option('-e, --extensions <extension>', 'the extensions to search for, separated by a comma', parseExt, [
    'jpg',
    'jpeg',
  ])
  .action((dir: string, options: Options) => multiConvert(dir, options))
  .parse();
