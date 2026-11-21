import type { User } from '../../shared/components/shared';

export const userGroups = [
  ['UNVERIFIED', 'Unverified Users'],
  ['VERIFIED', 'Verified Users'],
  ['TRAINED', 'Trained Users'],
  ['BLOCKED', 'Blocked Users'],
  ['SSB', 'SSB'],
  ['ASB', 'ASB'],
  ['REJECTED', 'Rejected Users'],
  ['ADMIN', 'Admin Users'],
  ['ALL', 'All Users'],
] as const;

export function userGroupPath(group: string) {
  const key = userGroups.find(([key]) => key === group)?.[0] || 'ALL';
  return '/users/' + key.toLowerCase().replaceAll('_', '-');
}

export function userGroupFromPath(path: string) {
  if (path === '/users') return 'ALL';
  return userGroups.find(([key]) => userGroupPath(key) === path)?.[0];
}

export function matchesUserGroup(
  user: Pick<User, 'role' | 'status'>,
  group: string,
) {
  return (
    group === 'ALL' ||
    user.role === group ||
    user.status === group ||
    (group === 'TRAINED' &&
      user.role === 'BUYER' &&
      user.status === 'ACTIVE') ||
    (group === 'UNVERIFIED' && user.status === 'PENDING')
  );
}
