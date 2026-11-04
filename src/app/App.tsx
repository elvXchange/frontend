import { BatchSchedule } from '../features/imports/imports-ui';
import {
  VehicleCommercial,
  WorkflowCreditBanner,
} from '../features/workflow/operations-ui';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/latin-800.css';
import '../styles/style.css';
import {
  closedSearch,
  closedFields,
  archiveSince,
} from '../features/auctions/search';
import {
  WorkflowHub,
  WorkflowLotButton,
  ReferenceImages,
  workflowSections,
} from '../features/workflow/workflow';
import {
  PublicAuctions,
  EventActions,
  VehicleThumbnail,
  BidConfirmation,
  AuctionEntry,
  UserStatus,
} from '../features/auctions/layout';

import {
  api,
  InventoryErrorReport,
  Brand,
  Field,
  Badge,
  Modal,
  Countdown,
  rupees,
  date,
  paise,
  localDate,
  type User,
  type Lot,
  type Auction,
  type Bid,
  type Detail,
} from '../shared/components/shared';
import {
  Profile,
  ProfileFields,
  CategoryChecks,
  UserDetails,
  VehicleDetails,
  BuyerLots,
  Registration,
  FilePanel,
  BlockList,
  Participants,
  AddVehicles,
  BlockedPan,
  LinkImages,
} from '../features/users/core';

