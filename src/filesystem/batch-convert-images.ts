import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import { getDirContentPaths } from './lib/index.js';

const program = new Command();

type batchOptions = {
  format: string;
  quality: string | undefined;
  scale: string | undefined;
  extension: string;
  deleteOriginals: boolean;
  recursive: boolean;
};

const stripDots = (str: string): string => str.replace(/\./g, '');

const batchConvertImages = async (dir: string, options: batchOptions) => {
  if (path.basename(dir).startsWith('_originals')) {
    console.log(`skipping directory ${path.basename(dir)}`);
    return;
  }
  console.log(`converting images in ${path.basename(dir)}`);
  const { files, directories } = await getDirContentPaths(dir);
  const imageFiles = files.filter((file) => file.endsWith(options.extension));
  const destinationDir = path.join(path.dirname(dir), `_originals-${options.extension}`, path.basename(dir));
  if (!imageFiles.length) {
    console.log(`no image files to consider with the extension ${options.extension}`);
    if (!options.recursive) return;
  } else {
    await fs.ensureDir(destinationDir);
  }
  let fileCount = imageFiles.length;
  for (const imageFile of imageFiles) {
    const imOptions = [];
    if (path.basename(imageFile).startsWith('_')) {
      imOptions.push('-quality', '80');
    } else if (options.quality && !Number.isNaN(Number(options.quality))) {
      imOptions.push('-quality', options.quality);
    }
    if (
      options.scale &&
      !Number.isNaN(Number(options.scale.replace('%', ''))) &&
      !path.basename(imageFile).startsWith('_')
    ) {
      imOptions.push('-scale', options.scale);
    }
    const destinationPath = path.join(
      path.dirname(imageFile),
      `${path.basename(imageFile, options.extension)}${options.format}`,
    );
    const imArgs = [imageFile, ...imOptions, destinationPath];
    await new Promise((resolve, reject) => {
      const child = spawn('magick', imArgs, { stdio: 'inherit' });
      child.on('error', reject);
      child.on('close', resolve);
    });
    console.log(`successfully converted ${path.basename(imageFile)}`);
    await fs.move(imageFile, path.join(destinationDir, path.basename(imageFile)));
    fileCount -= 1;
    console.log(`remaining files: ${fileCount}`);
  }
  let dirCount = directories.length;
  if (!dirCount || !options.recursive) return;
  for (const directory of directories) {
    await batchConvertImages(directory, options);
    dirCount -= 1;
    console.log(`remaining directories: ${dirCount}`);
  }
  if (options.deleteOriginals) {
    console.log(`deleting original images`);
    await fs.remove(path.join(dir, `_originals-${options.extension}`));
  }
};

program
  .command('batch-convert-images <dir>')
  .option('-r, --recursive', 'Recursively convert images in subdirectories')
  .option('-f, --format <format>', 'The output format', stripDots, 'avif')
  .option('-s, --scale <scale>', 'the scale for the output relative to the original')
  .option('-q, --quality <quality>', 'The output quality')
  .option('-e, --extension <extension>', 'The input extension', stripDots, 'jpg')
  .option('-d, --delete-originals', 'Delete the original images after conversion', false)
  .action(batchConvertImages)
  .parse();
