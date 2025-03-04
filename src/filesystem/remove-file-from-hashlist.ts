import path from 'path';
import fs from 'fs-extra';
import { Command } from 'commander';
import { generateHashFromFile } from './lib/index.js';

const program = new Command();

program
  .command('file <filepPath>')
  .requiredOption('--hash-file <string>', 'hash file')
  .action(async (filePath: string, { hashFile }: { hashFile: string }) => {
    console.log(filePath, hashFile);
    const fileHash = await generateHashFromFile(filePath);
    try {
      const hashList = await fs.readJSON(hashFile);
      if (hashList?.length && hashList.includes(fileHash)) {
        const reducedHashList = hashList.filter(
          (hash: string) => hash !== fileHash,
        );
        await fs.writeJSON(hashFile, reducedHashList);
        console.log('successfully removed hash');
      }
      await fs.remove(filePath);
      console.log('removed file');
    } catch (err) {
      console.error(err);
    }
  })
  .parse();
