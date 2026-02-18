import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from './load-ts-module.mjs';

async function getResolver() {
  const mod = await loadTsModule('src/lib/model-display.ts');
  return mod.getModelDisplay;
}

test('prefers runtime model when present and labels as active runtime', async () => {
  const getModelDisplay = await getResolver();
  const display = getModelDisplay({
    configuredModel: 'claude-sonnet-4-5',
    runtimeModel: 'openai-codex/gpt-5.3-codex',
  });

  assert.deepEqual(display, {
    model: 'openai-codex/gpt-5.3-codex',
    sourceLabel: 'active runtime',
    isFallback: false,
  });
});

test('falls back to configured model and labels it clearly', async () => {
  const getModelDisplay = await getResolver();
  const display = getModelDisplay({
    configuredModel: 'claude-sonnet-4-5',
  });

  assert.deepEqual(display, {
    model: 'claude-sonnet-4-5',
    sourceLabel: 'configured',
    isFallback: true,
  });
});

test('returns null when no runtime or configured model is available', async () => {
  const getModelDisplay = await getResolver();
  const display = getModelDisplay({});

  assert.equal(display, null);
});
