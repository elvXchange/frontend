import { useEffect, useState } from 'react';
import {
  api,
  Badge,
  Field,
  Modal,
  date,
  rupees,
  type Auction,
  type Detail,
  type Lot,
  type User,
} from '../../shared/components/shared';
import { FilePanel } from '../users/core';

export function PublicAuctions({
  onEnter,
}: {
  onEnter: (auction: Auction) => void;
}) {
  const [auctions, setAuctions] = useState<Auction[]>([]),
    [tab, setTab] = useState('LIVE'),
    [error, setError] = useState('');
  useEffect(() => {
    api<{ auctions: Auction[] }>('/public/auctions')
      .then((r) => setAuctions(r.auctions))
      .catch(() =>
        setError('Auction preview could not load. You can still sign in.'),
      );
  }, []);
  const rows = auctions.filter((a) => a.status === tab);
  return (
    <section id="auction-solution" className="content-card public-auctions">
      <div className="tabs">
        {['LIVE', 'UPCOMING'].map((s) => (
          <button
            key={s}
            className={tab === s ? 'active' : ''}
            onClick={() => setTab(s)}
          >
            {s === 'LIVE' ? 'Live Auctions' : 'Upcoming Auctions'}
          </button>
        ))}
      </div>
      <div className="entity-tabs">
        <span className="active">Insurance ({rows.length})</span>
      </div>
      {error && <p className="alert alert-warning">{error}</p>}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Event / CUG</th>
              <th>Location</th>
              <th>Start time</th>
              <th>Closing time</th>
              <th>No. of vehicles</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.title}</strong>
                  <small>{a.insurer}</small>
                </td>
                <td>{a.location}</td>
                <td>{date(a.starts_at)}</td>
                <td>{date(a.ends_at)}</td>
                <td>{a.lot_count}</td>
                <td>
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() => onEnter(a)}
                  >
                    Enter
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && !error && (
        <p className="empty-panel">
          No {tab.toLowerCase()} insurance auctions available.
        </p>
      )}
    </section>
  );
}

