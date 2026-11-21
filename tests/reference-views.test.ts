import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  closedVehicleViews,
  initialVehicleView,
  matchesVehicleView,
} from '../src/features/auctions/search';
import {
  userGroups,
  matchesUserGroup,
  userGroupPath,
  userGroupFromPath,
} from '../src/features/users/user-groups';

test('reference closed views group no-bid and rejected results without including approvals', () => {
  const lot = {
    status: 'CLOSED',
    result_status: 'UNSOLD',
    bid_count: 0,
    own_bid_count: 0,
  };
  assert.deepEqual(
    closedVehicleViews.map(([key]) => key),
    ['APPROVED', 'NO_BIDS_REJECTED', 'CANCELLED', 'PENDING'],
  );
  assert.equal(matchesVehicleView(lot, 'NO_BIDS_REJECTED', true), true);
  assert.equal(
    matchesVehicleView(
      { ...lot, result_status: 'REJECTED', bid_count: 3 },
      'NO_BIDS_REJECTED',
      true,
    ),
    true,
  );
  for (const result_status of ['APPROVED', 'PENDING', 'CANCELLED']) {
    assert.equal(
      matchesVehicleView({ ...lot, result_status }, 'NO_BIDS_REJECTED', true),
      false,
    );
  }
});

test('buyer closed views use their own bids; staff views use all bids', () => {
  const lot = { status: 'CLOSED', bid_count: 5, own_bid_count: 0 };
  assert.equal(matchesVehicleView(lot, 'WITH_BIDS', true), true);
  assert.equal(matchesVehicleView(lot, 'WITH_BIDS', false), false);
  assert.equal(matchesVehicleView(lot, 'WITHOUT_BIDS', false), true);
  assert.equal(
    matchesVehicleView({ ...lot, status: 'OPEN' }, 'WITHOUT_BIDS', false),
    false,
  );
  assert.equal(initialVehicleView('CLOSED', true), 'APPROVED');
  assert.equal(initialVehicleView('CLOSED', false), 'WITH_BIDS');
  assert.equal(initialVehicleView('UPCOMING', true), 'ALL');
  assert.equal(initialVehicleView('LIVE', false), 'OPEN');
});

test('user groups preserve legacy local accounts and keep staff out of trained buyers', () => {
  assert.ok(userGroups.some(([key]) => key === 'SSB'));
  assert.ok(userGroups.some(([key]) => key === 'ASB'));
  assert.equal(
    matchesUserGroup({ role: 'BUYER', status: 'PENDING' }, 'UNVERIFIED'),
    true,
  );
  assert.equal(
    matchesUserGroup({ role: 'BUYER', status: 'UNVERIFIED' }, 'UNVERIFIED'),
    true,
  );
  assert.equal(
    matchesUserGroup({ role: 'BUYER', status: 'ACTIVE' }, 'TRAINED'),
    true,
  );
  assert.equal(
    matchesUserGroup({ role: 'ADMIN', status: 'ACTIVE' }, 'TRAINED'),
    false,
  );
  assert.equal(
    matchesUserGroup({ role: 'BUYER', status: 'BLOCKED' }, 'TRAINED'),
    false,
  );
  assert.equal(
    matchesUserGroup({ role: 'ADMIN', status: 'ACTIVE' }, 'ADMIN'),
    true,
  );
});

test('each Users dropdown option has a distinct restorable page', () => {
  const paths = userGroups.map(([key]) => userGroupPath(key));
  assert.equal(new Set(paths).size, userGroups.length);
  for (const [key] of userGroups)
    assert.equal(userGroupFromPath(userGroupPath(key)), key);
  assert.equal(userGroupFromPath('/users'), 'ALL');
  assert.equal(userGroupFromPath('/users/blocked-pan'), undefined);
  assert.equal(userGroupFromPath('/users/not-a-group'), undefined);
  assert.equal(userGroupFromPath('/events/live-auctions'), undefined);
});
