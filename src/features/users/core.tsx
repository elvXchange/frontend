import { assetUrl } from '../../demo/mode';
import { VehicleCommercial } from '../workflow/operations-ui';
import { useEffect, useState } from 'react';
import {
  api,
  InventoryErrorReport,
  Field,
  Modal,
  Badge,
  date,
  rupees,
  paise,
  localDate,
  type User,
  type Lot,
  type Auction,
} from '../../shared/components/shared';

const profileFields: Record<string, string> = {
  alternate_phone: 'Alternate mobile',
  state: 'State',
  city: 'City',
  address: 'Address',
  pin_code: 'PIN code',
  pan: 'PAN',
  gst: 'GST number',
};
export function CategoryChecks({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="category-checks">
      <legend>Vehicle categories</legend>
      {['2W', '3W', '4W', 'CV', 'CE', 'FE', 'Mixed'].map((c) => (
        <label key={c}>
          <input
            type="checkbox"
            checked={value.includes(c)}
            onChange={() =>
              onChange(
                value.includes(c)
                  ? value.filter((v) => v !== c)
                  : [...value, c],
              )
            }
          />
          {c}
        </label>
      ))}
    </fieldset>
  );
}
export function ProfileFields({
  value,
  onChange,
  section = 'all',
}: {
  value: Record<string, string>;
  onChange: (p: Record<string, string>) => void;
  section?: 'all' | 'basic' | 'contact' | 'identity' | 'gst';
}) {
  const groups = {
    basic: ['state', 'city', 'address', 'pin_code'],
    contact: ['alternate_phone'],
    identity: ['pan'],
    gst: ['gst'],
  };
  return (
    <div className="form-grid">
      {Object.entries(profileFields)
        .filter(([key]) => section === 'all' || groups[section].includes(key))
        .map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              className="form-control"
              maxLength={key === 'address' ? 500 : key === 'pin_code' ? 6 : 100}
              value={value[key] || ''}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          </Field>
        ))}
    </div>
  );
}
export function Registration({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState(['4W']);
  const [form, setForm] = useState({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
    }),
    [profile, setProfile] = useState<Record<string, string>>({}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  function requestClose() {
    if (busy) return;
    if (
      !done &&
      (Object.values(form).some(Boolean) ||
        Object.values(profile).some(Boolean)) &&
      !confirm('Discard the registration details you have entered?')
    )
      return;
    onClose();
  }
  return (
    <Modal
      className="user-editor-modal"
      title="Register buyer account"
      onClose={requestClose}
    >
      <div className="user-editor-grid">
        <div>
          {done ? (
            <>
              <div className="alert alert-success">
                Account created. Sign in with your username or email. An
                administrator must verify and train your account before you can
                bid.
              </div>
              <button className="btn btn-success" onClick={requestClose}>
                Back to sign in
              </button>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError('');
                try {
                  await api('/auth/register', 'POST', {
                    ...form,
                    profile,
                    categories,
                  });
                  setDone(true);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <section className="form-card">
                <h3>User Info</h3>
                <div className="form-grid">
                  {Object.entries({
                    username: 'User name',
                    email: 'Email',
                    phone: 'Mobile number',
                    password: 'Password (12+ characters)',
                  }).map(([k, label]) => (
                    <Field key={k} label={label}>
                      <input
                        required
                        className="form-control"
                        type={
                          k === 'password'
                            ? 'password'
                            : k === 'email'
                              ? 'email'
                              : 'text'
                        }
                        minLength={k === 'password' ? 12 : undefined}
                        maxLength={k === 'password' ? 128 : 160}
                        value={form[k as keyof typeof form]}
                        onChange={(e) =>
                          setForm({ ...form, [k]: e.target.value })
                        }
                      />
                    </Field>
                  ))}
                </div>
                <ProfileFields
                  section="contact"
                  value={profile}
                  onChange={setProfile}
                />
              </section>
              <section className="form-card">
                <h3>Basic Info</h3>
                <Field label="Full name">
                  <input
                    className="form-control"
                    required
                    maxLength={160}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <ProfileFields
                  section="basic"
                  value={profile}
                  onChange={setProfile}
                />
              </section>
              <section className="form-card">
                <h3>Other Info</h3>
                <p>Insurance vehicle auctions</p>
                <CategoryChecks value={categories} onChange={setCategories} />
              </section>
              <section className="form-card">
                <h3>KYC / Documents</h3>
                <ProfileFields
                  section="identity"
                  value={profile}
                  onChange={setProfile}
                />
                <p>
                  After registering, sign in and upload identity documents from
                  Personal Information.
                </p>
              </section>
              <section className="form-card">
                <h3>GST Info</h3>
                <ProfileFields
                  section="gst"
                  value={profile}
                  onChange={setProfile}
                />
              </section>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-success" disabled={busy}>
                  {busy ? 'Registering…' : 'Register'}
                </button>
              </div>
            </form>
          )}
        </div>
        <aside className="user-support-panel">
          <h3>Registration Requirements</h3>
          <ol>
            <li>Enter your account and contact details.</li>
            <li>
              Provide identity details and upload documents after sign-in.
            </li>
            <li>An administrator verifies and trains your account.</li>
            <li>Review each auction's terms before entering.</li>
          </ol>
          <p>Registration alone does not enable bidding.</p>
        </aside>
      </div>
    </Modal>
  );
}
export function FilePanel({
  owner,
  id,
  editable,
}: {
  owner: 'lot' | 'auction' | 'user';
  id: string;
  editable: boolean;
}) {
  const [files, setFiles] = useState<
      { id: string; name: string; mime: string }[]
    >([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setFiles(await api(`/files?owner=${owner}&id=${id}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [owner, id]);
  return (
    <div className="file-panel">
      <div className="photo-grid">
        {files.map((f) =>
          f.mime.startsWith('image/') ? (
            <a
              key={f.id}
              href={assetUrl(`/api/files/${f.id}`)}
              target="_blank"
              rel="noreferrer"
            >
              <img src={assetUrl(`/api/files/${f.id}`)} alt={f.name} />
            </a>
          ) : (
            <a
              key={f.id}
              className="file-link"
              href={assetUrl(`/api/files/${f.id}`)}
            >
              ↓ {f.name}
            </a>
          ),
        )}
      </div>
      {!files.length && (
        <p className="text-secondary">
          No{' '}
          {owner === 'lot'
            ? 'vehicle photos'
            : owner === 'user'
              ? 'identity documents'
              : 'terms documents'}{' '}
          uploaded.
        </p>
      )}
      {editable && (
        <Field
          label={
            owner === 'lot'
              ? 'Add vehicle photo (PNG/JPEG, max 5 MB)'
              : owner === 'user'
                ? 'Add identity document (PDF/PNG/JPEG, max 5 MB)'
                : 'Upload T & C Excel / PDF (max 5 MB)'
          }
        >
          <input
            className="form-control"
            type="file"
            disabled={busy}
            accept={
              owner === 'lot'
                ? '.png,.jpg,.jpeg'
                : owner === 'user'
                  ? '.pdf,.png,.jpg,.jpeg'
                  : '.pdf,.xlsx'
            }
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setError('');
              try {
                const body = new FormData();
                body.append('file', f);
                await api(`/files/${owner}/${id}`, 'POST', body);
                await load();
                e.target.value = '';
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </Field>
      )}
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
    </div>
  );
}
export function Profile({
  user,
  onUpdate,
  onSignedOut,
}: {
  user: User;
  onUpdate: (u: User) => void;
  onSignedOut: () => void;
}) {
  const [name, setName] = useState(user.name),
    [phone, setPhone] = useState(user.phone),
    [profile, setProfile] = useState(user.profile || {}),
    [password, setPassword] = useState({
      current_password: '',
      new_password: '',
    }),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Personal Information</h1>
          <p>
            {user.username || user.email} · <Badge status={user.status} />
          </p>
        </div>
      </div>
      <div className="content-card profile-card">
        {!['ACTIVE', 'TRAINED'].includes(user.status) && (
          <div className="alert alert-info">
            Your account must be trained and insurance-eligible before bidding.
            Contact the administrator.
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              onUpdate(
                await api<User>('/profile', 'PUT', { name, phone, profile }),
              );
              setNotice('Personal information saved.');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-section-label">USER INFO</div>
          <div className="form-grid">
            <Field label="Full name">
              <input
                className="form-control"
                required
                maxLength={160}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Mobile number">
              <input
                className="form-control"
                maxLength={25}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label="Email / login">
              <input className="form-control" disabled value={user.email} />
            </Field>
          </div>
          <ProfileFields value={profile} onChange={setProfile} />
          <button className="btn btn-success" disabled={busy}>
            Save personal information
          </button>
        </form>
        <details className="manual-entry mt-4">
          <summary>Change password</summary>
          <form
            className="mt-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                await api('/profile/password', 'POST', password);
                onSignedOut();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Current password">
              <input
                className="form-control"
                type="password"
                required
                value={password.current_password}
                onChange={(e) =>
                  setPassword({ ...password, current_password: e.target.value })
                }
              />
            </Field>
            <Field label="New password (12+ characters)">
              <input
                className="form-control"
                type="password"
                required
                minLength={12}
                maxLength={128}
                value={password.new_password}
                onChange={(e) =>
                  setPassword({ ...password, new_password: e.target.value })
                }
              />
            </Field>
            <button className="btn btn-outline-success" disabled={busy}>
              Change password & sign out
            </button>
          </form>
        </details>
        <FilePanel owner="user" id={user.id} editable />
      </div>
    </>
  );
}
type Block = {
  id: string;
  user_id: string;
  insurer: string | null;
  auction_id: string | null;
  auction_title: string | null;
  reason: string;
  name?: string;
  username?: string;
  created_at: string;
};
export function BlockList({
  mode,
  onUser,
}: {
  mode: 'SSB' | 'ASB';
  onUser: (id: string) => void;
}) {
  const [blocks, setBlocks] = useState<Block[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    api<Block[]>('/blocks')
      .then(setBlocks)
      .catch((e) => setError(e.message));
  }, [mode]);
  return (
    <div className="content-card">
      <div className="table-toolbar">
        {mode === 'SSB' ? 'Seller Specific Block' : 'Auction Specific Block'}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>{mode === 'SSB' ? 'Insurer' : 'Auction'}</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {blocks
              .filter((b) => (mode === 'SSB' ? b.insurer : b.auction_id))
              .map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.name}
                    <small>{b.username}</small>
                  </td>
                  <td>{b.insurer || b.auction_title}</td>
                  <td>{b.reason}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => onUser(b.user_id)}
                    >
                      View / unblock
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function BlockedPan() {
  const [rows, setRows] = useState<
      { pan: string; reason: string; updated_at: string }[]
    >([]),
    [pan, setPan] = useState(''),
    [reason, setReason] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState('');
  async function load() {
    try {
      setRows(await api('/blocked-pan'));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="content-card profile-card">
      <h2 className="h5">Blocked PANs</h2>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form
        className="form-grid"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await api('/blocked-pan', 'POST', { pan, reason });
            setPan('');
            setReason('');
            await load();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="PAN">
          <input
            className="form-control"
            required
            pattern="[A-Z]{5}[0-9]{4}[A-Z]"
            maxLength={10}
            value={pan}
            onChange={(e) => setPan(e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Remarks">
          <input
            className="form-control"
            required
            minLength={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <div>
          <button className="btn btn-outline-danger" disabled={busy}>
            Block PAN
          </button>
        </div>
      </form>
      <div className="table-toolbar px-0">
        <label className="search-box">
          <input
            aria-label="Search blocked PANs"
            placeholder="Search PAN or remarks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>PAN</th>
              <th>Remarks</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) =>
                [r.pan, r.reason]
                  .join(' ')
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((r) => (
                <tr key={r.pan}>
                  <td>{r.pan}</td>
                  <td>{r.reason}</td>
                  <td>{date(r.updated_at)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-success"
                      disabled={busy}
                      onClick={async () => {
                        const reason = prompt(
                          'Reason for unblocking (3+ characters)',
                        );
                        if (!reason) return;
                        setBusy(true);
                        setError('');
                        try {
                          await api(`/blocked-pan/${r.pan}/remove`, 'POST', {
                            reason,
                          });
                          await load();
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export function UserDetails({
  id,
  auctions,
  onClose,
}: {
  id: string;
  auctions: Auction[];
  onClose: () => void;
}) {
  const [data, setData] = useState<{
      user: User;
      blocks: Block[];
      history: {
        action: string;
        details: Record<string, string>;
        created_at: string;
        actor: string;
      }[];
    } | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({ type: 'insurer', target: '', reason: '' });
  async function load() {
    try {
      setData(await api(`/users/${id}/details`));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [id]);
  return (
    <Modal title="User details" onClose={onClose}>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {!data ? (
        <p>Loading…</p>
      ) : (
        <>
          <details open className="manual-entry">
            <summary>User Details</summary>
            <div className="detail-grid mt-3">
              {Object.entries({
                Name: data.user.name,
                'User name': data.user.username || data.user.email,
                Email: data.user.email,
                Mobile: data.user.phone,
                Status: data.user.status,
                'Insurance eligible': data.user.insurance_eligible
                  ? 'Yes'
                  : 'No',
                'Vehicle categories': data.user.categories?.join(', '),
                'Permitted locations': data.user.locations?.join(', ') || 'All',
                ...data.user.profile,
              }).map(([k, v]) => (
                <div key={k}>
                  <small>{profileFields[k] || k}</small>
                  <strong>{v || '—'}</strong>
                </div>
              ))}
            </div>
          </details>
          <FilePanel owner="user" id={id} editable />
          {data.user.role === 'BUYER' && (
            <details open className="manual-entry">
              <summary>Seller / Auction Specific Blocks</summary>
              {data.blocks.map((b) => (
                <div className="block-row" key={b.id}>
                  <div>
                    <strong>{b.insurer || b.auction_title}</strong>
                    <small>{b.reason}</small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    disabled={busy}
                    onClick={async () => {
                      const reason = prompt(
                        'Reason for unblocking (at least 3 characters)',
                      );
                      if (!reason) return;
                      setBusy(true);
                      try {
                        await api(
                          `/users/${id}/blocks/${b.id}/remove`,
                          'POST',
                          { reason },
                        );
                        await load();
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
              <form
                className="mt-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError('');
                  try {
                    await api(`/users/${id}/blocks`, 'POST', {
                      [form.type === 'insurer' ? 'insurer' : 'auction_id']:
                        form.target,
                      reason: form.reason,
                    });
                    setForm({ ...form, target: '', reason: '' });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <div className="form-grid">
                  <Field label="Block type">
                    <select
                      className="form-select"
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value, target: '' })
                      }
                    >
                      <option value="insurer">
                        Seller / insurance company
                      </option>
                      <option value="auction">Auction</option>
                    </select>
                  </Field>
                  <Field
                    label={form.type === 'insurer' ? 'Insurer' : 'Auction'}
                  >
                    <select
                      required
                      className="form-select"
                      value={form.target}
                      onChange={(e) =>
                        setForm({ ...form, target: e.target.value })
                      }
                    >
                      <option value="">Select…</option>
                      {form.type === 'insurer'
                        ? [...new Set(auctions.map((a) => a.insurer))].map(
                            (s) => <option key={s}>{s}</option>,
                          )
                        : auctions.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.title}
                            </option>
                          ))}
                    </select>
                  </Field>
                </div>
                <Field label="Remarks / reason">
                  <input
                    className="form-control"
                    required
                    minLength={3}
                    maxLength={1000}
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                  />
                </Field>
                <button className="btn btn-outline-danger" disabled={busy}>
                  Block buyer
                </button>
              </form>
            </details>
          )}
          <details className="manual-entry">
            <summary>Status / block history</summary>
            {data.history.map((h, i) => (
              <div className="block-row" key={i}>
                <div>
                  <strong>{h.action.replaceAll('_', ' ')}</strong>
                  <small>
                    {h.details.old_status
                      ? `${h.details.old_status} → ${h.details.new_status}`
                      : h.details.reason}{' '}
                    · {h.actor}
                  </small>
                </div>
                <small>{date(h.created_at)}</small>
              </div>
            ))}
          </details>
        </>
      )}
    </Modal>
  );
}
export function BuyerLots({
  mode,
  onOpen,
}: {
  mode: 'watchlist' | 'results';
  onOpen: (id: string) => void;
}) {
  const [lots, setLots] = useState<
      (Lot & {
        auction_id: string;
        title: string;
        insurer: string;
        location: string;
      })[]
    >([]),
    [query, setQuery] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    api<typeof lots>(`/buyer-lots?mode=${mode}`)
      .then(setLots)
      .catch((e) => setError(e.message));
  }, [mode]);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{mode === 'watchlist' ? 'Watchlist' : 'My Results'}</h1>
          <p>
            {mode === 'watchlist'
              ? 'Saved vehicles and their current auction status.'
              : 'Your highest-bid results. Sale approval is a separate process.'}
          </p>
        </div>
      </div>
      <div className="content-card">
        <div className="table-toolbar">
          <label className="search-box">
            <input
              aria-label="Search vehicles"
              placeholder="Search vehicle or auction…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Auction / insurer</th>
                <th>Price / status</th>
                <th>Closes (IST)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lots
                .filter((l) =>
                  `${l.registration} ${l.make} ${l.model} ${l.title}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong>{l.registration}</strong>
                      <small>
                        {l.make} {l.model} · {l.year}
                      </small>
                    </td>
                    <td>
                      {l.title}
                      <small>
                        {l.insurer} / {l.location}
                      </small>
                    </td>
                    <td>
                      {rupees(l.current_bid)}
                      <small>
                        {l.status}
                        {l.won
                          ? ' · Highest bidder'
                          : l.is_mine
                            ? ' · Leading'
                            : ''}
                      </small>
                    </td>
                    <td>{date(l.ends_at)}</td>
                    <td>
                      <button
                        className="btn btn-outline-success btn-sm"
                        onClick={() => onOpen(l.auction_id)}
                      >
                        Enter
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!lots.length && (
          <div className="empty-panel">No vehicles in this view.</div>
        )}
      </div>
    </>
  );
}
export function VehicleDetails({
  lot,
  admin,
  onClose,
  onSaved,
  initialEdit = false,
}: {
  lot: Lot;
  admin: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  initialEdit?: boolean;
}) {
  const [editing, setEditing] = useState(initialEdit),
    [form, setForm] = useState(lot),
    [metadata, setMetadata] = useState(lot.metadata || {}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      className="vehicle-editor-modal"
      title={`${lot.registration} · ${lot.make} ${lot.model}`}
      onClose={onClose}
    >
      <VehicleCommercial lot={lot} />
      <div className="vehicle-detail-layout">
        <aside>
          <FilePanel owner="lot" id={lot.id} editable={admin} />
          <div className="workflow-actions">
            <a
              className="btn btn-light btn-sm"
              href={assetUrl(`/api/workflow/lots/${lot.id}/pdf?kind=vehicle`)}
              target="_blank"
              rel="noreferrer"
            >
              Download vehicle PDF
            </a>
            <a
              className="btn btn-light btn-sm"
              href={assetUrl(`/api/workflow/lots/${lot.id}/images.zip`)}
            >
              Download all images
            </a>
          </div>
        </aside>
        <section>
          <div className="auction-meta">
            <div>
              <span>STARTS</span>
              <strong>{date(lot.starts_at)}</strong>
            </div>
            <div>
              <span>CLOSES</span>
              <strong>{date(lot.ends_at)}</strong>
            </div>
            <div>
              <span>STATUS</span>
              <strong>{lot.status}</strong>
            </div>
            <div>
              <span>CURRENT / FINAL BID</span>
              <strong>{rupees(lot.current_bid)}</strong>
            </div>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          {!editing ? (
            <>
              <div className="detail-grid">
                {Object.entries({
                  Registration: lot.registration,
                  Make: lot.make,
                  Model: lot.model,
                  'Make year': lot.year,
                  Fuel: lot.fuel,
                  Condition: lot.condition,
                  ...metadata,
                }).map(([k, v]) => (
                  <div key={k}>
                    <small>{k.replaceAll('_', ' ')}</small>
                    <strong>{String(v || '—')}</strong>
                  </div>
                ))}
              </div>
              {admin && lot.status === 'OPEN' && (
                <button
                  className="btn btn-outline-success mt-4"
                  onClick={() => setEditing(true)}
                >
                  Edit vehicle
                </button>
              )}
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await api(`/lots/${lot.id}`, 'PUT', { ...form, metadata });
                  await onSaved();
                  onClose();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="form-grid">
                {(
                  [
                    'registration',
                    'make',
                    'model',
                    'year',
                    'fuel',
                    'condition',
                  ] as const
                ).map((k) => (
                  <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                    <input
                      className="form-control"
                      required={[
                        'registration',
                        'make',
                        'model',
                        'year',
                      ].includes(k)}
                      type={k === 'year' ? 'number' : 'text'}
                      value={form[k]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [k]:
                            k === 'year'
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                    />
                  </Field>
                ))}
                <Field label="Starting Price (₹)">
                  <input
                    className="form-control"
                    type="number"
                    required
                    min="0.01"
                    max="1000000000"
                    step="0.01"
                    disabled={lot.bid_count > 0}
                    value={form.starting_price / 100}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        starting_price: paise(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Bid Increment (₹)">
                  <input
                    className="form-control"
                    type="number"
                    required
                    min="0.01"
                    max="1000000000"
                    step="0.01"
                    disabled={lot.bid_count > 0}
                    value={form.increment / 100}
                    onChange={(e) =>
                      setForm({ ...form, increment: paise(e.target.value) })
                    }
                  />
                </Field>
                {Object.entries({
                  variant: 'Variant',
                  rc_status: 'RC status (WITH RC / WITHOUT RC / UNKNOWN)',
                  owner_count: 'Owner count',
                  yard: 'Yard / parking address',
                  engine_no: 'Engine number',
                  chassis_no: 'Chassis number',
                  claim_no: 'Claim / reference number',
                  loan_account_no: 'LAN number',
                  contact_name: 'Inspection contact person',
                  contact_number: 'Inspection contact number',
                  transmission: 'Transmission',
                  colour: 'Colour',
                  mileage: 'Mileage (km)',
                }).map(([k, label]) => (
                  <Field key={k} label={label}>
                    <input
                      className="form-control"
                      type={
                        ['owner_count', 'mileage'].includes(k)
                          ? 'number'
                          : 'text'
                      }
                      value={
                        metadata[k] ??
                        (k === 'rc_status'
                          ? 'UNKNOWN'
                          : ['owner_count', 'mileage'].includes(k)
                            ? 0
                            : '')
                      }
                      onChange={(e) =>
                        setMetadata({
                          ...metadata,
                          [k]: ['owner_count', 'mileage'].includes(k)
                            ? Number(e.target.value)
                            : e.target.value,
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-success" disabled={busy}>
                  Save vehicle
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </Modal>
  );
}

export function Participants({ id }: { id: string }) {
  const [rows, setRows] = useState<
      {
        id: string;
        name: string;
        username: string;
        bid_count: number;
        maximum_bid: number;
        last_bid: string;
      }[]
    >([]),
    [error, setError] = useState('');
  useEffect(() => {
    api<typeof rows>(`/auctions/${id}/participants`)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <div className="table-responsive">
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Buyer</th>
            <th>Bids</th>
            <th>Highest placed bid</th>
            <th>Last bid (IST)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                {r.name}
                <small>{r.username}</small>
              </td>
              <td>{r.bid_count}</td>
              <td>{rupees(r.maximum_bid)}</td>
              <td>{date(r.last_bid)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty-panel">No bidding participants yet.</div>
      )}
    </div>
  );
}
export function AddVehicles({
  auction,
  onClose,
  onSaved,
}: {
  auction: Auction;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [errorReport, setErrorReport] = useState('');
  const [lots, setLots] = useState<unknown[]>([]),
    [form, setForm] = useState({
      registration: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      fuel: '',
      condition: '',
      starting_price: '',
      increment: '500',
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <Modal title={`Add vehicles · ${auction.title}`} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          setErrorReport('');
          try {
            await api(`/auctions/${auction.id}/lots`, 'POST', {
              lots: lots.length
                ? lots
                : [
                    {
                      ...form,
                      starting_price: paise(form.starting_price),
                      increment: paise(form.increment),
                    },
                  ],
            });
            await onSaved();
            onClose();
          } catch (e) {
            setError((e as Error).message);
            setErrorReport(
              (e as Error & { reportBase64?: string }).reportBase64 || '',
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="upload-box">
          <div>
            <a href={assetUrl('/api/inventory/template')} download>
              Download Inventory Template
            </a>
            <p>
              Upload adds vehicles to this event. Existing registrations cannot
              be duplicated.
            </p>
          </div>
          <Field label="Inventory File (.xlsx)">
            <input
              className="form-control"
              type="file"
              accept=".xlsx"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                setError('');
                setErrorReport('');
                try {
                  const data = new FormData();
                  data.append('inventory', file);
                  setLots(
                    await api<unknown[]>('/inventory/preview', 'POST', data),
                  );
                } catch (e) {
                  setError((e as Error).message);
                  setErrorReport(
                    (e as Error & { reportBase64?: string }).reportBase64 || '',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Field>
        </div>
        {lots.length ? (
          <>
            <p>{lots.length} vehicles validated and ready to add.</p>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setLots([])}
            >
              Use manual entry instead
            </button>
          </>
        ) : (
          <div className="form-grid">
            {Object.keys(form).map((k) => (
              <Field
                key={k}
                label={
                  k === 'starting_price'
                    ? 'Starting price (₹)'
                    : k === 'increment'
                      ? 'Bid increment (₹)'
                      : k.replaceAll('_', ' ')
                }
              >
                <input
                  required={[
                    'registration',
                    'make',
                    'model',
                    'year',
                    'starting_price',
                    'increment',
                  ].includes(k)}
                  className="form-control"
                  type={
                    ['year', 'starting_price', 'increment'].includes(k)
                      ? 'number'
                      : 'text'
                  }
                  min={k === 'year' ? 1900 : '0.01'}
                  step={k === 'year' ? 1 : '0.01'}
                  value={form[k as keyof typeof form]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [k]:
                        k === 'year' ? Number(e.target.value) : e.target.value,
                    })
                  }
                />
              </Field>
            ))}
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <InventoryErrorReport base64={errorReport} />
        <div className="form-actions">
          <button className="btn btn-success" disabled={busy}>
            Add vehicles
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function LinkImages({ auctions }: { auctions: Auction[] }) {
  const [auctionId, setAuctionId] = useState(''),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow text-success">
            INSURANCE / VEHICLE IMAGES
          </span>
          <h1>Link Images</h1>
          <p>
            Match photo folders to vehicle registrations in an existing auction.
          </p>
        </div>
      </div>
      <div className="content-card profile-card">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!file) return;
            setBusy(true);
            setError('');
            setNotice('');
            try {
              const body = new FormData();
              body.append('file', file);
              const result = await api<{ files: number; vehicles: number }>(
                `/auctions/${auctionId}/images`,
                'POST',
                body,
              );
              setNotice(
                `${result.files} photos linked to ${result.vehicles} vehicles. Open vehicle details to verify them.`,
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Auction">
            <select
              className="form-select"
              required
              value={auctionId}
              onChange={(e) => {
                setAuctionId(e.target.value);
                setNotice('');
              }}
            >
              <option value="">Select auction…</option>
              {auctions.map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.auction_number} · {a.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="upload-box">
            <div>
              <strong>ZIP folder layout</strong>
              <p>
                Create one folder for each vehicle registration. Put its JPG/PNG
                photos inside it, then ZIP those vehicle folders together.
              </p>
              <code>REGISTRATION/photo-1.jpg</code>
              <p>
                Use the exact registration shown in the auction. Limits: 10 MB
                ZIP, 50 MB expanded, 5 MB per photo, 20 photos per vehicle. A
                mismatched folder rejects the complete batch.
              </p>
            </div>
          </div>
          <Field label="Upload Images (.zip)">
            <input
              className="form-control"
              type="file"
              accept=".zip"
              required
              disabled={busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setNotice('');
              }}
            />
          </Field>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="alert alert-success" role="status">
              {notice}
            </div>
          )}
          <button
            className="btn btn-success"
            disabled={busy || !auctionId || !file}
          >
            {busy ? 'Linking photos…' : 'Upload & link images'}
          </button>
        </form>
      </div>
    </>
  );
}
