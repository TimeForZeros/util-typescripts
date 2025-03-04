import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getAllFilePaths, moveFile, removeEmptyDirs } from './lib/index.js';

const program = new Command();

const INDEX_FILE = '.DS_Store';
const VIDEO_EXTENSIONS = [
  '.mp4',
  '.m4v',
  '.mts',
  '.mov',
  '.avi',
  '.avf',
  '.asf',
  '.mkv',
  '.wmv',
  '.flv',
  '.webm',
  '.mpg',
  '.ts',
];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
const ZIP_EXTENSIONS = [
  '.zip',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
  '.bz2',
  '.xz',
  '.z',
  '.lz',
  '.lzma',
  '.lzo',
  '.cab',
  '.arj',
  '.arc',
  '.ace',
  '.zoo',
  '.zpaq',
  '.par',
  '.par2',
  '.sfx',
  '.apk',
  '.iso',
  '.img',
  '.dmg',
  '.vhd',
  '.vmdk',
  '.vdi',
  '.hdd',
  '.qcow',
  '.qcow2',
];

type lookup = [string, string[]];
const directoryLookup: lookup[] = [
  ['pictureDir', IMAGE_EXTENSIONS],
  ['videoDir', VIDEO_EXTENSIONS],
  ['audioDir', AUDIO_EXTENSIONS],
  ['zipDir', ZIP_EXTENSIONS],
];
const splitMedia = async (dir: string, { dryRun = false }: { dryRun: boolean }) => {
  const destinationDirs: { [key: string]: string } = {
    pictureDir: path.join(dir, 'pictures'),
    videoDir: path.join(dir, 'videos'),
    audioDir: path.join(dir, 'audio'),
    zipDir: path.join(dir, 'zips'),
    otherDir: path.join(dir, 'other'),
  };
  const filePaths = await getAllFilePaths(dir, Object.values(destinationDirs));
  const fileDestinations: { [key: string]: string[] } = {
    pictureDir: [],
    videoDir: [],
    audioDir: [],
    zipDir: [],
    otherDir: [],
  };
  filePaths.map((filePath) => {
    const ext = path.extname(filePath);
    const foundLookup = directoryLookup.find(([key, value]) => value.includes(ext));
    const destDir = foundLookup ? foundLookup[0] : 'otherDir';
    fileDestinations[destDir].push(filePath);
  });

  const moveToDestination = async (filePath: string, dest: string) => {
    const destinationPath = path.join(dest, path.basename(filePath));
    if (destinationPath === filePath) return;
    console.log(`moving ${filePath} --> ${destinationPath}`);
    if (dryRun) return;
    return moveFile(filePath, destinationPath);
  };
  const movePromises = Object.entries(fileDestinations)
    .filter(([key, value]) => value.length)
    .map(async ([key, value]) => {
      const dest = destinationDirs[key];
      await fs.ensureDir(dest);
      await Promise.all(value.map((filePath) => moveToDestination(filePath, dest)));
    });
  await Promise.all(movePromises);
  await removeEmptyDirs(dir);
};

program
  .description('Split files in a directory to their respective types')
  .command('dir <directoryPath>')
  .option('--dry-run', 'Show what would be done without doing it')
  .action(splitMedia)
  .parse();
