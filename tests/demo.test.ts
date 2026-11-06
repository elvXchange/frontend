import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  demoApi,
  demoAuctions,
  demoLots,
  demoUsers,
  selectDemoUser,
} from '../src/demo/data';
import { assetUrl, DEMO_MODE, PREVIEW_MESSAGE } from '../src/demo/mode';
import type { Detail, User } from '../src/shared/components/shared';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

test('normal mode preserves backend asset URLs', () => {
  assert.equal(DEMO_MODE, false);
  assert.equal(assetUrl('/api/files/private'), '/api/files/private');
});

test('all eight demo roles have the existing permission sets and can sign out', async () => {
  assert.equal(demoUsers.length, 8);
  for (const user of demoUsers) {
    selectDemoUser(user.role);
    assert.equal((await demoApi<User>('/auth/me')).role, user.role);
    assert.equal(
      user.permissions?.includes('events'),
      ['ADMIN', 'AUCTION_MANAGER', 'UPLOAD_QC', 'INFO_QC'].includes(user.role),
    );
  }
  await demoApi('/auth/logout', 'POST');
  await assert.rejects(demoApi('/auth/me'), /Select a demo role/);
});

test('sample routes connect auctions, lots, results, documents and buyers without fetch', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error('Preview attempted a network request');
  };
  try {
    for (const auction of demoAuctions) {
      assert.match(auction.id, /^[a-f0-9-]+$/i);
      const detail = await demoApi<Detail>(`/auctions/${auction.id}`);
      assert.equal(detail.lots.length, auction.lot_count);
      assert.ok(Number.isFinite(Date.parse(detail.serverTime)));
      for (const lot of detail.lots) {
        const result = await demoApi<{
          lot: { id: string };
          history: unknown[];
          bidders: unknown[];
        }>(`/workflow/lots/${lot.id}`);
        assert.equal(result.lot.id, lot.id);
        assert.ok(result.history.length);
        assert.ok(Number.isInteger(lot.starting_price));
      }
      assert.ok(
        (await demoApi<unknown[]>(`/auctions/${auction.id}/participants`))
          .length,
      );
    }
    for (const route of [
      '/public/auctions',
      '/users',
      '/blocks',
      '/blocked-pan',
      '/buyer-lots?mode=watchlist',
      '/buyer-lots?mode=results',
      '/workflow/lots',
      '/workflow/finance',
      '/workflow/buyers',
      '/workflow/insurers',
      '/workflow/notifications',
      '/files?owner=lot&id=sample',
      '/files?owner=user&id=sample',
    ]) {
      assert.ok(await demoApi(route), route);
    }
    for (const user of demoUsers)
      assert.ok(await demoApi(`/users/${user.id}/details`));
    assert.ok(demoLots.some((l) => l.won));
    assert.ok(demoLots.some((l) => l.status === 'OPEN'));
    const result = await demoApi<Detail>(`/auctions/${demoAuctions[0].id}`);
    result.lots[0].make = 'Changed by caller';
    assert.notEqual(
      (await demoApi<Detail>(`/auctions/${demoAuctions[0].id}`)).lots[0].make,
      'Changed by caller',
    );
  } finally {
    globalThis.fetch = original;
  }
});

test('preview rejects writes and unknown reads while allowing sample inventory inspection', async () => {
  for (const [route, method] of [
    ['/lots/sample/bids', 'POST'],
    ['/users/sample', 'PUT'],
    ['/workflow/images/sample', 'DELETE'],
    ['/auth/login', 'POST'],
    ['/workflow/schedule', 'POST'],
  ]) {
    await assert.rejects(demoApi(route, method), { message: PREVIEW_MESSAGE });
  }
  assert.ok((await demoApi<unknown[]>('/inventory/preview', 'POST')).length);
  assert.ok(
    (await demoApi<unknown[]>('/workflow/grouped-inventory/preview', 'POST'))
      .length,
  );
  await assert.rejects(demoApi('/not-implemented'), /unavailable/);
});

test('all direct API image and document URLs use the mode-aware asset helper', () => {
  function inspect(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (file.endsWith('.tsx')) {
        const source = readFileSync(file, 'utf8');
        assert.doesNotMatch(
          source,
          /(?:href|src)=(?:["']\/api|\{\s*[`"']\/api)/,
          file,
        );
      }
    }
  }
  inspect(join(process.cwd(), 'src'));
});
