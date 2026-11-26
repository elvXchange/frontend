import assert from 'node:assert/strict';
import test from 'node:test';
import { api } from '../src/shared/api';
test('concurrent middleware rejections share refresh and each retry once', async (t) => {
  let refreshes = 0,
    requests = 0;
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url.endsWith('/refresh')) {
      refreshes++;
      await new Promise((r) => setTimeout(r, 5));
      return Response.json({ ok: true });
    }
    requests++;
    return requests <= 2
      ? Response.json(
          { error: 'expired' },
          { status: 401, headers: { 'X-Auth-Renew': '1' } },
        )
      : Response.json({ ok: true });
  });
  await Promise.all([api('/bids', 'POST', { amount: 1 }), api('/auctions')]);
  assert.equal(refreshes, 1);
  assert.equal(requests, 4);
});
test('business rejection and temporary outage never replay a mutation', async (t) => {
  for (const status of [401, 403, 503]) {
    const fetch = t.mock.method(globalThis, 'fetch', async () =>
      Response.json({ error: 'failed' }, { status }),
    );
    await assert.rejects(api('/bids', 'POST', {}), /failed/);
    assert.equal(fetch.mock.callCount(), 1);
    fetch.mock.restore();
  }
});
