import * as fs from 'fs';
import * as path from 'path';

// Usage: node separate-sub-caps.js <directoryPath> <insertString>
const [,, directoryPath, insertString] = process.argv;

if (!directoryPath || !insertString) {
  console.error('Usage: node separate-sub-caps.js <directoryPath> <insertString>');
  process.exit(1);
}

function separateSubCaps(name: string, insert: string): string {
  // Replace any lowercase letter followed by uppercase with lowercase + insert + uppercase
  return name.replace(/([a-z])([A-Z])/g, `$1${insert}$2`);
}

fs.readdir(directoryPath, { withFileTypes: true }, (err, entries) => {
  if (err) {
    console.error('Error reading directory:', err);
    process.exit(1);
  }

  entries.forEach(entry => {
    if (entry.isDirectory()) {
      const oldName = entry.name;
      const newName = separateSubCaps(oldName, insertString);

      if (oldName !== newName) {
        const oldPath = path.join(directoryPath, oldName);
        const newPath = path.join(directoryPath, newName);

        fs.rename(oldPath, newPath, renameErr => {
          if (renameErr) {
            console.error(`Failed to rename ${oldName} to ${newName}:`, renameErr);
          } else {
            console.log(`Renamed ${oldName} -> ${newName}`);
          }
        });
      }
    }
  });
});