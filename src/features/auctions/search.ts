import type { Lot } from '../../shared/components/shared';

export const closedVehicleViews = [
  ['APPROVED', 'Approved Vehicles'],
  ['NO_BIDS_REJECTED', 'No Bids/Reject'],
  ['CANCELLED', 'Cancelled Vehicles'],
  ['PENDING', 'Approval Pending'],
] as const;

export function initialVehicleView(status: string, isStaff: boolean) {
  if (status === 'LIVE') return 'OPEN';
  if (status === 'CLOSED') return isStaff ? 'APPROVED' : 'WITH_BIDS';
  return 'ALL';
}

export function matchesVehicleView(
  lot: Pick<Lot, 'status' | 'result_status' | 'bid_count' | 'own_bid_count'>,
  view: string,
  isStaff: boolean,
) {
  const bids = isStaff ? lot.bid_count : lot.own_bid_count;
  if (view === 'ALL') return true;
  if (view === 'NO_BIDS_REJECTED')
    return ['UNSOLD', 'REJECTED'].includes(lot.result_status || '');
  if (view === 'WITH_BIDS') return lot.status === 'CLOSED' && bids > 0;
  if (view === 'WITHOUT_BIDS') return lot.status === 'CLOSED' && bids === 0;
  if (view === 'OPEN' || view === 'CANCELLED') return lot.status === view;
  return (
    ['APPROVED', 'PENDING', 'REJECTED', 'UNSOLD', 'UNPICKED'].includes(view) &&
    lot.result_status === view
  );
}

export const closedFields = {
  auction_number: 'Auction ID',
  title: 'CUG / Auction Name',
  loan_account_no: 'LAN Number',
  registration: 'Registration Number',
  make_model_variant: 'Make / Model / Variant',
  contact_name: 'Contact Person',
  contact_number: 'Contact Number',
};
export function archiveSince(period: string, now: number) {
  if (period === 'all') return 0;
  const offset = 330 * 60000,
    india = new Date(now + offset),
    year = india.getUTCFullYear();
  return (
    Date.UTC(
      period === 'previous' ? year - 1 : year,
      period === 'quarter' ? Math.floor(india.getUTCMonth() / 3) * 3 : 0,
      1,
    ) - offset
  );
}
export function closedSearch(
  auction: {
    title: string;
    auction_number?: number;
    search_vehicles?: Record<string, unknown>[];
  },
  field: string,
  query: string,
) {
  const contains = (value: unknown) =>
    String(value ?? '')
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  if (field === 'auction_number') return contains(auction.auction_number);
  if (field === 'title') return contains(auction.title);
  return (auction.search_vehicles || []).some((v) =>
    field === 'make_model_variant'
      ? [v.make, v.model, v.variant].some(contains)
      : contains(v[field]),
  );
}
