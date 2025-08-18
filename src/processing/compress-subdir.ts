import { Command } from 'commander';
import { promises as fs } from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

function executeCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        console.error(stderr);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

async function findLeafDirectories(dirPath: string): Promise<string[]> {
  const leafDirs: string[] = [];

  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return [];
    }
  } catch (err) {
    console.error(`Error: Directory not found at ${dirPath}`);
    return [];
  }

  const traverse = async (currentPath: string) => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const subdirs = entries.filter((dirent) => dirent.isDirectory());

    if (subdirs.length === 0) {
      leafDirs.push(currentPath);
    } else {
      for (const subdir of subdirs) {
        await traverse(path.join(currentPath, subdir.name));
      }
    }
  };

  await traverse(dirPath);
  return leafDirs;
}

const program = new Command();
program
  .name('compress-directories')
  .description('Recursively finds and compresses leaf directories using 7zip.')
  .argument('<directory>', 'The root directory to start the search from.')
  .option('-d, --delete', 'Delete the original directory after successful compression.', false)
  .action(async (directory: string, options) => {
    const dirToProcess = path.resolve(directory);
    const shouldDelete = options.delete;

    console.log(`Searching for leaf directories in: ${dirToProcess}`);
    console.log(`Deletion flag set to: ${shouldDelete}`);

    try {
      const leafDirectories = await findLeafDirectories(dirToProcess);

      if (leafDirectories.length === 0) {
        console.log('No leaf directories found. Exiting.');
        return;
      }

      console.log(`Found ${leafDirectories.length} leaf directorie(s) to compress.`);

      for (const leafDir of leafDirectories) {
        const parentDir = path.dirname(leafDir);
        const dirName = path.basename(leafDir);
        const archiveName = `${dirName}.7z`;
        const archivePath = path.join(parentDir, archiveName);

        console.log(`\nCompressing "${dirName}"...`);
        const compressCommand = `7z a -t7z "${archivePath}" "${leafDir}"`;
        await executeCommand(compressCommand);

        console.log(`Successfully compressed to: ${archivePath}`);

        if (shouldDelete) {
          console.log(`Deleting original directory: "${leafDir}"...`);
          await fs.rm(leafDir, { recursive: true, force: true });
          console.log(`Successfully deleted "${leafDir}".`);
        }
      }

      console.log('\nAll leaf directories have been processed.');
    } catch (error) {
      console.error('An error occurred during processing:');
      console.error(error);
    }
  });

program.parse(process.argv);
