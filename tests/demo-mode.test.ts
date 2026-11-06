import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('Vite demo mode isolates API requests and assets; production mode retains transport', async () => {
  const original = globalThis.fetch;
  try {
    for (const mode of ['production', 'demo']) {
      const server = await createServer({
        configFile: false,
        mode,
        appType: 'custom',
        optimizeDeps: { noDiscovery: true, include: [] },
        server: { middlewareMode: true, hmr: false, watch: null },
      });
      try {
        let requests = 0;
        globalThis.fetch = async (input) => {
          requests++;
          assert.equal(input, '/api/auth/me');
          return new Response(JSON.stringify({ role: 'REAL_API_RESPONSE' }));
        };
        const { api } = await server.ssrLoadModule(
          '/src/shared/components/shared.tsx',
        );
        const { DEMO_MODE, assetUrl } =
          await server.ssrLoadModule('/src/demo/mode.ts');
        assert.equal(DEMO_MODE, mode === 'demo');
        if (mode === 'demo') {
          const { selectDemoUser } =
            await server.ssrLoadModule('/src/demo/data.ts');
          selectDemoUser('BUYER');
          assert.equal((await api('/auth/me')).role, 'BUYER');
          assert.ok((await api('/auctions')).auctions.length);
          await assert.rejects(
            api('/lots/example/bids', 'POST', { amount: 1 }),
            /Demo only/,
          );
          assert.equal(requests, 0);
          assert.equal(
            assetUrl('/api/files/demo-image-vehicle'),
            '/demo/vehicle.svg',
          );
          assert.equal(
            assetUrl('/api/inventory/template'),
            '/demo/document.html',
          );
          assert.equal(
            assetUrl('https://demo.invalid/valuation'),
            '/demo/document.html',
          );
        } else {
          assert.equal((await api('/auth/me')).role, 'REAL_API_RESPONSE');
          assert.equal(requests, 1);
          assert.equal(assetUrl('/api/files/private'), '/api/files/private');
        }
      } finally {
        await server.close();
      }
    }
  } finally {
    globalThis.fetch = original;
  }
});
