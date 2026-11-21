export function buyerPagePath(path: string) {
  if (
    path === '/profile' ||
    /^\/events\/(live|upcoming|closed)-auctions$/.test(path) ||
    /^\/events\/(live|upcoming|closed)-auction-details\/[a-f0-9-]+$/i.test(path)
  )
    return path;
  return '/events/live-auctions';
}