type Operation = 'extend' | 'banner' | 'cancel' | 'block';
export function EventActions({
  auction,
  busy,
  onEnter,
  onEdit,
  onAdd,
  onDone,
  includeEnter = true,
}: {
  auction: Auction;
  busy: boolean;
  onEnter: () => void;
  onEdit: () => void;
  onAdd: () => void;
  onDone: () => Promise<void>;
  includeEnter?: boolean;
}) {
  const [operation, setOperation] = useState<Operation | null>(null),
    [minutes, setMinutes] = useState(5),
    [reason, setReason] = useState(''),
    [banner, setBanner] = useState(auction.banner || ''),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const labels = {
    extend: 'Extend Auction',
    banner: 'Banner',
    cancel: 'Cancel Auction',
    block: 'Block trained buyers',
  };
  function open(op: Operation) {
    setReason('');
    setError('');
    setBanner(auction.banner || '');
    setOperation(op);
  }
  async function save() {
    setSaving(true);
    setError('');
    try {
      const body =
        operation === 'extend'
          ? { seconds: minutes * 60, reason }
          : operation === 'banner'
            ? { banner }
            : { reason };
      await api(
        `/auctions/${auction.id}/${operation === 'block' ? 'block-trained' : operation}`,
        operation === 'banner' ? 'PUT' : 'POST',
        body,
      );
      setOperation(null);
      await onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="event-actions">
        {includeEnter && (
          <button className="btn btn-outline-success btn-sm" onClick={onEnter}>
            Enter
          </button>
        )}
        {auction.status === 'UPCOMING' && (
          <button
            className="icon-action"
            title="Reschedule"
            aria-label={`Reschedule ${auction.title}`}
            disabled={busy}
            onClick={onEdit}
          >
            ◷
          </button>
        )}
        {auction.status === 'LIVE' && (
          <>
            <button
              className="icon-action"
              title="Extend Auction"
              aria-label={`Extend ${auction.title}`}
              disabled={busy}
              onClick={() => open('extend')}
            >
              ↗
            </button>
            <button
              className="icon-action"
              title="Add Vehicle"
              aria-label={`Add vehicles to ${auction.title}`}
              disabled={busy}
              onClick={onAdd}
            >
              ＋
            </button>
            <button
              className="icon-action"
              title="Banner"
              aria-label={`Edit banner for ${auction.title}`}
              disabled={busy}
              onClick={() => open('banner')}
            >
              ✎
            </button>
          </>
        )}
        <a
          className="icon-action"
          title="Download Inventory"
          aria-label={`Download inventory for ${auction.title}`}
          href={`/api/auctions/${auction.id}/inventory`}
        >
          ↓
        </a>
        {auction.status !== 'CLOSED' && (
          <>
            <button
              className="icon-action"
              title="Block trained buyers"
              aria-label={`Block trained buyers for ${auction.title}`}
              disabled={busy}
              onClick={() => open('block')}
            >
              ⊘
            </button>
            <button
              className="icon-action danger"
              title="Cancel Auction"
              aria-label={`Cancel ${auction.title}`}
              disabled={busy}
              onClick={() => open('cancel')}
            >
              ✕
            </button>
          </>
        )}
      </div>
      {operation && (
        <Modal
          title={labels[operation]}
          onClose={() => {
            if (!saving) setOperation(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="operation-event">
              <strong>{auction.title}</strong>
              <small>
                Start: {date(auction.starts_at)} · Close:{' '}
                {date(auction.ends_at)}
              </small>
            </div>
            {operation === 'extend' && (
              <Field label="Extend auction by (minutes)">
                <input
                  className="form-control"
                  required
                  type="number"
                  min={1}
                  max={1440}
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                />
              </Field>
            )}
            {operation === 'banner' ? (
              <Field label="Banner Text">
                <textarea
                  className="form-control"
                  rows={4}
                  maxLength={500}
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                />
              </Field>
            ) : (
              <>
                <p>
                  {operation === 'cancel'
                    ? 'Remaining open vehicles will be cancelled. Accepted bid history will be preserved.'
                    : operation === 'block'
                      ? 'This blocks trained buyers for this auction only; their account statuses stay unchanged.'
                      : 'The end times of remaining open vehicles will be extended.'}
                </p>
                <Field label="Remarks">
                  <textarea
                    className="form-control"
                    required
                    minLength={3}
                    maxLength={1000}
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
              </>
            )}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-light"
                disabled={saving}
                onClick={() => setOperation(null)}
              >
                Cancel
              </button>
              <button className="btn btn-success" disabled={saving}>
                {saving
                  ? 'Saving…'
                  : operation === 'extend'
                    ? 'Extend'
                    : operation === 'block'
                      ? 'Yes, block buyers'
                      : operation === 'cancel'
                        ? 'Submit'
                        : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function VehicleThumbnail({
  lot,
  onOpen,
}: {
  lot: Lot;
  onOpen: () => void;
}) {
  return (
    <button
      className="vehicle-thumbnail"
      onClick={onOpen}
      aria-label={`View images for ${lot.registration}`}
    >
      {lot.image_id ? (
        <img
          src={`/api/files/${lot.image_id}`}
          alt={`${lot.make} ${lot.model}`}
        />
      ) : (
        <>
          <svg viewBox="0 0 100 64" fill="none" aria-hidden="true">
            <path
              d="M17 37l8-20h49l10 20M10 37h80v17H10zM29 17l5-7h30l10 7M25 37h50"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="26" cy="53" r="8" fill="currentColor" />
            <circle cx="75" cy="53" r="8" fill="currentColor" />
          </svg>
          <span>No image</span>
        </>
      )}
    </button>
  );
}
export function BidConfirmation({
  lot,
  amount,
  auto,
  busy,
  onConfirm,
  onClose,
}: {
  lot: Lot;
  amount: number;
  auto: boolean;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Bid Confirmation" onClose={onClose}>
      <div className="confirmation-summary">
        <h3>
          {lot.make} {lot.model}
        </h3>
        <p>{lot.registration}</p>
        <span>{auto ? 'Your Auto Bid Maximum' : 'Your Bid Amount'}</span>
        <strong>{rupees(amount)}</strong>
      </div>
      <p>Confirm the vehicle and amount. Accepted bids cannot be withdrawn.</p>
      {auto && (
        <p>
          Automatic bids will stay within this maximum. Your maximum is private.
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-light" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-success" disabled={busy} onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </Modal>
  );
}
export function AuctionEntry({
  detail,
  onAgree,
  onClose,
}: {
  detail: Detail;
  onAgree: () => void;
  onClose: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  return (
    <Modal title="Terms & Conditions" onClose={onClose}>
      <h3 className="h5">{detail.auction.title}</h3>
      <div className="entry-terms">
        {detail.auction.terms ||
          'Review the auction details and any attached terms before participating.'}
      </div>
      <FilePanel owner="auction" id={detail.auction.id} editable={false} />
      <label className="agreement-check">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        I have reviewed the auction details and the terms shown above.
      </label>
      <div className="form-actions">
        <button className="btn btn-light" onClick={onClose}>
          Disagree
        </button>
        <button
          className="btn btn-success"
          disabled={!agreed}
          onClick={onAgree}
        >
          Agree
        </button>
      </div>
    </Modal>
  );
}
export function UserStatus({
  user,
  auctions,
  onClose,
  onSaved,
}: {
  user: User;
  auctions: Auction[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [status, setStatus] = useState(user.status),
    [reason, setReason] = useState(''),
    [target, setTarget] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const options =
    user.role === 'ADMIN'
      ? ['ACTIVE', 'BLOCKED']
      : [
          'UNVERIFIED',
          'VERIFIED',
          'TRAINED',
          'BLOCKED',
          'REJECTED',
          'SSB',
          'ASB',
          ...(user.status === 'ACTIVE' ? ['ACTIVE'] : []),
          ...(user.status === 'PENDING' ? ['PENDING'] : []),
        ];
  return (
    <Modal
      title="Change User Status"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            if (status === 'SSB' || status === 'ASB')
              await api(`/users/${user.id}/blocks`, 'POST', {
                [status === 'SSB' ? 'insurer' : 'auction_id']: target,
                reason,
              });
            else
              await api(`/users/${user.id}`, 'PUT', {
                ...user,
                password: undefined,
                status,
                status_reason: reason,
              });
            await onSaved();
            onClose();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <p>
          <strong>{user.name}</strong> · {user.username || user.email}
        </p>
        <Field label="Status">
          <select
            className="form-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setTarget('');
            }}
          >
            {options.map((s) => (
              <option key={s} value={s}>
                {s === 'SSB'
                  ? 'Seller Specific Block'
                  : s === 'ASB'
                    ? 'Auction Specific Block'
                    : s[0] + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        {(status === 'SSB' || status === 'ASB') && (
          <Field
            label={
              status === 'SSB' ? 'Seller / Insurance company' : 'Auction Id'
            }
          >
            <select
              className="form-select"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Select…</option>
              {status === 'SSB'
                ? [...new Set(auctions.map((a) => a.insurer))].map((s) => (
                    <option key={s}>{s}</option>
                  ))
                : auctions.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.auction_number} · {a.title}
                    </option>
                  ))}
            </select>
          </Field>
        )}
        <Field label="Remarks">
          <textarea
            className="form-control"
            required
            minLength={3}
            maxLength={1000}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <button
            className="btn btn-light"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn btn-success" disabled={busy}>
            Update
          </button>
        </div>
      </form>
    </Modal>
  );
}
