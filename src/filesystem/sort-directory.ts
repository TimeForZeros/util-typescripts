import * as fs from 'fs';
import * as path from 'path';

// Usage: node sort-directory.js <directoryPath> <splitPattern>
const [,, directoryPath, splitPattern] = process.argv;

if (!directoryPath || !splitPattern) {
  console.error('Usage: node sort-directory.js <directoryPath> <splitPattern>');
  process.exit(1);
}

function sortDirectories(baseDir: string, pattern: string) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const dirName = entry.name;
      const parts = dirName.split(pattern);

      if (parts.length < 2) {
        // Skip directories that don't match the pattern
        continue;
      }

      const parentDir = parts[0];
      const newDirName = parts[1]
      const targetParentPath = path.join(baseDir, parentDir);

      // Ensure parent directory exists
      if (!fs.existsSync(targetParentPath)) {
        fs.mkdirSync(targetParentPath);
      }

      const oldPath = path.join(baseDir, dirName);
      const newPath = path.join(targetParentPath, newDirName);

      // Move and rename the directory
      fs.renameSync(oldPath, newPath);
      console.log(`Moved "${dirName}" to "${parentDir}/${newDirName}"`);
    }
  }
}

sortDirectories(directoryPath, splitPattern);