import type { Auction, Lot, User } from '../shared/components/shared';
import { PREVIEW_MESSAGE } from './mode';

const rights: Record<User['role'], string[]> = {
  ADMIN: [
    'events',
    'results',
    'payments',
    'finance',
    'reports',
    'users',
    'settings',
    'bulk',
  ],
  BUYER: [],
  AUCTION_MANAGER: ['events', 'results', 'payments', 'reports', 'bulk'],
  UPLOAD_QC: ['events', 'reports'],
  INFO_QC: ['events', 'reports'],
  ZONAL_MANAGER: ['results', 'payments', 'finance', 'reports'],
  SELLER_ADMIN: ['reports'],
  TELECALLER: ['reports'],
};
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const epoch = Date.now();
const time = (hours: number) => new Date(epoch + hours * 3600000).toISOString();
export const demoUsers: User[] = (Object.keys(rights) as User['role'][]).map(
  (role, i) => ({
    id: id(i + 1),
    role,
    permissions: rights[role],
    name: role === 'BUYER' ? 'Demo Buyer' : `Demo ${role.replaceAll('_', ' ')}`,
    username: `demo.${role.toLowerCase()}`,
    email: `${role.toLowerCase()}@example.invalid`,
    phone: '0000000000',
    status: role === 'BUYER' ? 'TRAINED' : 'ACTIVE',
    insurance_eligible: true,
    categories: ['2W', '4W', 'CV'],
    locations: [],
    profile: { city: 'Mumbai', address: 'Synthetic demonstration address' },
  }),
);
const buyer = demoUsers[1];
const users: User[] = [
  ...demoUsers,
  ...['PENDING', 'VERIFIED', 'BLOCKED', 'REJECTED'].map((status, i) => ({
    ...buyer,
    id: id(20 + i),
    name: `Demo ${status.toLowerCase()} buyer`,
    username: `demo.buyer${i}`,
    email: `buyer${i}@example.invalid`,
    status,
  })),
];
export const demoAuctions: Auction[] = ['LIVE', 'UPCOMING', 'CLOSED'].flatMap(
  (status, index) =>
    [0, 1].map((variant) => ({
      id: id(100 + index * 2 + variant),
      auction_number: 1001 + index * 2 + variant,
      title: `Demo ${status.toLowerCase()} vehicle auction ${variant + 1}`,
      insurer: variant ? 'Sample General Insurance' : 'Demo Insurance',
      location: variant ? 'Delhi' : 'Mumbai',
      category: variant ? '2W' : '4W',
      status,
      starts_at: time(
        status === 'UPCOMING' ? 48 : status === 'CLOSED' ? -72 : -2,
      ),
      ends_at: time(
        status === 'UPCOMING' ? 72 : status === 'CLOSED' ? -24 : 48,
      ),
      closed_at: status === 'CLOSED' ? time(-24) : undefined,
      lot_count: 6,
      bid_count: status === 'UPCOMING' ? 0 : 15,
      extension_seconds: 120,
      buffer_seconds: 120,
      terms:
        'Sample auction terms for UI review only. No real vehicles, bids or transactions.',
      mode: 'ONLINE',
      enforce_limits: true,
    })),
);
const results = [
  'APPROVED',
  'PENDING',
  'REJECTED',
  'UNSOLD',
  'UNPICKED',
  'CANCELLED',
];
export const demoLots = demoAuctions.flatMap((auction, ai) =>
  results.map(
    (result, i) =>
      ({
        id: id(1000 + ai * 10 + i),
        auction_id: auction.id,
        title: auction.title,
        insurer: auction.insurer,
        location: auction.location,
        lot_number: i + 1,
        registration: `DEMO-${ai + 1}-${i + 1}`,
        make: auction.category === '2W' ? 'Honda' : 'Maruti',
        model: auction.category === '2W' ? 'Activa' : 'Swift',
        year: 2021,
        fuel: 'Petrol',
        condition: 'Sample salvage vehicle',
        starting_price: 10000000,
        increment: 100000,
        current_bid: i === 3 || auction.status === 'UPCOMING' ? null : 12500000,
        bid_count: i === 3 || auction.status === 'UPCOMING' ? 0 : 3,
        own_bid_count: i === 3 || auction.status === 'UPCOMING' ? 0 : 1,
        is_mine: i === 0,
        won: auction.status === 'CLOSED' && i === 0,
        bidder_name: buyer.name,
        winner_name:
          auction.status === 'CLOSED' && i !== 3 ? buyer.name : undefined,
        winner_id:
          auction.status === 'CLOSED' && i !== 3 ? buyer.id : undefined,
        winner_email: buyer.email,
        starts_at: auction.starts_at,
        ends_at:
          auction.status === 'LIVE' && i >= 3 ? time(-0.5) : auction.ends_at,
        status:
          auction.status === 'CLOSED' || (auction.status === 'LIVE' && i >= 3)
            ? i === 5
              ? 'CANCELLED'
              : 'CLOSED'
            : 'OPEN',
        result_status: auction.status === 'CLOSED' ? result : 'PENDING',
        watched: i === 0,
        auto_maximum: i === 0 ? 14000000 : null,
        payment_status: i === 0 ? 'Paid' : 'Follow Up',
        version: 1,
        receipt_number: i === 0 ? 'DEMO-RECEIPT-001' : '',
        image_id: 'demo-image-vehicle',
        metadata: {
          variant: 'Sample trim',
          loan_account_no: `DEMO-LAN-${ai}-${i}`,
          contact_name: 'Demo Contact',
          contact_number: '0000000000',
          buyer_fee_percent: 2,
          sub_seller: 'Sample seller',
          sub_zone: auction.location,
          valuation_url: 'https://demo.invalid/valuation',
          fop_url: 'https://demo.invalid/fop',
        },
      }) satisfies Lot & {
        auction_id: string;
        title: string;
        insurer: string;
        location: string;
        winner_id?: string;
        winner_email: string;
        payment_status: string;
      },
  ),
);

