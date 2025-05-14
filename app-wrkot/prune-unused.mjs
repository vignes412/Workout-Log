import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function pruneUnusedSrcFiles() {
  try {
    // Run unimported to find unused files in src/
    const output = execSync('npx unimported --show-unused-files', { encoding: 'utf-8' });

    // Extract unused .ts and .tsx files in src/
    const unusedFiles = output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.endsWith('.ts') || line.endsWith('.tsx')) // Only .ts and .tsx files
      .filter(line => line.startsWith('src/')); // Only files in src/

    if (unusedFiles.length === 0) {
      console.log('No unused files found in src/.');
      return;
    }

    console.log('Unused files in src/:', unusedFiles);

    // Delete each unused file
    unusedFiles.forEach(file => {
      const filePath = path.resolve(file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${filePath}`);
      } else {
        console.log(`File not found: ${filePath}`);
      }
    });

    console.log('Unused files in src/ pruned successfully.');
  } catch (error) {
    console.error('Error pruning unused files in src/:', error.message);
  }
}

pruneUnusedSrcFiles();