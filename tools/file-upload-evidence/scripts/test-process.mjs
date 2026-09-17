import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

function isJavaScriptEntry(path) {
  return ['.js', '.cjs', '.mjs'].includes(extname(path).toLowerCase());
}

export function pnpmInvocation(args) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    return isJavaScriptEntry(npmExecPath)
      ? { command: process.execPath, args: [npmExecPath, ...args] }
      : { command: npmExecPath, args };
  }

  return { command: 'pnpm', args };
}

export function wranglerInvocation(args) {
  const packageRoot = resolve(import.meta.dirname, '../../..', 'node_modules/wrangler');
  const packageManifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  const entry =
    typeof packageManifest.bin === 'string' ? packageManifest.bin : packageManifest.bin?.wrangler;
  if (typeof entry !== 'string' || !isJavaScriptEntry(entry)) {
    throw new Error('wrangler package must expose a JavaScript CLI entry');
  }

  return { command: process.execPath, args: [resolve(packageRoot, entry), ...args] };
}

export function posixShell() {
  if (process.platform !== 'win32') return '/bin/sh';

  for (const path of [
    join(process.env.ProgramFiles ?? '', 'Git', 'usr', 'bin', 'sh.exe'),
    join(process.env['ProgramFiles(x86)'] ?? '', 'Git', 'usr', 'bin', 'sh.exe'),
  ]) {
    if (existsSync(path)) return path;
  }

  throw new Error('Git for Windows POSIX shell is required to execute workflow shell snippets');
}
