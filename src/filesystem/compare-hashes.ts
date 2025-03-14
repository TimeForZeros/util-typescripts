import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getAllFilePaths } from './lib/index.js';

const program = new Command();

program
  .command('compare <dirA> [dirB]')
  .action(async (dirA: string, dirB: string) => {
    const filePaths = await getAllFilePaths(dirA);
    if (dirB) {
      filePaths.push(...(await getAllFilePaths(dirB)));
    }
    const hashLookup: { [key: string]: string[] } = {};
    filePaths.forEach((filePath) => {
      const hash = filePath.match(/_hash-[0-9a-f]{8}/g);
      if (!hash) return;
      const hashKey = hash[0];
      if (!hashLookup[hashKey]) {
        hashLookup[hashKey] = [filePath];
      } else {
        hashLookup[hashKey].push(filePath);
      }
    });
    const dupeList: string[] = [];
    Object.entries(hashLookup)
      .filter((entry: [string, string[]]) => entry[1].length > 1)
      .map((entry) => dupeList.push(...entry[1].slice(1)));
    if (dupeList.length) {
      const results = await Promise.allSettled(dupeList.map((filePath) => fs.rm(filePath)));
      console.dir(results);
    } else {
      console.log('nothing to do');
    }
    console.log('done');
  })
  .parse();
