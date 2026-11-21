import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  operationPages,
  operationPath,
  operationFromPath,
  operationsForUser,
} from '../src/features/workflow/operation-pages';
import { userGroups } from '../src/features/users/user-groups';

test('Operations contains exactly the requested pages, each with a restorable URL', () => {
  const labels = [
    'Schedule Auctions',
    'Link Images',
    'Locations',
    'Sellers',
    'Category',
    'Import RSD',
    'Import Adjustments',
    'Import Credit Limit',
    'Blocked PANs',
    'Activity Logs',
    'Calling Master',
  ];
  assert.deepEqual(
    operationPages.map(([label]) => label),
    labels,
  );
  assert.deepEqual(
    operationsForUser({ role: 'ADMIN' }).map(([label]) => label),
    labels,
  );
  assert.equal(new Set(labels.map(operationPath)).size, labels.length);
  for (const label of labels)
    assert.equal(operationFromPath(operationPath(label)), label);
  assert.equal(operationFromPath('/operations/unknown'), undefined);
  assert.equal(operationFromPath('/workflow/results'), undefined);
  assert.ok(
    !userGroups.some(([, label]) => (label as string) === 'Blocked PANs'),
  );
});

test('Operations navigation preserves existing role permissions', () => {
  assert.deepEqual(
    operationsForUser({
      role: 'AUCTION_MANAGER',
      permissions: ['events', 'results', 'payments', 'bulk'],
    }).map(([label]) => label),
    ['Schedule Auctions', 'Link Images'],
  );
  assert.deepEqual(
    operationsForUser({ role: 'ZONAL_MANAGER', permissions: ['finance'] }).map(
      ([label]) => label,
    ),
    ['Import RSD', 'Import Adjustments', 'Import Credit Limit'],
  );
  assert.deepEqual(operationsForUser({ role: 'BUYER' }), []);
});
