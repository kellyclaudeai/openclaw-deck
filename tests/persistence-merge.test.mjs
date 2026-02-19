import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTsModule } from './load-ts-module.mjs';

async function getPersistenceModule() {
  return loadTsModule('src/lib/persistence.ts');
}

test('round-trips persisted snapshot through localStorage helpers', async () => {
  const mod = await getPersistenceModule();
  const storage = new Map();

  const snapshot = {
    version: 1,
    updatedAt: 1710000000000,
    agents: [
      {
        id: 'agent-1',
        name: 'Agent 1',
        icon: '1',
        accent: '#22d3ee',
        context: '',
      },
    ],
    columnOrder: ['agent-1'],
    drafts: { 'agent-1': 'draft message' },
    sessions: {
      'agent-1': {
        messages: [
          {
            id: 'm1',
            role: 'user',
            text: 'hello',
            timestamp: 1710000000001,
          },
        ],
        tokenCount: 5,
      },
    },
  };

  const ok = mod.writeSnapshotToLocalStorage(snapshot, {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  });

  assert.equal(ok, true);

  const loaded = mod.readSnapshotFromLocalStorage({
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  });

  assert.deepEqual(loaded, snapshot);
});

test('mergeChatMessages dedupes by id, runId, and timestamp signature', async () => {
  const mod = await getPersistenceModule();
  const merged = mod.mergeChatMessages(
    [
      { id: 'u1', role: 'user', text: 'prompt', timestamp: 10 },
      {
        id: 'a1',
        role: 'assistant',
        text: 'partial',
        timestamp: 11,
        runId: 'run-1',
        streaming: true,
      },
    ],
    [
      { id: 'u1', role: 'user', text: 'prompt', timestamp: 10 },
      {
        id: 'server-a',
        role: 'assistant',
        text: 'partial and complete',
        timestamp: 11,
        runId: 'run-1',
        streaming: false,
      },
      {
        role: 'assistant',
        text: 'same-by-ts',
        timestamp: 20,
      },
      {
        role: 'assistant',
        text: 'same-by-ts',
        timestamp: 20,
      },
    ]
  );

  assert.equal(merged.length, 3);
  assert.equal(merged[1].runId, 'run-1');
  assert.equal(merged[1].text, 'partial and complete');
  assert.equal(merged[1].streaming, false);
});

test('normalizeGatewayHistoryMessages handles common payload variants', async () => {
  const mod = await getPersistenceModule();

  const payload = {
    history: [
      {
        id: 'h1',
        role: 'user',
        content: [{ type: 'text', text: 'hello' }],
        createdAt: 100,
      },
      {
        role: 'assistant',
        text: 'world',
        timestamp: 101,
        runId: 'run-2',
      },
    ],
  };

  const messages = mod.normalizeGatewayHistoryMessages(payload);

  assert.equal(messages.length, 2);
  assert.equal(messages[0].text, 'hello');
  assert.equal(messages[1].runId, 'run-2');
});
