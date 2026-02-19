import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import ts from 'typescript';

export async function loadTsModule(tsPath) {
  const source = await readFile(tsPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: tsPath,
  });

  const outPath = join(tmpdir(), `${basename(tsPath, '.ts')}-${Date.now()}.mjs`);
  await writeFile(outPath, transpiled.outputText, 'utf8');
  return import(pathToFileURL(outPath).href);
}
