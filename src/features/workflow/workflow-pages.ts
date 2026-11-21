import type { User } from '../../shared/components/shared';

type WorkflowUser = Pick<User, 'role' | 'permissions'>;

const pages = [
  ['Results', 'results'],
  ['Payment MIS', 'payment-mis'],
  ['RSD & Limits', 'rsd-limits'],
  ['Reports', 'reports'],
  ['Bulk Operations', 'bulk-operations'],
  ['Insurers', 'insurers'],
  ['Notifications', 'notifications'],
] as const;

export const workflowSections = (user: WorkflowUser) =>
  user.role !== 'BUYER'
    ? [
        'Results',
        ...(user.role === 'ADMIN' || user.permissions?.includes('payments')
          ? ['Payment MIS']
          : []),
        ...(user.role === 'ADMIN' || user.permissions?.includes('finance')
          ? ['RSD & Limits']
          : []),
        'Reports',
        ...(user.role === 'ADMIN' || user.permissions?.includes('bulk')
          ? ['Bulk Operations']
          : []),
        ...(user.role === 'ADMIN' ? ['Insurers', 'Notifications'] : []),
      ]
    : ['Results', 'Payment MIS', 'RSD & Limits'];

export function workflowPagePath(page: string) {
  return (
    '/workflow/' + (pages.find(([label]) => label === page)?.[1] || 'results')
  );
}

export function workflowPageFromPath(path: string, user: WorkflowUser) {
  if (path === '/workflow') return 'Results';
  const page = pages.find(([, slug]) => path === '/workflow/' + slug)?.[0];
  if (page) return workflowSections(user).includes(page) ? page : 'Results';
}
