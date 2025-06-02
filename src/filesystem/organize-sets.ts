import path from 'path';
import fs from 'fs-extra';
import { Command } from 'commander';

const program = new Command();

program.command('directory <dir>')