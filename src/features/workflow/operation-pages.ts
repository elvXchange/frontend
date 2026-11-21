import type { User } from '../../shared/components/shared';

export const operationPages = [
  ['Schedule Auctions', 'schedule-auctions', 'events'],
  ['Link Images', 'link-images', 'events'],
  ['Locations', 'locations', 'settings'],
  ['Sellers', 'sellers', 'settings'],
  ['Category', 'category', 'settings'],
  ['Import RSD', 'import-rsd', 'finance'],
  ['Import Adjustments', 'import-adjustments', 'finance'],
  ['Import Credit Limit', 'import-credit-limit', 'finance'],
  ['Blocked PANs', 'blocked-pans', 'settings'],
  ['Activity Logs', 'activity-logs', 'settings'],
  ['Calling Master', 'calling-master', 'settings'],
] as const;

export const operationsForUser = (user: Pick<User, 'role' | 'permissions'>) =>
  operationPages.filter(
    ([, , permission]) =>
      user.role !== 'BUYER' &&
      (user.role === 'ADMIN' || user.permissions?.includes(permission)),
  );

export function operationPath(page: string) {
  return (
    '/operations/' +
    (operationPages.find(([name]) => name === page)?.[1] || 'schedule-auctions')
  );
}

export function operationFromPath(path: string) {
  return operationPages.find(([, slug]) => path === '/operations/' + slug)?.[0];
}
