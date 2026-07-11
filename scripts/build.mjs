// AWS Distributed Load Testing 等、k6 のネイティブ TypeScript 実行に対応していない
// 実行環境向けに、tests/**/*.ts を単一の自己完結した JS ファイルへバンドルする。
// ローカル実行では k6 の native TypeScript support により、このビルドは不要。
import { build } from 'esbuild';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TESTS_DIR = 'tests';

function findTestEntries(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      entries.push(...findTestEntries(path));
    } else if (name.endsWith('.ts')) {
      entries.push(path);
    }
  }
  return entries;
}

const entryPoints = findTestEntries(TESTS_DIR);

if (entryPoints.length === 0) {
  console.error(`No test files found under ${TESTS_DIR}/`);
  process.exit(1);
}

await build({
  entryPoints,
  outdir: 'dist',
  outbase: '.',
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  external: ['k6', 'k6/*'],
  logLevel: 'info',
});

console.log(`Bundled ${entryPoints.length} test file(s) into dist/`);
