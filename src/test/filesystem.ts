import * as chai from 'chai';
import * as filesystem from '../filesystem/lib/index.js';
import fs from 'fs-extra';
import path from 'path';
import { randomUUID } from 'crypto';

const TEMP_DIR = path.join(process.cwd(), 'temp');

describe('filesystem', () => {
  before(async () => {
    await fs.ensureDir(TEMP_DIR);
    await fs.emptyDir
  });
  it.skip('should get all file paths', async () => {
    const paths = await filesystem.getAllFilePaths('./src');
    chai.expect(paths).to.be.an('array').and.be.not.empty;
  });
  it.skip('should return an object with files and directories', async () => {
    const outcome = await filesystem.getDirContentPaths('./src');
    chai.expect(outcome.files).to.be.an('array');
    chai.expect(outcome.directories).to.be.an('array');
  });
  it('should remove nested folder if name is the same', async () => {
    const dirname = randomUUID();
    const dirPath = path.join(TEMP_DIR, dirname, dirname);
    await fs.ensureDir(dirPath);
    const oldFilePath = path.join(dirPath, 'test.txt');
    const expectedFilePath = path.join(TEMP_DIR, dirname, 'test.txt');

    await fs.createFile(oldFilePath);
    await filesystem.findDuplicateNestedDir(TEMP_DIR, true);
    chai.expect(await fs.exists(dirPath)).be.false;
    chai.expect(await fs.exists(expectedFilePath)).be.true;
  });
  after(async () => await fs.emptyDir(TEMP_DIR));
});