import { Login } from '../features/auth/Login';
import { UserForm } from '../features/users/UserForm';
import { AuctionForm } from '../features/auctions/AuctionForm';
export default function App() {
  const [operationAuction, setOperationAuction] = useState<Auction | null>(
      null,
    ),
    [statusUser, setStatusUser] = useState<User | null>(null),
    [pendingBid, setPendingBid] = useState<{
      lot: Lot;
      amount: number;
      auto: boolean;
    } | null>(null),
    [entryTerms, setEntryTerms] = useState<Detail | null>(null);
  const [vehiclePage, setVehiclePage] = useState(1),
    [editingVehicle, setEditingVehicle] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState(''),
    [expandedVehicles, setExpandedVehicles] = useState<Record<string, boolean>>(
      {},
    ),
    [showAllDetails, setShowAllDetails] = useState(false);

  const [addingVehicles, setAddingVehicles] = useState(false);
  const [userDetails, setUserDetails] = useState<string | null>(null),
    [vehicleDetails, setVehicleDetails] = useState<Lot | null>(null),
    [mobileMenu, setMobileMenu] = useState(false);
  const [pageSize, setPageSize] = useState(25),
    [sortKey, setSortKey] = useState('title'),
    [sortDesc, setSortDesc] = useState(false);
  const [insurerFilter, setInsurerFilter] = useState<string[]>([]),
    [locationFilter, setLocationFilter] = useState<string[]>([]),
    [categoryFilter, setCategoryFilter] = useState<string[]>([]),
    [archive, setArchive] = useState('quarter'),
    [lotView, setLotView] = useState('ALL');
  const [autoModes, setAutoModes] = useState<Record<string, boolean>>({}),
    [searchField, setSearchField] = useState(''),
    [refreshSeconds, setRefreshSeconds] = useState(10);

  const [user, setUser] = useState<User | null>(null),
    [booting, setBooting] = useState(true);
  const [section, setSection] = useState('auctions'),
    [tab, setTab] = useState('LIVE'),
    [workflowTab, setWorkflowTab] = useState('Results'),
    [users, setUsers] = useState<User[]>([]),
    [auctions, setAuctions] = useState<Auction[]>([]);
  const [selected, setSelected] = useState<string | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [query, setQuery] = useState(''),
    [userStatus, setUserStatus] = useState('ALL'),
    [page, setPage] = useState(1);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [connected, setConnected] = useState(false),
    [loading, setLoading] = useState(false);
  const [userForm, setUserForm] = useState<User | 'new' | null>(null),
    [auctionForm, setAuctionForm] = useState<Detail | 'new' | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({}),
    [tick, setTick] = useState(Date.now()),
    [offset, setOffset] = useState(0),
    [detailTab, setDetailTab] = useState('vehicles');
  const requests = useRef<Record<string, string>>({}),
    generation = useRef(0),
    reviewedEntries = useRef(new Set<string>());
  const canManageEvents =
    user?.role === 'ADMIN' || !!user?.permissions?.includes('events');
  const isAdmin = !!user && user.role !== 'BUYER',
    now = tick + offset;
  function clearSessionView() {
    generation.current++;
    reviewedEntries.current.clear();
    requests.current = {};
    setOperationAuction(null);
    setStatusUser(null);
    setPendingBid(null);
    setEntryTerms(null);
    setAmounts({});
    setUserDetails(null);
    setVehicleDetails(null);
    setUserForm(null);
    setAuctionForm(null);
    setAddingVehicles(false);
    setDetail(null);
    setSelected(null);
    setUsers([]);
    setAuctions([]);
  }
  const refresh = useCallback(async () => {
    if (!user) return;
    const version = ++generation.current;
    setLoading(true);
    try {
      const [list, u, d] = await Promise.all([
        api<{ auctions: Auction[]; serverTime: string }>('/auctions'),
        user.role === 'ADMIN' ? api<User[]>('/users') : Promise.resolve([]),
        selected ? api<Detail>(`/auctions/${selected}`) : Promise.resolve(null),
      ]);
      if (version !== generation.current) return;
      setAuctions(list.auctions);
      setUsers(u);
      setDetail(d);
      if (
        d &&
        user.role === 'BUYER' &&
        d.auction.status !== 'CLOSED' &&
        !reviewedEntries.current.has(d.auction.id)
      )
        setEntryTerms(d);
      setOffset(Date.parse(d?.serverTime || list.serverTime) - Date.now());
    } catch (e) {
      if (version === generation.current) setError((e as Error).message);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [user, selected]);
  useEffect(() => {
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => {})
      .finally(() => setBooting(false));
    const ended = () => {
      clearSessionView();
      setUser(null);
      setDetail(null);
      setSelected(null);
      setUserForm(null);
      setAuctionForm(null);
      setUserDetails(null);
      setVehicleDetails(null);
      setAddingVehicles(false);
    };
    window.addEventListener('session-ended', ended);
    return () => window.removeEventListener('session-ended', ended);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    void refresh();
    const timer = refreshSeconds
      ? setInterval(() => void refresh(), refreshSeconds * 1000)
      : undefined;
    return () => {
      clearInterval(timer);
      generation.current++;
    };
  }, [refresh, refreshSeconds]);
  useEffect(() => {
    if (!user) return;
    const socket = io({ withCredentials: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 200);
    };
    socket.on('connect', () => {
      setConnected(true);
      onChange();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('changed', onChange);
    const focus = () => void refresh();
    window.addEventListener('focus', focus);
    return () => {
      clearTimeout(timer);
      socket.disconnect();
      setConnected(false);
      window.removeEventListener('focus', focus);
    };
  }, [user, refresh]);
  useEffect(() => {
    setPage(1);
  }, [
    query,
    tab,
    userStatus,
    section,
    pageSize,
    insurerFilter,
    locationFilter,
    categoryFilter,
    archive,
  ]);
  useEffect(() => {
    const read = () => {
      const path = location.hash.slice(1);
      const match = path.match(
        /^\/events\/(live|upcoming|closed)-auction-details\/([a-f0-9-]+)$/i,
      );
      setQuery('');
      setDetail(null);
      setMobileMenu(false);
      if (match) {
        setSection('auctions');
        setTab(match[1].toUpperCase());
        setLotView(
          match[1] === 'live'
            ? 'OPEN'
            : match[1] === 'closed'
              ? 'WITH_BIDS'
              : 'ALL',
        );
        setSelected(match[2]);
        return;
      }
      setSelected(null);
      if (path === '/events/link-images') setSection('images');
      else if (path === '/profile') setSection('profile');
      else if (path === '/users') setSection('users');
      else if (path === '/workflow') setSection('workflow');
      else if (path === '/batch-schedule') setSection('batch-schedule');
      else if (path === '/events/watchlist') setSection('watchlist');
      else if (path === '/events/my-results') setSection('results');
      else {
        setSection('auctions');
        setTab(
          path.includes('upcoming')
            ? 'UPCOMING'
            : path.includes('closed')
              ? 'CLOSED'
              : 'LIVE',
        );
      }
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  useEffect(
    () => setVehiclePage(1),
    [vehicleSearch, lotView, selected, pageSize],
  );
  async function action(work: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      setNotice(message);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function navigate(nextSection: string, nextTab = 'LIVE') {
    location.hash =
      nextSection === 'images'
        ? '/events/link-images'
        : nextSection === 'auctions'
          ? '/events/' + nextTab.toLowerCase() + '-auctions'
          : nextSection === 'watchlist'
            ? '/events/watchlist'
            : nextSection === 'results'
              ? '/events/my-results'
              : '/' + nextSection;
    setMobileMenu(false);
    setInsurerFilter([]);
    setLocationFilter([]);
    setCategoryFilter([]);
    setSection(nextSection);
    setTab(nextTab);
    setSelected(null);
    setDetail(null);
    setQuery('');
    setError('');
    setNotice('');
  }
  async function multipleBids() {
    if (!detail || busy) return;
    const selectedLots = detail.lots.filter(
      (l) =>
        amounts[l.id] !== undefined &&
        l.status === 'OPEN' &&
        now >= Date.parse(l.starts_at) &&
        now < Date.parse(l.ends_at),
    );
    if (!selectedLots.length || selectedLots.length > 50) {
      setError('Enter amounts for 1–50 open vehicles.');
      return;
    }
    if (
      !confirm(
        'Submit ' +
          selectedLots.length +
          ' bid requests? Each bid is validated separately; accepted bids cannot be withdrawn.',
      )
    )
      return;
    setBusy(true);
    setError('');
    let accepted = 0;
    const failures: string[] = [];
    try {
      for (const l of selectedLots) {
        const amount = paise(amounts[l.id]),
          auto = !!autoModes[l.id],
          key = l.id + ':' + amount + String(auto),
          requestId = (requests.current[key] ||= crypto.randomUUID());
        try {
          await api('/lots/' + l.id + '/bids', 'POST', {
            amount,
            auto,
            requestId,
          });
          accepted++;
          delete requests.current[key];
          setAmounts((old) => {
            const next = { ...old };
            delete next[l.id];
            return next;
          });
        } catch (e) {
          failures.push(l.registration + ': ' + (e as Error).message);
        }
      }
      setNotice(
        accepted +
          ' bid requests accepted; ' +
          failures.length +
          ' failed or unconfirmed. Check bid history before retrying.',
      );
      if (failures.length) setError(failures.join(' | '));
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function editAuction(a: Auction) {
    await action(async () => {
      setAuctionForm(await api<Detail>('/auctions/' + a.id));
    }, '');
  }
  async function enterAuction(id: string) {
    if (isAdmin) {
      openAuction(id);
      return;
    }
    await action(async () => {
      const data = await api<Detail>('/auctions/' + id);
      if (data.auction.status === 'CLOSED') openAuction(id);
      else setEntryTerms(data);
    }, '');
  }
  async function confirmBid(p: { lot: Lot; amount: number; auto: boolean }) {
    const key = p.lot.id + ':' + p.amount + String(p.auto),
      requestId = (requests.current[key] ||= crypto.randomUUID());
    await action(
      async () => {
        await api('/lots/' + p.lot.id + '/bids', 'POST', {
          amount: p.amount,
          auto: p.auto,
          requestId,
        });
        delete requests.current[key];
        setAmounts((old) => {
          const next = { ...old };
          delete next[p.lot.id];
          return next;
        });
      },
      p.auto
        ? 'Auto-bid maximum saved.'
        : 'Bid accepted. Current price updated.',
    );
  }
  function openVehicle(lot: Lot, edit = false) {
    setEditingVehicle(edit);
    setVehicleDetails(lot);
  }
  function openAuction(id: string) {
    setVehicleSearch('');
    setExpandedVehicles({});
    setShowAllDetails(false);
    const status = auctions.find((a) => a.id === id)?.status || 'LIVE';
    setSection('auctions');
    setTab(status);
    setLotView(
      status === 'LIVE' ? 'OPEN' : status === 'CLOSED' ? 'WITH_BIDS' : 'ALL',
    );
    location.hash =
      '/events/' + status.toLowerCase() + '-auction-details/' + id;
    setDetail(null);
    setSelected(id);
    setDetailTab('vehicles');
    setAmounts({});
    setError('');
    setNotice('');
  }
  if (booting)
    return (
      <div className="boot">
        <Brand />
        <p>Connecting to your workspace…</p>
      </div>
    );
  if (!user)
    return (
      <Login
        onLogin={(u) => {
          clearSessionView();
          setUser(u);
          setError('');
          setNotice('');
          window.scrollTo({ top: 0 });
          if (!location.hash.startsWith('#/')) navigate('auctions');
          else window.dispatchEvent(new HashChangeEvent('hashchange'));
        }}
      />
    );
  const archiveStartTime = archiveSince(archive, now);
  const compare = (a: unknown, b: unknown) => {
    const key =
      section === 'users' && (sortKey === 'title' || sortKey === 'ends_at')
        ? 'name'
        : sortKey;
    const get = (v: unknown) =>
      String((v as Record<string, unknown>)[key] || '');
    return (
      get(a).localeCompare(get(b), undefined, { numeric: true }) *
      (sortDesc ? -1 : 1)
    );
  };
  const filteredAuctions = auctions
    .filter(
      (a) =>
        a.status === tab &&
        (!insurerFilter.length || insurerFilter.includes(a.insurer)) &&
        (!locationFilter.length || locationFilter.includes(a.location)) &&
        (!categoryFilter.length ||
          categoryFilter.includes(a.category || '4W')) &&
        (tab !== 'CLOSED' ||
          Date.parse(a.closed_at || a.ends_at) >= archiveStartTime) &&
        (tab === 'CLOSED'
          ? !searchField || !query || closedSearch(a, searchField, query)
          : [a.title, a.insurer, a.location]
              .join(' ')
              .toLowerCase()
              .includes(query.toLowerCase())),
    )
    .sort(compare);
  const filteredUsers = users
    .filter(
      (u) =>
        (userStatus === 'ALL' ||
          u.role === userStatus ||
          u.status === userStatus ||
          (userStatus === 'TRAINED' &&
            u.role === 'BUYER' &&
            u.status === 'ACTIVE') ||
          (userStatus === 'UNVERIFIED' && u.status === 'PENDING')) &&
        [u.name, u.username, u.email, u.phone]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(compare);
  const visibleLots = (detail?.lots || []).filter(
    (l) =>
      (lotView === 'ALL' ||
        (['APPROVED', 'PENDING', 'REJECTED', 'UNSOLD', 'UNPICKED'].includes(
          lotView,
        ) &&
          l.result_status === lotView) ||
        (lotView === 'OPEN' && l.status === 'OPEN') ||
        (lotView === 'CANCELLED' && l.status === 'CANCELLED') ||
        (lotView === 'WITH_BIDS' &&
          l.status === 'CLOSED' &&
          (isAdmin ? l.bid_count : l.own_bid_count) > 0) ||
        (lotView === 'WITHOUT_BIDS' &&
          l.status === 'CLOSED' &&
          (isAdmin ? l.bid_count : l.own_bid_count) === 0)) &&
      [
        l.registration,
        l.make,
        l.model,
        l.metadata?.variant,
        l.metadata?.loan_account_no,
      ]
        .join(' ')
        .toLowerCase()
        .includes(vehicleSearch.toLowerCase()),
  );
  const vehiclePageSafe = Math.min(
    vehiclePage,
    Math.max(1, Math.ceil(visibleLots.length / pageSize)),
  );
  const rows = section === 'users' ? filteredUsers : filteredAuctions;
  const safePage = Math.min(
    page,
    Math.max(1, Math.ceil(rows.length / pageSize)),
  );
  return (
    <>
      <header className={'site-header ' + (mobileMenu ? 'mobile-open' : '')}>
        <button
          className="brand-button"
          onClick={() => navigate('auctions')}
          aria-label="ELVXCHANGE home"
        >
          <Brand />
        </button>
        <button
          className="mobile-toggle btn btn-light"
          aria-label="Toggle navigation"
          aria-expanded={mobileMenu}
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          ☰
        </button>
        <nav aria-label="Main navigation">
          <details className="nav-dropdown">
            <summary className={section === 'auctions' ? 'nav-active' : ''}>
              Events <span>⌄</span>
            </summary>
            <div className="nav-menu">
              {['LIVE', 'UPCOMING', 'CLOSED'].map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    navigate('auctions', s);
                    e.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                >
                  {s[0] + s.slice(1).toLowerCase()} Auctions
                </button>
              ))}
              {canManageEvents && (
                <button
                  onClick={(e) => {
                    setAuctionForm('new');
                    e.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                >
                  Schedule Auction
                </button>
              )}
              {canManageEvents && (
                <button onClick={() => navigate('batch-schedule')}>
                  Schedule grouped inventory
                </button>
              )}
              {canManageEvents && (
                <button
                  onClick={(e) => {
                    navigate('images');
                    e.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                >
                  Link Images
                </button>
              )}
            </div>
          </details>
          {user.role === 'ADMIN' && (
            <details className="nav-dropdown">
              <summary className={section === 'users' ? 'nav-active' : ''}>
                Users <span>⌄</span>
              </summary>
              <div className="nav-menu">
                {[
                  ['ALL', 'All users'],
                  ['UNVERIFIED', 'Unverified Users'],
                  ['VERIFIED', 'Verified Users'],
                  ['TRAINED', 'Trained Users'],
                  ['BLOCKED', 'Blocked Users'],
                  ['SSB', 'SSB'],
                  ['ASB', 'ASB'],
                  ['REJECTED', 'Rejected Users'],
                  ['ADMIN', 'Admin Users'],
                  ['BLOCKED_PAN', 'Blocked PANs'],
                ].map(([status, label]) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      setUserStatus(status);
                      navigate('users');
                      e.currentTarget
                        .closest('details')
                        ?.removeAttribute('open');
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </details>
          )}
          {isAdmin ? (
            <details className="nav-dropdown">
              <summary className={section === 'workflow' ? 'nav-active' : ''}>
                Operations <span>⌄</span>
              </summary>
              <div className="nav-menu">
                {workflowSections(user).map((workflowSection) => (
                  <button
                    key={workflowSection}
                    onClick={(e) => {
                      setWorkflowTab(workflowSection);
                      navigate('workflow');
                      e.currentTarget
                        .closest('details')
                        ?.removeAttribute('open');
                    }}
                  >
                    {workflowSection}
                  </button>
                ))}
              </div>
            </details>
          ) : (
            <button
              className={section === 'workflow' ? 'nav-active' : ''}
              onClick={() => navigate('workflow')}
            >
              My Wins / Payments
            </button>
          )}
          {!isAdmin && (
            <>
              <button onClick={() => navigate('watchlist')}>Watchlist</button>
              <button onClick={() => navigate('results')}>My Results</button>
            </>
          )}
        </nav>
        <div className="account">
          <span className="avatar">{user.name[0]}</span>
          <details className="nav-dropdown account-dropdown">
            <summary>
              {user.name} ⌄<small>{user.role.replaceAll('_', ' ')}</small>
            </summary>
            <div className="nav-menu">
              <button
                onClick={(e) => {
                  navigate('profile');
                  e.currentTarget.closest('details')?.removeAttribute('open');
                }}
              >
                Personal Information
              </button>
              <button
                onClick={() =>
                  void action(async () => {
                    await api('/auth/logout', 'POST');
                    clearSessionView();
                    setUser(null);
                    setSelected(null);
                    setDetail(null);
                  }, '')
                }
              >
                Logout
              </button>
            </div>
          </details>
        </div>
        <div className="header-clock">
          <span>SERVER TIME · IST</span>
          <strong>
            {new Date(now).toLocaleTimeString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour12: false,
            })}
          </strong>
        </div>
      </header>
      <div className="workspace-strip">
        <span>
          INSURANCE AUCTIONS <span className="strip-divider">/</span>{' '}
          {isAdmin ? 'ADMIN WORKSPACE' : 'BUYER WORKSPACE'}
        </span>
        <span className={connected ? 'connection' : 'connection offline'}>
          <i />
          {connected
            ? 'Live updates connected'
            : 'Reconnecting · use Refresh to check bids'}
        </span>
      </div>
      <main className="workspace">
        {error && (
          <div
            className="alert alert-danger d-flex justify-content-between"
            role="alert"
          >
            <span>{error}</span>
            <button
              className="btn-close"
              aria-label="Dismiss error"
              onClick={() => setError('')}
            />
          </div>
        )}
        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
          </div>
        )}
        {section === 'batch-schedule' && canManageEvents ? (
          <BatchSchedule onSaved={refresh} />
        ) : section === 'workflow' ? (
          <WorkflowHub
            user={user}
            auctions={auctions}
            onRefresh={refresh}
            tab={workflowTab}
            onTabChange={setWorkflowTab}
          />
        ) : section === 'images' && isAdmin ? (
          <>
            <LinkImages auctions={auctions} />
            <ReferenceImages auctions={auctions} user={user} />
          </>
        ) : section === 'profile' ? (
          <Profile
            user={user}
            onUpdate={setUser}
            onSignedOut={() => {
              clearSessionView();
              setUser(null);
            }}
          />
        ) : !isAdmin && (section === 'watchlist' || section === 'results') ? (
          <BuyerLots mode={section} onOpen={(id) => void enterAuction(id)} />
        ) : section === 'users' && userStatus === 'BLOCKED_PAN' ? (
          <>
            <button className="back-link" onClick={() => setUserStatus('ALL')}>
              ← Back to users
            </button>
            <BlockedPan />
          </>
        ) : section === 'users' && ['SSB', 'ASB'].includes(userStatus) ? (
          <>
            <button className="back-link" onClick={() => setUserStatus('ALL')}>
              ← Back to users
            </button>
            <BlockList
              mode={userStatus as 'SSB' | 'ASB'}
              onUser={setUserDetails}
            />
          </>
        ) : selected ? (
          <>
            <button
              className="back-link"
              onClick={() => navigate('auctions', tab)}
            >
              ← Back to auctions
            </button>
            {!detail ? (
              <div className="empty-panel">
                {loading ? 'Loading auction…' : 'Auction could not be loaded.'}
              </div>
            ) : (
              <>
                {user.role === 'BUYER' && (
                  <WorkflowCreditBanner
                    insurer={detail.auction.insurer}
                    revision={detail.serverTime}
                    enforced={!!detail.auction.enforce_limits}
                  />
                )}
                <div className="page-heading">
                  <div>
                    <span className="eyebrow text-success">
                      INSURANCE / AUCTION DETAILS
                    </span>
                    <h1>{detail.auction.title}</h1>
                    <p>
                      Auction #{detail.auction.auction_number} ·{' '}
                      {detail.auction.insurer}{' '}
                      <span className="text-muted">/</span>{' '}
                      {detail.auction.location}
                    </p>
                  </div>
                  <div className="heading-actions">
                    <Badge
                      status={
                        detail.auction.cancelled_at
                          ? 'CANCELLED'
                          : detail.auction.status
                      }
                    />
                    {isAdmin && (
                      <EventActions
                        auction={detail.auction}
                        includeEnter={false}
                        busy={busy}
                        onEnter={() => openAuction(detail.auction.id)}
                        onEdit={() => setAuctionForm(detail)}
                        onAdd={() => setOperationAuction(detail.auction)}
                        onDone={refresh}
                      />
                    )}
                    {isAdmin && detail.auction.status === 'UPCOMING' && (
                      <button
                        className="btn btn-success"
                        disabled={busy}
                        onClick={() => {
                          if (confirm('Start this auction now?'))
                            void action(
                              () =>
                                api('/auctions/' + selected + '/start', 'POST'),
                              'Auction is live.',
                            );
                        }}
                      >
                        Go live
                      </button>
                    )}
                    {isAdmin && detail.auction.status !== 'CLOSED' && (
                      <button
                        className="btn btn-outline-danger"
                        disabled={busy}
                        onClick={() => {
                          if (
                            confirm(
                              'Close this auction now? Saved bid history will remain.',
                            )
                          )
                            void action(
                              () =>
                                api('/auctions/' + selected + '/close', 'POST'),
                              'Auction closed.',
                            );
                        }}
                      >
                        Close auction
                      </button>
                    )}
                  </div>
                </div>
                {detail.auction.banner && (
                  <div className="alert alert-info">
                    {detail.auction.banner}
                  </div>
                )}
                <div className="auction-meta">
                  <div>
                    <span>STARTS</span>
                    <strong>{date(detail.auction.starts_at)}</strong>
                  </div>
                  <div>
                    <span>CLOSES</span>
                    <strong>{date(detail.auction.ends_at)}</strong>
                  </div>
                  <div>
                    <span>
                      {detail.auction.status === 'UPCOMING'
                        ? 'STARTS IN'
                        : detail.auction.status === 'CLOSED'
                          ? 'CLOSED AT'
                          : 'TIME REMAINING'}
                    </span>
                    <strong>
                      {detail.auction.status === 'CLOSED' ? (
                        date(detail.auction.closed_at)
                      ) : (
                        <Countdown
                          until={
                            detail.auction.status === 'UPCOMING'
                              ? detail.auction.starts_at
                              : detail.auction.ends_at
                          }
                          now={now}
                        />
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>INVENTORY</span>
                    <strong>
                      {detail.lots.length} vehicles ·{' '}
                      {detail.lots.reduce((s, l) => s + l.bid_count, 0)} bids
                    </strong>
                  </div>
                </div>
                {isAdmin && (
                  <div className="staff-summary">
                    <div>
                      <span>Total inventory</span>
                      <strong>{detail.lots.length}</strong>
                    </div>
                    <div>
                      <span>Open vehicles</span>
                      <strong>
                        {detail.lots.filter((l) => l.status === 'OPEN').length}
                      </strong>
                    </div>
                    <div>
                      <span>Closed with bids</span>
                      <strong>
                        {
                          detail.lots.filter(
                            (l) => l.status === 'CLOSED' && l.bid_count > 0,
                          ).length
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Closed without bids</span>
                      <strong>
                        {
                          detail.lots.filter(
                            (l) => l.status === 'CLOSED' && !l.bid_count,
                          ).length
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Highest bids total</span>
                      <strong>
                        {rupees(
                          detail.lots.reduce(
                            (n, l) => n + (l.current_bid || 0),
                            0,
                          ),
                        )}
                      </strong>
                    </div>
                    <button onClick={() => setDetailTab('participants')}>
                      <span>Bidders</span>
                      <strong>{detail.summary?.bidders || 0}</strong>
                    </button>
                  </div>
                )}
                <div className="auction-detail-card">
                  <div className="tabs">
                    {(detail.auction.status !== 'UPCOMING'
                      ? detail.auction.status === 'CLOSED' && isAdmin
                        ? [
                            'APPROVED',
                            'PENDING',
                            'REJECTED',
                            'UNSOLD',
                            'CANCELLED',
                            'WITH_BIDS',
                            'WITHOUT_BIDS',
                          ]
                        : ['OPEN', 'WITH_BIDS', 'WITHOUT_BIDS', 'CANCELLED']
                      : ['ALL']
                    ).map((v) => (
                      <button
                        key={v}
                        className={
                          detailTab === 'vehicles' && lotView === v
                            ? 'active'
                            : ''
                        }
                        onClick={() => {
                          setDetailTab('vehicles');
                          setLotView(v);
                        }}
                      >
                        {v === 'OPEN'
                          ? 'Open Vehicles'
                          : v === 'WITH_BIDS'
                            ? 'Closed With Bids'
                            : v === 'WITHOUT_BIDS'
                              ? 'Closed Without Bids'
                              : v === 'CANCELLED'
                                ? 'Cancelled Vehicles'
                                : (
                                    {
                                      APPROVED: 'Approved Vehicles',
                                      PENDING: 'Approval Pending',
                                      REJECTED: 'Rejected',
                                      UNSOLD: 'No Bids',
                                      UNPICKED: 'Unpicked',
                                    } as Record<string, string>
                                  )[v] || 'Vehicles'}
                      </button>
                    ))}
                    <button
                      className={
                        detailTab === 'vehicles' && lotView === 'ALL'
                          ? 'active'
                          : ''
                      }
                      onClick={() => {
                        setDetailTab('vehicles');
                        setLotView('ALL');
                      }}
                    >
                      All Vehicles <span>{detail.lots.length}</span>
                    </button>
                    <button
                      className={detailTab === 'bids' ? 'active' : ''}
                      onClick={() => setDetailTab('bids')}
                    >
                      {isAdmin ? 'Bid history' : 'My bids'}{' '}
                      <span>{detail.bids.length}</span>
                    </button>
                    <>
                      {isAdmin && (
                        <button
                          className={
                            detailTab === 'participants' ? 'active' : ''
                          }
                          onClick={() => setDetailTab('participants')}
                        >
                          Bidders / participants
                        </button>
                      )}
                    </>
                    <button
                      className={detailTab === 'terms' ? 'active' : ''}
                      onClick={() => setDetailTab('terms')}
                    >
                      Terms & conditions
                    </button>
                    <select
                      aria-label="Auto refresh interval"
                      className="refresh-select ms-auto"
                      value={refreshSeconds}
                      onChange={(e) =>
                        setRefreshSeconds(Number(e.target.value))
                      }
                    >
                      <option value={0}>Manual</option>
                      <option value={10}>10 Sec</option>
                      <option value={20}>20 Sec</option>
                      <option value={30}>30 Sec</option>
                    </select>
                    <button onClick={() => void refresh()} disabled={loading}>
                      ↻ Refresh
                    </button>
                  </div>
                  {detailTab === 'vehicles' && (
                    <div className="table-toolbar">
                      <div>
                        <strong>Vehicles ({visibleLots.length})</strong>
                        <button
                          className="text-action ms-3"
                          onClick={() => {
                            setShowAllDetails(!showAllDetails);
                            setExpandedVehicles({});
                          }}
                        >
                          {showAllDetails
                            ? 'Hide all details'
                            : 'Show all details'}
                        </button>
                      </div>
                      <div className="toolbar-right">
                        <label className="search-box">
                          <input
                            aria-label="Search vehicles"
                            placeholder="Search vehicle, registration or LAN…"
                            value={vehicleSearch}
                            onChange={(e) => setVehicleSearch(e.target.value)}
                          />
                        </label>
                        {!isAdmin && detail.auction.status === 'LIVE' && (
                          <button
                            className="btn btn-outline-success btn-sm"
                            disabled={busy || !Object.keys(amounts).length}
                            onClick={() => void multipleBids()}
                          >
                            Place Multiple Bids ({Object.keys(amounts).length})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {detailTab === 'participants' && isAdmin ? (
                    <Participants id={detail.auction.id} />
                  ) : detailTab === 'terms' ? (
                    <div className="terms">
                      {detail.auction.terms ||
                        'No additional terms were supplied for this auction.'}
                      <FilePanel
                        owner="auction"
                        id={detail.auction.id}
                        editable={isAdmin}
                      />
                    </div>
                  ) : detailTab === 'bids' ? (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Lot</th>
                            <th>Bidder</th>
                            <th>Amount</th>
                            <th>Placed at (IST)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.bids.map((b) => (
                            <tr key={b.id}>
                              <td>#{b.lot_number}</td>
                              <td>{b.bidder_name}</td>
                              <td className="money">{rupees(b.amount)}</td>
                              <td>
                                {date(b.created_at)}
                                {b.is_auto && <small>Auto bid</small>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!detail.bids.length && (
                        <div className="empty-panel">No bids placed yet.</div>
                      )}
                      <p className="table-note">
                        Latest 500 bids. All accepted bids remain saved in the
                        database.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <table className="table vehicle-table">
                          <thead>
                            <tr>
                              <th>Image</th>
                              <th>Vehicle Details</th>
                              <th>Start / End Time</th>
                              <th>SP / INCR</th>
                              <th>Current Price / Status</th>
                              <th>Bids</th>
                              <th>{isAdmin ? 'Action' : 'Bid Details'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleLots
                              .slice(
                                (vehiclePageSafe - 1) * pageSize,
                                vehiclePageSafe * pageSize,
                              )
                              .map((l) => {
                                const minimum =
                                  l.current_bid === null
                                    ? l.starting_price
                                    : l.current_bid + l.increment;
                                const canBid =
                                  !isAdmin &&
                                  (!detail.auction.mode ||
                                    detail.auction.mode === 'ONLINE') &&
                                  detail.auction.status === 'LIVE' &&
                                  l.status === 'OPEN' &&
                                  now >= Date.parse(l.starts_at) &&
                                  now < Date.parse(l.ends_at) &&
                                  ['ACTIVE', 'TRAINED'].includes(user.status) &&
                                  user.insurance_eligible !== false;
                                const expanded =
                                  showAllDetails || expandedVehicles[l.id];
                                const stepBid = (up: boolean) => {
                                  const input = document.getElementById(
                                    'bid-' + l.id,
                                  );
                                  if (input instanceof HTMLInputElement) {
                                    if (up) input.stepUp();
                                    else input.stepDown();
                                    setAmounts((old) => ({
                                      ...old,
                                      [l.id]: input.value,
                                    }));
                                  }
                                };
                                return (
                                  <tr key={l.id}>
                                    <td data-label="Image">
                                      <VehicleThumbnail
                                        lot={l}
                                        onOpen={() => openVehicle(l)}
                                      />
                                    </td>
                                    <td
                                      data-label="Vehicle Details"
                                      className="vehicle-info-cell"
                                    >
                                      <VehicleCommercial lot={l} />
                                      <span className="lot-number">
                                        ITEM{' '}
                                        {String(l.lot_number).padStart(3, '0')}
                                      </span>
                                      <button
                                        className="auction-title"
                                        onClick={() => openVehicle(l)}
                                      >
                                        {l.make} {l.model}{' '}
                                        {l.metadata?.variant || ''}
                                      </button>
                                      <strong>{l.registration}</strong>
                                      <small>
                                        Make Year: {l.year} ·{' '}
                                        {l.fuel || 'Fuel unspecified'}
                                      </small>
                                      <small>
                                        {l.metadata?.rc_status || 'RC unknown'}{' '}
                                        · Owners:{' '}
                                        {l.metadata?.owner_count ?? '—'}
                                      </small>
                                      <small>
                                        Yard:{' '}
                                        {l.metadata?.yard ||
                                          detail.auction.location}
                                      </small>
                                      {!isAdmin && (
                                        <button
                                          className="watch-button"
                                          disabled={busy}
                                          onClick={() =>
                                            void action(
                                              () =>
                                                api(
                                                  '/lots/' +
                                                    l.id +
                                                    '/watchlist',
                                                  'PUT',
                                                  { watched: !l.watched },
                                                ),
                                              l.watched
                                                ? 'Removed from watchlist.'
                                                : 'Added to watchlist.',
                                            )
                                          }
                                        >
                                          {l.watched
                                            ? '★ Watching'
                                            : '☆ Watchlist'}
                                        </button>
                                      )}
                                      <button
                                        className="text-action"
                                        aria-expanded={!!expanded}
                                        onClick={() =>
                                          setExpandedVehicles((old) => ({
                                            ...old,
                                            [l.id]: !expanded,
                                          }))
                                        }
                                      >
                                        {expanded
                                          ? 'Hide details'
                                          : 'Show details'}
                                      </button>
                                      {expanded && (
                                        <div className="expanded-vehicle">
                                          <small>
                                            LAN:{' '}
                                            {l.metadata?.loan_account_no || '—'}
                                          </small>
                                          <small>
                                            Condition:{' '}
                                            {l.condition ||
                                              'No condition details supplied'}
                                          </small>
                                          <small>
                                            Transmission:{' '}
                                            {l.metadata?.transmission || '—'}
                                          </small>
                                          <small>
                                            Colour: {l.metadata?.colour || '—'}
                                          </small>
                                          <small>
                                            Inspection:{' '}
                                            {l.metadata?.contact_name || '—'}{' '}
                                            {l.metadata?.contact_number || ''}
                                          </small>
                                        </div>
                                      )}
                                    </td>
                                    <td
                                      data-label="Start / End Time"
                                      className="vehicle-time"
                                    >
                                      <small>Start</small>
                                      <strong>{date(l.starts_at)}</strong>
                                      <small>End</small>
                                      <strong>{date(l.ends_at)}</strong>
                                      {l.status === 'OPEN' && (
                                        <Countdown
                                          until={
                                            now < Date.parse(l.starts_at)
                                              ? l.starts_at
                                              : l.ends_at
                                          }
                                          now={now}
                                        />
                                      )}
                                    </td>
                                    <td
                                      data-label="SP / INCR"
                                      className="price-cell"
                                    >
                                      <strong>
                                        {isAdmin || l.show_start_price !== false
                                          ? rupees(l.starting_price)
                                          : 'Hidden'}
                                      </strong>
                                      <small>INCR {rupees(l.increment)}</small>
                                    </td>
                                    <td
                                      data-label="Current Price / Status"
                                      className="price-cell"
                                    >
                                      <strong className="money">
                                        {isAdmin ||
                                        l.show_current_price !== false
                                          ? rupees(l.current_bid)
                                          : 'Hidden'}
                                      </strong>
                                      <Badge status={l.status} />
                                      {l.result_status && (
                                        <span className="workflow-status">
                                          {l.result_status}
                                        </span>
                                      )}
                                      {l.is_mine && (
                                        <small className="text-success">
                                          {l.status === 'CLOSED'
                                            ? 'Highest bidder'
                                            : 'You are leading'}
                                        </small>
                                      )}
                                    </td>
                                    <td data-label="Bids">
                                      <button
                                        className="text-action"
                                        onClick={() => setDetailTab('bids')}
                                      >
                                        {l.bid_count} bids
                                      </button>
                                    </td>
                                    <td
                                      data-label={
                                        isAdmin ? 'Action' : 'Bid Details'
                                      }
                                    >
                                      {isAdmin ? (
                                        <>
                                          <strong>
                                            {l.status === 'CANCELLED'
                                              ? 'Cancelled (bids retained)'
                                              : l.status === 'CLOSED'
                                                ? l.winner_name ||
                                                  'Closed without bids'
                                                : l.bidder_name ||
                                                  'No bids yet'}
                                          </strong>
                                          <div className="event-actions">
                                            <WorkflowLotButton
                                              id={l.id}
                                              user={user}
                                              auctions={auctions}
                                              onSaved={refresh}
                                            />
                                            {l.status === 'OPEN' && (
                                              <button
                                                className="btn btn-outline-success btn-sm"
                                                onClick={() =>
                                                  openVehicle(l, true)
                                                }
                                              >
                                                Edit
                                              </button>
                                            )}
                                            <button
                                              className="btn btn-light btn-sm"
                                              onClick={() =>
                                                setDetailTab('bids')
                                              }
                                            >
                                              History
                                            </button>
                                          </div>
                                        </>
                                      ) : canBid ? (
                                        <form
                                          className="bid-form"
                                          onSubmit={(e) => {
                                            e.preventDefault();
                                            setPendingBid({
                                              lot: l,
                                              amount: paise(
                                                amounts[l.id] ??
                                                  String(minimum / 100),
                                              ),
                                              auto: !!autoModes[l.id],
                                            });
                                          }}
                                        >
                                          <label
                                            className="visually-hidden"
                                            htmlFor={`bid-${l.id}`}
                                          >
                                            Bid amount in rupees for{' '}
                                            {l.registration}
                                          </label>
                                          <div className="input-group input-group-sm">
                                            <button
                                              type="button"
                                              className="btn btn-light bid-step"
                                              aria-label={
                                                'Decrease bid for ' +
                                                l.registration
                                              }
                                              disabled={busy}
                                              onClick={() => stepBid(false)}
                                            >
                                              −
                                            </button>
                                            <span className="input-group-text">
                                              ₹
                                            </span>
                                            <input
                                              id={`bid-${l.id}`}
                                              aria-label={`Bid amount for ${l.registration}`}
                                              type="number"
                                              className="form-control"
                                              min={minimum / 100}
                                              step={l.increment / 100}
                                              max="1000000000"
                                              required
                                              value={
                                                amounts[l.id] ??
                                                String(minimum / 100)
                                              }
                                              onChange={(e) =>
                                                setAmounts((old) => ({
                                                  ...old,
                                                  [l.id]: e.target.value,
                                                }))
                                              }
                                            />
                                            <button
                                              type="button"
                                              className="btn btn-light bid-step"
                                              aria-label={
                                                'Increase bid for ' +
                                                l.registration
                                              }
                                              disabled={busy}
                                              onClick={() => stepBid(true)}
                                            >
                                              ＋
                                            </button>
                                            <button
                                              className="btn btn-success"
                                              disabled={busy}
                                            >
                                              Place Bid
                                            </button>
                                          </div>
                                          <small>Min. {rupees(minimum)}</small>
                                          {l.show_current_price !== false &&
                                            !l.max_bids && (
                                              <label className="auto-toggle">
                                                <input
                                                  type="checkbox"
                                                  checked={!!autoModes[l.id]}
                                                  onChange={(e) =>
                                                    setAutoModes({
                                                      ...autoModes,
                                                      [l.id]: e.target.checked,
                                                    })
                                                  }
                                                />{' '}
                                                Auto bid (maximum)
                                              </label>
                                            )}
                                          {l.auto_maximum && (
                                            <small>
                                              Your auto maximum:{' '}
                                              {rupees(l.auto_maximum)}{' '}
                                              <button
                                                type="button"
                                                className="watch-button"
                                                disabled={busy}
                                                onClick={() =>
                                                  void action(
                                                    () =>
                                                      api(
                                                        `/lots/${l.id}/auto/stop`,
                                                        'POST',
                                                      ),
                                                    'Automatic bidding stopped. Previously accepted bids remain binding.',
                                                  )
                                                }
                                              >
                                                Stop auto bidding
                                              </button>
                                            </small>
                                          )}
                                        </form>
                                      ) : l.status !== 'OPEN' ? (
                                        <span
                                          className={
                                            l.won
                                              ? 'result-won'
                                              : 'text-secondary'
                                          }
                                        >
                                          {l.status === 'CANCELLED'
                                            ? 'Cancelled'
                                            : l.won
                                              ? 'You are the highest bidder'
                                              : l.current_bid === null
                                                ? 'Closed without bids'
                                                : 'Auction closed'}
                                        </span>
                                      ) : (
                                        <small>
                                          {detail.auction.mode &&
                                          detail.auction.mode !== 'ONLINE'
                                            ? detail.auction.mode +
                                              ' auction: web bidding is disabled.'
                                            : 'Bidding requires a trained account and an open vehicle.'}
                                        </small>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      <div className="table-footer">
                        <label>
                          Rows{' '}
                          <select
                            aria-label="Vehicles per page"
                            value={pageSize}
                            onChange={(e) =>
                              setPageSize(Number(e.target.value))
                            }
                          >
                            {[5, 10, 25, 50, 100].map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                        <span>{visibleLots.length} vehicles</span>
                        <div>
                          <button
                            className="btn btn-light btn-sm"
                            disabled={vehiclePageSafe <= 1}
                            onClick={() => setVehiclePage(vehiclePageSafe - 1)}
                          >
                            ←
                          </button>
                          <span>{vehiclePageSafe}</span>
                          <button
                            className="btn btn-light btn-sm"
                            disabled={
                              vehiclePageSafe * pageSize >= visibleLots.length
                            }
                            onClick={() => setVehiclePage(vehiclePageSafe + 1)}
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow text-success">
                  YOUR AUCTION WORKSPACE
                </span>
                <h1>
                  {section === 'users'
                    ? 'Users'
                    : tab[0] + tab.slice(1).toLowerCase() + ' Auctions'}
                </h1>
                <p>
                  {section === 'users'
                    ? 'Manage accounts, permissions and participation.'
                    : 'Find the next opportunity. Give every vehicle a new possibility.'}
                </p>
              </div>
              <div className="heading-actions">
                {isAdmin && (
                  <button
                    className="btn btn-success"
                    onClick={() =>
                      section === 'users'
                        ? setUserForm('new')
                        : setAuctionForm('new')
                    }
                  >
                    +{' '}
                    {section === 'users'
                      ? userStatus === 'ADMIN'
                        ? 'Add Admin User'
                        : 'Add User'
                      : 'Schedule Auction'}
                  </button>
                )}
              </div>
            </div>

            <div
              className={
                'content-card ' +
                (section === 'auctions' ? 'auction-list-card' : '')
              }
            >
              {section === 'auctions' && (
                <div className="tabs">
                  <button className="active">
                    Insurance{' '}
                    <span>
                      {auctions.filter((a) => a.status === tab).length}
                    </span>
                  </button>
                </div>
              )}
              {section === 'auctions' && (
                <div className="list-filters">
                  {[
                    {
                      label: 'Sellers',
                      value: insurerFilter,
                      set: setInsurerFilter,
                      values: [...new Set(auctions.map((a) => a.insurer))],
                    },
                    {
                      label: 'Locations',
                      value: locationFilter,
                      set: setLocationFilter,
                      values: [...new Set(auctions.map((a) => a.location))],
                    },
                    {
                      label: 'Products',
                      value: categoryFilter,
                      set: setCategoryFilter,
                      values: ['2W', '3W', '4W', 'CV', 'CE', 'FE', 'Mixed'],
                    },
                  ].map((f) => (
                    <div key={f.label} className="field">
                      <label>{f.label}</label>
                      <details className="filter-dropdown">
                        <summary>
                          {f.value.length ? f.value.join(', ') : 'All'} ⌄
                        </summary>
                        <div className="filter-options">
                          <button type="button" onClick={() => f.set([])}>
                            Clear selection
                          </button>
                          {f.values.map((v) => (
                            <label key={v}>
                              <input
                                type="checkbox"
                                checked={f.value.includes(v)}
                                onChange={() =>
                                  f.set(
                                    f.value.includes(v)
                                      ? f.value.filter((x) => x !== v)
                                      : [...f.value, v],
                                  )
                                }
                              />
                              {v}
                            </label>
                          ))}
                        </div>
                      </details>
                    </div>
                  ))}
                  {tab === 'CLOSED' && (
                    <Field label="Archive">
                      <select
                        className="form-select"
                        value={archive}
                        onChange={(e) => setArchive(e.target.value)}
                      >
                        <option value="quarter">Current Quarter</option>
                        <option value="year">Current Year</option>
                        <option value="previous">Include Previous Year</option>
                        <option value="all">All</option>
                      </select>
                    </Field>
                  )}
                </div>
              )}
              <div className="table-toolbar">
                <div>
                  <span className="section-marker" />
                  {section === 'auctions' ? 'Insurance' : 'Accounts'}{' '}
                  <span className="text-secondary">({rows.length})</span>
                </div>
                <div className="toolbar-right">
                  {isAdmin && section === 'users' && (
                    <a
                      className="btn btn-outline-success btn-sm"
                      href={
                        '/api/users/export?status=' +
                        userStatus +
                        '&search=' +
                        encodeURIComponent(query)
                      }
                    >
                      ↓ Download Users
                    </a>
                  )}
                  <>
                    {section === 'auctions' && tab === 'CLOSED' && (
                      <select
                        className="form-select closed-search-select"
                        aria-label="Closed auction search field"
                        value={searchField}
                        onChange={(e) => {
                          setSearchField(e.target.value);
                          setQuery('');
                          setPage(1);
                        }}
                      >
                        <option value="">Select search field…</option>
                        {Object.entries(closedFields).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    )}
                    <label className="search-box">
                      <span aria-hidden="true">⌕</span>
                      <input
                        aria-label={
                          section === 'users'
                            ? 'Search users'
                            : 'Search auctions'
                        }
                        disabled={
                          section === 'auctions' &&
                          tab === 'CLOSED' &&
                          !searchField
                        }
                        placeholder={
                          section === 'users'
                            ? 'Search name, username, email or phone…'
                            : tab === 'CLOSED'
                              ? 'Select a field, then search…'
                              : 'Search auction, insurer or location…'
                        }
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </>
                  <button
                    className="btn btn-light btn-sm"
                    disabled={loading}
                    onClick={() => void refresh()}
                    aria-label="Refresh"
                  >
                    ↻
                  </button>
                </div>
              </div>
              <div className="table-responsive">
                {section === 'users' ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>
                          <button
                            className="sort-heading"
                            onClick={() => {
                              setSortKey('name');
                              setSortDesc(!sortDesc);
                            }}
                          >
                            User name / name ↕
                          </button>
                        </th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .slice((safePage - 1) * pageSize, safePage * pageSize)
                        .map((u) => (
                          <tr key={u.id}>
                            <td>
                              <button
                                className="auction-title"
                                onClick={() => setUserDetails(u.id)}
                              >
                                {u.name}
                              </button>
                              <small>{u.username || u.email}</small>
                              <small>{u.email}</small>
                            </td>
                            <td>{u.phone || '—'}</td>
                            <td>{u.role.replaceAll('_', ' ')}</td>
                            <td>
                              <button
                                className="status-action"
                                title="Change User Status"
                                onClick={() => setStatusUser(u)}
                              >
                                <Badge status={u.status} />
                              </button>
                            </td>
                            <td>
                              <div className="event-actions">
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => setUserForm(u)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="icon-action"
                                  title="Change User Status"
                                  aria-label={'Change status for ' + u.name}
                                  onClick={() => setStatusUser(u)}
                                >
                                  ⇄
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="table auction-list-table">
                    <thead>
                      <tr>
                        {isAdmin && <th>Event Id</th>}
                        <th>
                          <button
                            className="sort-heading"
                            onClick={() => {
                              setSortKey('title');
                              setSortDesc(!sortDesc);
                            }}
                          >
                            Event / CUG ↕
                          </button>
                        </th>
                        <th>Location</th>
                        <th>Start time</th>
                        <th>
                          <button
                            className="sort-heading"
                            onClick={() => {
                              setSortKey('ends_at');
                              setSortDesc(!sortDesc);
                            }}
                          >
                            Closing time ↕
                          </button>
                        </th>
                        <th>No. of vehicles</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuctions
                        .slice((safePage - 1) * pageSize, safePage * pageSize)
                        .map((a) => (
                          <tr key={a.id}>
                            {isAdmin && (
                              <td data-label="Event Id">#{a.auction_number}</td>
                            )}
                            <td data-label="Event / CUG">
                              <button
                                className="auction-title"
                                onClick={() => void enterAuction(a.id)}
                              >
                                {a.title}
                              </button>
                              <small>{a.insurer}</small>
                            </td>
                            <td data-label="Location">{a.location}</td>
                            <td data-label="Start">{date(a.starts_at)}</td>
                            <td data-label="Close">
                              {date(a.ends_at)}
                              {a.status === 'LIVE' && (
                                <small>
                                  <Countdown until={a.ends_at} now={now} />
                                </small>
                              )}
                            </td>
                            <td data-label="Vehicles">
                              <strong>{a.lot_count}</strong>
                              <small>{a.bid_count} bids</small>
                            </td>
                            <td data-label="Status">
                              <Badge
                                status={a.cancelled_at ? 'CANCELLED' : a.status}
                              />
                            </td>
                            <td data-label="Action">
                              {isAdmin ? (
                                <EventActions
                                  auction={a}
                                  busy={busy}
                                  onEnter={() => openAuction(a.id)}
                                  onEdit={() => void editAuction(a)}
                                  onAdd={() => setOperationAuction(a)}
                                  onDone={refresh}
                                />
                              ) : (
                                <button
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => void enterAuction(a.id)}
                                >
                                  Enter
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
              {!rows.length && (
                <div className="empty-panel">
                  <div className="empty-icon">
                    {section === 'users' ? '◎' : '▱'}
                  </div>
                  <h3>
                    {loading
                      ? 'Loading…'
                      : query
                        ? 'No matching results'
                        : section === 'users'
                          ? 'No users in this view'
                          : `No ${tab.toLowerCase()} auctions yet`}
                  </h3>
                  <p>
                    {query
                      ? 'Try another search.'
                      : section === 'auctions' && isAdmin
                        ? 'Schedule an insurance auction to add your vehicle inventory.'
                        : section === 'auctions'
                          ? 'Auctions will appear here when they are available.'
                          : 'Add a user or choose another status.'}
                  </p>
                </div>
              )}
              <div className="table-footer">
                <label>
                  Rows{' '}
                  <select
                    aria-label="Rows per page"
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    {[5, 10, 25, 50, 100].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <span>
                  Showing {rows.length ? (safePage - 1) * pageSize + 1 : 0}–
                  {Math.min(safePage * pageSize, rows.length)} of {rows.length}{' '}
                  {section === 'users' ? 'users' : 'auctions'}
                </span>
                <div>
                  <button
                    className="btn btn-sm btn-light"
                    disabled={safePage <= 1}
                    onClick={() => setPage(safePage - 1)}
                  >
                    ←
                  </button>
                  <span className="page-number">{safePage}</span>
                  <button
                    className="btn btn-sm btn-light"
                    disabled={safePage * pageSize >= rows.length}
                    onClick={() => setPage(safePage + 1)}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        <footer className="site-footer">
          <Brand />
          <span>
            RETHINK <i>/</i> REVALUE <i>/</i> REUSE
          </span>
          <span>All displayed auction times are IST.</span>
        </footer>
      </main>
      {userForm && (
        <UserForm
          initialRole={userStatus === 'ADMIN' ? 'ADMIN' : 'BUYER'}
          user={userForm === 'new' ? undefined : userForm}
          onClose={() => setUserForm(null)}
          onSave={async (data) => {
            await api(
              userForm === 'new' ? '/users' : `/users/${userForm.id}`,
              userForm === 'new' ? 'POST' : 'PUT',
              data,
            );
            setUserForm(null);
            setNotice('User saved.');
            await refresh();
          }}
        />
      )}
      {operationAuction && (
        <AddVehicles
          auction={operationAuction}
          onClose={() => setOperationAuction(null)}
          onSaved={refresh}
        />
      )}
      {entryTerms && (
        <AuctionEntry
          key={entryTerms.auction.id}
          detail={entryTerms}
          onClose={() => {
            const a = entryTerms.auction;
            setEntryTerms(null);
            if (selected === a.id) navigate('auctions', a.status);
          }}
          onAgree={() => {
            const id = entryTerms.auction.id;
            reviewedEntries.current.add(id);
            setEntryTerms(null);
            openAuction(id);
          }}
        />
      )}
      {statusUser && (
        <UserStatus
          user={statusUser}
          auctions={auctions}
          onClose={() => setStatusUser(null)}
          onSaved={refresh}
        />
      )}
      {pendingBid && (
        <BidConfirmation
          {...pendingBid}
          busy={busy}
          onClose={() => setPendingBid(null)}
          onConfirm={() => {
            const bid = pendingBid;
            setPendingBid(null);
            void confirmBid(bid);
          }}
        />
      )}
      {addingVehicles && detail && (
        <AddVehicles
          auction={detail.auction}
          onClose={() => setAddingVehicles(false)}
          onSaved={refresh}
        />
      )}
      {userDetails && (
        <UserDetails
          id={userDetails}
          auctions={auctions}
          onClose={() => setUserDetails(null)}
        />
      )}
      {vehicleDetails && (
        <VehicleDetails
          lot={vehicleDetails}
          admin={canManageEvents}
          initialEdit={editingVehicle}
          onClose={() => setVehicleDetails(null)}
          onSaved={refresh}
        />
      )}
      {auctionForm && (
        <AuctionForm
          initial={auctionForm === 'new' ? undefined : auctionForm}
          onClose={() => setAuctionForm(null)}
          onSave={async (data, files) => {
            let saved: { id: string };
            if (auctionForm === 'new') {
              const excel = (files || []).find((f) =>
                f.name.toLowerCase().endsWith('.xlsx'),
              );
              const pdf = (files || []).find((f) =>
                f.name.toLowerCase().endsWith('.pdf'),
              );
              if (!excel || !pdf)
                throw new Error(
                  'Attach both Terms Excel and Terms PDF before scheduling.',
                );
              const body = new FormData();
              body.append('payload', JSON.stringify(data));
              body.append('terms_excel', excel);
              body.append('terms_pdf', pdf);
              const zip = (files || []).find((f) =>
                f.name.toLowerCase().endsWith('.zip'),
              );
              if (zip) body.append('images_zip', zip);
              const extra = (files || []).find(
                (f) => f !== excel && f !== pdf && f !== zip,
              );
              if (extra) body.append('additional_terms', extra);
              saved = await api<{ id: string }>(
                '/workflow/schedule',
                'POST',
                body,
              );
            } else
              saved = await api<{ id: string }>(
                `/auctions/${auctionForm.auction.id}`,
                'PUT',
                data,
              );
            const id =
              auctionForm === 'new' ? saved.id : auctionForm.auction.id;
            setAuctionForm(null);
            for (const file of auctionForm === 'new' ? [] : files || []) {
              try {
                const form = new FormData();
                form.append('file', file);
                await api(
                  file.name.toLowerCase().endsWith('.zip')
                    ? '/auctions/' + id + '/images'
                    : '/files/auction/' + id,
                  'POST',
                  form,
                );
              } catch (e) {
                setError(
                  'Auction saved, but an attachment failed: ' +
                    (e as Error).message +
                    '. Use Link Images for ZIP photos or Terms & conditions for documents to retry the failed upload.',
                );
              }
            }
            setNotice(
              'Auction saved. It will start automatically at its scheduled time.',
            );
            await refresh();
          }}
        />
      )}
    </>
  );
}
