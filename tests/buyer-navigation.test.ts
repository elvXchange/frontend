import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buyerPagePath } from '../src/features/auctions/buyer-navigation';
import { operationsForUser } from '../src/features/workflow/operation-pages';

test('buyers can open Events, auction details and their Profile', () => {
  for (const path of [
    '/profile',
    '/events/live-auctions',
    '/events/upcoming-auctions',
    '/events/closed-auctions',
    '/events/live-auction-details/19d0ac5a-adaa-4cbf-b9d7-b0e07c6b414c',
    '/events/upcoming-auction-details/19d0ac5a-adaa-4cbf-b9d7-b0e07c6b414c',
    '/events/closed-auction-details/19d0ac5a-adaa-4cbf-b9d7-b0e07c6b414c',
  ])
    assert.equal(buyerPagePath(path), path);
});

test('buyer bookmarks and direct links cannot reopen other UI sections', () => {
  for (const path of [
    '',
    '/workflow',
    '/workflow/results',
    '/workflow/payment-mis',
    '/workflow/rsd-limits',
    '/events/watchlist',
    '/events/my-results',
    '/events/link-images',
    '/users/all',
    '/operations/import-rsd',
    '/operations/schedule-auctions',
    '/batch-schedule',
    '/profile/another-user',
  ])
    assert.equal(buyerPagePath(path), '/events/live-auctions');
  assert.deepEqual(
    operationsForUser({
      role: 'BUYER',
      permissions: ['events', 'settings', 'finance'],
    }),
    [],
  );
});
