import path from 'path';
import sharp from 'sharp';
import async from 'async';
import fs from 'fs-extra';
import { program } from 'commander';

type Options = {
  format: string;
  extensions: string[];
  quality: number;
  scalePercentage: number;
  outputDir: string;
  bitDepth: 8 | 10 | 12;
};

const parseExt = (extStr: string) => extStr.split(',').filter(Boolean);

const verifyDir = (dir: string) => {
  const exists = fs.existsSync(dir);
  if (exists) return dir;
  throw Error(`path ${dir} does not exist`);
};

const getOutputPath = (filePath: string, outputDir: string, format: string | undefined) =>
  path.join(
    outputDir,
    format ? path.basename(filePath).replace(path.extname(filePath), `.${format}`) : path.basename(filePath),
  );

const convert = async (sourcePath: string, outputPath: string, options: Options) => {
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

const sharpConvert = async (dir: string, options: Options, dest: string = '') => {
  console.log(options);
  console.time(dir);
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

  const queue = async.queue(
    async ({ sourcePath, outputPath, options }: { sourcePath: string; outputPath: string; options: Options }) =>
      convert(sourcePath, outputPath, options),
    2,
  );
  queue.push(
    convertList.map((convertFile) => ({
      sourcePath: convertFile,
      outputPath: getOutputPath(convertFile, outputDir, options.format),
      options,
    })),
  );
  await queue.drain();

  console.log('done');
  console.timeEnd(dir);
};

const getInt = (input: string) => {
  const inputNum = parseInt(input, 10);
  if (Number.isNaN(inputNum)) {
    throw Error('input requires a valid integer');
  }
  return inputNum;
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
  .action((dir: string, options: Options) => sharpConvert(dir, options))
  .parse();
