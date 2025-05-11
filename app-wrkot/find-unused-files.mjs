import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import readline from 'readline';

const SRC_DIR = './src';
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const ENTRY_POINTS = ['./src/index.ts', './src/index.tsx', './src/main.ts', './src/main.tsx', './src/App.tsx'];
const IGNORE_PATTERNS = ['test', 'spec', '__tests__', '__mocks__'];

// Helper to run a command and handle errors
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error && !stdout) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function findAllFiles() {
  const files = [];
  
  async function scanDir(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip test files and directories
      if (IGNORE_PATTERNS.some(pattern => fullPath.includes(pattern))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && EXTENSIONS.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDir(SRC_DIR);
  return files;
}

async function isFileImported(file, allFiles) {
  try {
    // Read the file content of all files to check if they import this file
    const fileContent = await fs.readFile(file, 'utf8');
    const fileName = path.basename(file, path.extname(file));
    
    // Check if this file exports anything that might be used
    const hasExports = /export\s+(default|const|function|class|interface|type|enum|let|var)/g.test(fileContent);
    if (!hasExports) {
      return false; // If file doesn't export anything, it's likely not imported
    }
    
    // Check if the file is referenced in any other file
    for (const otherFile of allFiles) {
      if (otherFile === file) continue;
      
      const otherContent = await fs.readFile(otherFile, 'utf8');
      
      // Check for various import patterns
      const importPatterns = [
        `from ['"].*${fileName}['"]`,         // Regular import
        `import\\(['"].*${fileName}['"]\\)`,  // Dynamic import
        `require\\(['"].*${fileName}['"]\\)`, // CommonJS require
        `path:\\s*['"].*${fileName}['"]`,     // Path references
      ];
      
      const regex = new RegExp(importPatterns.join('|'), 'g');
      if (regex.test(otherContent)) {
        return true;
      }
    }
    
    // Check if it's an entry point
    if (ENTRY_POINTS.some(entry => file.endsWith(entry.slice(1)))) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking imports for ${file}:`, error);
    return true; // If in doubt, assume it's used
  }
}

async function confirmDeletion(file) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`Delete ${file}? (y/n) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  console.log("Finding unused files in", SRC_DIR);
  
  try {
    // Check if TypeScript is installed
    try {
      await runCommand('npx tsc --version');
    } catch (error) {
      console.error("TypeScript is not installed. Please run 'npm install -D typescript'");
      return;
    }
    
    const allFiles = await findAllFiles();
    console.log(`Found ${allFiles.length} files to analyze`);
    
    const unusedFiles = [];
    
    console.log("Checking each file for imports (this may take a while)...");
    for (const file of allFiles) {
      if (!await isFileImported(file, allFiles)) {
        if (!file.includes('index.') && !file.endsWith('.d.ts')) {
          unusedFiles.push(file);
        }
      }
    }
    
    if (unusedFiles.length === 0) {
      console.log("No unused files found!");
      return;
    }
    
    console.log(`Found ${unusedFiles.length} potentially unused files:`);
    
    for (const file of unusedFiles) {
      console.log(`- ${file}`);
      
      const shouldDelete = await confirmDeletion(file);
      if (shouldDelete) {
        await fs.unlink(file);
        console.log(`  Deleted ${file}`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();