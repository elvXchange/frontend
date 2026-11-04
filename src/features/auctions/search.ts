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
