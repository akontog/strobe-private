const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const distLabsRoot = path.join(__dirname, '..', 'client', 'dist', 'labs');
const keepFile = (name) => name.endsWith('.bundle.js') || name.endsWith('.bundle.css');

function clearOneDriveAttributes(targetPath) {
  try {
    execFileSync('attrib', ['-U', '-P', targetPath], { stdio: 'ignore' });
  } catch {
  }
}

function pruneDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      pruneDirectory(fullPath);
      const remaining = fs.existsSync(fullPath) ? fs.readdirSync(fullPath) : [];
      if (remaining.length === 0) {
        clearOneDriveAttributes(fullPath);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
      continue;
    }

    if (!keepFile(entry.name)) {
      clearOneDriveAttributes(fullPath);
      fs.rmSync(fullPath, { force: true });
    }
  }
}

pruneDirectory(distLabsRoot);
