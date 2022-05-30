import fs from 'fs';
import path from 'path';
import babel from '@babel/cli/lib/babel/dir.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXT_ESM = '.js';
const EXT_CJS = '.js';
async function buildBabel (dir, type) {
  const outDir = path.join(process.cwd(), `build/${type === 'esm' ? 'esm' : 'cjs'}`);

  await babel.default({
    babelOptions: {
      configFile: type === 'esm'
        ? path.join(__dirname, './config/esm.mjs')
        : path.join(__dirname, './config/cjs.mjs')
    },
    cliOptions: {
      extensions: ['.ts', '.tsx'],
      filenames: ['src'],
      ignore: '**/*.d.ts',
      outDir,
      outFileExtension: type === 'esm' ? EXT_ESM : EXT_CJS
    }
  });
}

async function buildJs (dir) {
  const json = JSON.parse(fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf-8'));
  // const { name, version } = json;

  await buildBabel(dir, 'cjs');
  await buildBabel(dir, 'esm');
}

async function main () {
  process.chdir('packages');
  // get dirs
  const dirs = fs
    .readdirSync('.')
    .filter((dir) => fs.statSync(dir).isDirectory() && fs.existsSync(path.join(process.cwd(), dir, 'src')));
  // build packages
  for (const dir of dirs) {
    process.chdir(dir);

    await buildJs(dir);

    process.chdir('..');
  }
}

await main();
