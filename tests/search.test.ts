import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  closedSearch,
  closedFields,
  archiveSince,
} from '../src/features/auctions/search';

test('closed search has seven fields; make/model/variant matches each field separately', () => {
  const a = {
    auction_number: 120,
    title: 'Demo CUG',
    search_vehicles: [
      {
        registration: 'TEST123',
        make: 'Demo',
        model: 'Swift',
        variant: 'VXI',
        loan_account_no: 'LAN-77',
        contact_name: 'Example Contact',
        contact_number: '000123',
      },
    ],
  };
  assert.equal(Object.keys(closedFields).length, 7);
  for (const [key, value] of Object.entries({
    auction_number: '12',
    title: 'cug',
    registration: 'test',
    make_model_variant: 'swift',
    loan_account_no: '77',
    contact_name: 'example',
    contact_number: '123',
  }))
    assert.equal(closedSearch(a, key, value), true);
  assert.equal(closedSearch(a, 'make_model_variant', 'Demo Swift'), false);
  assert.equal(closedSearch(a, 'registration', 'LAN-77'), false);
});
test('archive calendar boundaries use India business time', () => {
  const now = Date.parse('2026-09-30T18:40:00Z');
  assert.equal(
    new Date(archiveSince('quarter', now)).toISOString(),
    '2026-09-30T18:30:00.000Z',
  );
  assert.equal(
    new Date(archiveSince('year', now)).toISOString(),
    '2025-12-31T18:30:00.000Z',
  );
  assert.equal(archiveSince('all', now), 0);
});
