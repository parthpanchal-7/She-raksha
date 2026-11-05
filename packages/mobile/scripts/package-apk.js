#!/usr/bin/env node
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.resolve(__dirname, 'build_apk.py');

try {
  execSync(`python "${scriptPath}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('[She-Raksha APK Packager] Build failed:', error);
  process.exit(1);
}