for (const auction of demoAuctions) {
  auction.search_vehicles = demoLots
    .filter((lot) => lot.auction_id === auction.id)
    .map((lot) => ({
      registration: lot.registration,
      make: lot.make,
      model: lot.model,
      ...lot.metadata,
    }));
}

const blocks = [false, true].map((event, i) => ({
  id: id(3000 + i),
  user_id: users[10].id,
  name: users[10].name,
  username: users[10].username,
  insurer: event ? null : demoAuctions[0].insurer,
  auction_id: event ? demoAuctions[0].id : null,
  auction_title: event ? demoAuctions[0].title : null,
  reason: 'Sample review restriction',
  created_at: time(-48),
}));
function savedRole() {
  try {
    return sessionStorage.getItem('elvxchange-demo-role');
  } catch {
    return null;
  }
}
let session: User | null =
  demoUsers.find((user) => user.role === savedRole()) || null;
export function selectDemoUser(role: User['role']) {
  session = demoUsers.find((user) => user.role === role) || null;
  if (!session) throw new Error('Choose a demo role.');
  try {
    sessionStorage.setItem('elvxchange-demo-role', role);
  } catch {
    /* Preview works without browser storage. */
  }
  return session;
}
const bidsFor = (lots: typeof demoLots) =>
  lots
    .filter((lot) => lot.bid_count > 0)
    .map((lot) => ({
      id: `bid-${lot.id}`,
      lot_id: lot.id,
      lot_number: lot.lot_number,
      amount: lot.current_bid,
      created_at: time(-1),
      bidder_name: buyer.name,
      is_auto: false,
    }));

