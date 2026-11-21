import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  workflowPagePath,
  workflowPageFromPath,
  workflowSections,
} from '../src/features/workflow/workflow-pages';

test('every Operations dropdown option has a distinct restorable page', () => {
  const admin = { role: 'ADMIN' } as const;
  const sections = workflowSections(admin);
  assert.equal(sections.length, 7);
  assert.equal(new Set(sections.map(workflowPagePath)).size, sections.length);
  for (const section of sections)
    assert.equal(
      workflowPageFromPath(workflowPagePath(section), admin),
      section,
    );
  assert.equal(workflowPageFromPath('/workflow', admin), 'Results');
  assert.equal(
    workflowPageFromPath('/workflow/payment-mis', admin),
    'Payment MIS',
  );
  assert.equal(
    workflowPageFromPath('/workflow/rsd-limits', admin),
    'RSD & Limits',
  );
  assert.equal(workflowPageFromPath('/workflow/missing', admin), undefined);
  assert.equal(workflowPageFromPath('/users/all', admin), undefined);
});

test('direct Operations links respect staff permissions and preserve buyer sections', () => {
  const staff = {
    role: 'AUCTION_MANAGER',
    permissions: ['payments', 'bulk'],
  } as const;
  const user = { ...staff, permissions: [...staff.permissions] };
  assert.deepEqual(workflowSections(user), [
    'Results',
    'Payment MIS',
    'Reports',
    'Bulk Operations',
  ]);
  assert.equal(
    workflowPageFromPath('/workflow/payment-mis', user),
    'Payment MIS',
  );
  for (const path of ['rsd-limits', 'insurers', 'notifications'])
    assert.equal(workflowPageFromPath('/workflow/' + path, user), 'Results');
  const buyer = { role: 'BUYER' } as const;
  assert.deepEqual(workflowSections(buyer), [
    'Results',
    'Payment MIS',
    'RSD & Limits',
  ]);
  assert.equal(
    workflowPageFromPath('/workflow/rsd-limits', buyer),
    'RSD & Limits',
  );
  assert.equal(workflowPageFromPath('/workflow/reports', buyer), 'Results');
});
