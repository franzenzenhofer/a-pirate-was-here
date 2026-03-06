import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

function readGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'nogit';
  }
}

const iso = new Date().toISOString();
const stamp = iso.replace(/[-:TZ.]/g, '').slice(0, 14);
const sha = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7)
  ?? process.env.GITHUB_SHA?.slice(0, 7)
  ?? readGitSha();
const version = `${stamp}-${sha}`;

mkdirSync('src/generated', { recursive: true });
mkdirSync('public', { recursive: true });

writeFileSync(
  'src/generated/build-version.ts',
  [
    `export const BUILD_VERSION = '${version}';`,
    `export const BUILD_TIMESTAMP = '${iso}';`,
    `export const BUILD_SHA = '${sha}';`,
    '',
  ].join('\n'),
);

writeFileSync(
  'public/version.json',
  JSON.stringify({ version, timestamp: iso, sha }, null, 2) + '\n',
);

console.log(`Build version: ${version}`);