// Preview writes deliberately fail before existing success callbacks can claim a save.
export async function demoApi<T>(path: string, method = 'GET'): Promise<T> {
  if (path === '/auth/logout') {
    session = null;
    try {
      sessionStorage.removeItem('elvxchange-demo-role');
    } catch {
      /* No stored session. */
    }
    return undefined as T;
  }
  // These two POST routes only preview sample inventory; no file is read or sent.
  if (method === 'POST' && path === '/inventory/preview')
    return structuredClone(demoLots.slice(0, 3)) as T;
  if (method === 'POST' && path === '/workflow/grouped-inventory/preview')
    return [
      {
        ...demoAuctions[1],
        count: 3,
        existing: null,
      },
    ] as T;
  if (method !== 'GET') throw new Error(PREVIEW_MESSAGE);
  const url = new URL(path, 'https://demo.invalid');
  const route = url.pathname;
  let value: unknown;
  if (route === '/auth/me') {
    if (!session) throw new Error('Select a demo role to enter.');
    value = session;
  } else if (route === '/auctions' || route === '/public/auctions') {
    value = { auctions: demoAuctions, serverTime: new Date().toISOString() };
  } else if (/^\/auctions\/[^/]+$/.test(route)) {
    const auction = demoAuctions.find((a) => a.id === route.split('/')[2]);
    if (!auction)
      throw new Error(
        'This event is not part of the demo. Open an event from the list.',
      );
    const lots = demoLots.filter((l) => l.auction_id === auction.id);
    value = {
      auction,
      lots,
      bids: bidsFor(lots),
      summary: { bidders: 2 },
      serverTime: new Date().toISOString(),
    };
  } else if (route.endsWith('/participants')) {
    value = [
      {
        id: buyer.id,
        name: buyer.name,
        username: buyer.username,
        bid_count: 3,
        maximum_bid: 12500000,
        last_bid: time(-1),
      },
    ];
  } else if (route === '/users' || route === '/workflow/buyers') {
    value =
      route === '/users' ? users : users.filter((u) => u.role === 'BUYER');
  } else if (/^\/users\/[^/]+\/details$/.test(route)) {
    const user = users.find((u) => u.id === route.split('/')[2]);
    if (!user) throw new Error('Demo user not found.');
    value = {
      user,
      blocks: blocks.filter((b) => b.user_id === user.id),
      history: [
        {
          action: user.status,
          details: { remarks: 'Prepared example' },
          actor: 'Demo Admin',
          created_at: time(-48),
        },
      ],
    };
  } else if (route === '/blocks') value = blocks;
  else if (route === '/blocked-pan')
    value = [
      {
        pan: 'DEMO-PAN',
        reason: 'Synthetic blocked identity example',
        updated_at: time(-24),
      },
    ];
  else if (route === '/buyer-lots')
    value = demoLots.filter((l) =>
      url.searchParams.get('mode') === 'watchlist' ? l.watched : l.won,
    );
  else if (route === '/workflow/lots') value = demoLots;
  else if (/^\/workflow\/lots\/[^/]+$/.test(route)) {
    const lot = demoLots.find((l) => l.id === route.split('/')[3]);
    if (!lot) throw new Error('Demo vehicle not found.');
    value = {
      lot,
      receipts: lot.receipt_number
        ? [{ id: 'demo-document', name: 'Sample receipt' }]
        : [],
      quotation_enabled: true,
      quote_email_enabled: true,
      payment: {
        status: lot.payment_status,
        substatus: '',
        fulfillment_date: time(-12).slice(0, 10),
        version: 1,
        details: {},
      },
      history: [
        {
          id: 'sample-history',
          action: lot.result_status,
          actor: 'Demo Admin',
          created_at: time(-24),
        },
      ],
      bidders: [
        { id: buyer.id, name: buyer.name, amount: lot.current_bid || 0 },
      ],
    };
  } else if (route === '/workflow/finance')
    value = {
      entries: [
        {
          id: 'deposit',
          user_id: buyer.id,
          buyer_name: buyer.name,
          insurer: 'Demo Insurance',
          kind: 'DEPOSIT',
          amount: 5000000,
          reference: 'DEMO-RSD',
          remarks: 'Sample deposit',
          created_at: time(-48),
        },
      ],
      balances: [
        {
          user_id: buyer.id,
          buyer_name: buyer.name,
          insurer: 'Demo Insurance',
          balance: 5000000,
        },
      ],
      limits: [
        {
          user_id: buyer.id,
          buyer_name: buyer.name,
          insurer: 'Demo Insurance',
          amount_limit: 100000000,
          vehicle_limit: 10,
          used_amount: 12500000,
          used_vehicles: 1,
          available_amount: 87500000,
          available_vehicles: 9,
        },
      ],
    };
  else if (route === '/workflow/insurers')
    value = [
      {
        insurer: 'Demo Insurance',
        seller_code: 'DEMO',
        email: 'seller@example.invalid',
        quotation_enabled: true,
        payment_instructions: 'Sample instructions — do not make a payment.',
        quote_subject: 'Sample quotation',
        quote_valid_days: 7,
        locations: ['Mumbai'],
        subcategories: ['4W'],
      },
    ];
  else if (route === '/workflow/notifications')
    value = ['SENT', 'FAILED'].map((status, i) => ({
      id: `notification-${i}`,
      recipient: buyer.email,
      subject: 'Sample approval notification',
      status,
      last_error: i ? 'Demonstration failure; no email was sent.' : '',
    }));
  else if (route === '/files')
    value =
      url.searchParams.get('owner') === 'lot'
        ? [
            {
              id: 'demo-image-vehicle',
              kind: 'IMAGE',
              name: 'Sample vehicle illustration.svg',
            },
          ]
        : [
            {
              id: 'demo-document',
              kind: 'DOCUMENT',
              name: 'Sample supporting document',
            },
          ];
  else
    throw new Error(`This request is unavailable in the UI preview: ${route}`);
  return structuredClone(value) as T;
}
