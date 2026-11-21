import { useState } from 'react';
import { AuctionForm } from '../auctions/AuctionForm';
import { BlockedPan, LinkImages } from '../users/core';
import { ReferenceImages } from './workflow';
import { Modal, type Auction, type User } from '../../shared/components/shared';

const categories = ['2W', '3W', '4W', 'CV', 'CE', 'FE', 'Mixed'];
const unique = (values: string[]) =>
  [...new Set(values.filter(Boolean))].sort();

export function OperationsPage({
  page,
  auctions,
  users,
  user,
}: {
  page: string;
  auctions: Auction[];
  users: User[];
  user: User;
}) {
  const [notice, setNotice] = useState('');
  const [formKey, setFormKey] = useState(0);
  const locations = unique(auctions.map((a) => a.location));
  const sellers = unique(auctions.map((a) => a.insurer));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow text-success">OPERATIONS</span>
          <h1>{page}</h1>
          <p>
            {page === 'Schedule Auctions'
              ? 'Prepare an insurance auction, inventory and terms.'
              : page === 'Link Images'
                ? 'Match vehicle images to an auction and inventory.'
                : page.startsWith('Import ')
                  ? 'Select a workbook and review the import requirements.'
                  : page === 'Calling Master'
                    ? 'Assign vehicle categories, regions and sellers to a telecaller.'
                    : page === 'Activity Logs'
                      ? 'Review workspace activity by operator, action and date.'
                      : 'Manage your insurance auction records.'}
          </p>
        </div>
      </div>
      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}
      {page === 'Schedule Auctions' ? (
        <>
          <DraftNotice />
          <AuctionForm
            key={formKey}
            inline
            onClose={() => {
              setFormKey((k) => k + 1);
              setNotice('');
            }}
            onSave={async () => {
              setNotice('Auction draft reviewed. It has not been scheduled.');
            }}
          />
        </>
      ) : page === 'Link Images' ? (
        <>
          <LinkImages auctions={auctions} />
          <ReferenceImages auctions={auctions} user={user} />
        </>
      ) : page === 'Blocked PANs' ? (
        <BlockedPan />
      ) : page === 'Activity Logs' ? (
        <ActivityLogs />
      ) : page === 'Calling Master' ? (
        <CallingMaster users={users} locations={locations} sellers={sellers} />
      ) : page.startsWith('Import ') ? (
        <ImportPage page={page} />
      ) : (
        <CatalogPage
          page={page}
          values={
            page === 'Locations'
              ? locations
              : page === 'Sellers'
                ? sellers
                : categories
          }
          auctions={auctions}
        />
      )}
    </>
  );
}

function DraftNotice() {
  return (
    <p className="operations-draft-note">
      <strong>Draft preview.</strong> Changes on this screen are kept only while
      this page is open.
    </p>
  );
}

type CatalogRow = {
  id: string;
  name: string;
  code: string;
  detail: string;
  status: string;
  draft?: boolean;
};
function CatalogPage({
  page,
  values,
  auctions,
}: {
  page: string;
  values: string[];
  auctions: Auction[];
}) {
  const [rows, setRows] = useState<CatalogRow[]>(() =>
    values.map((name) => ({
      id: name,
      name,
      code:
        page === 'Sellers'
          ? auctions.find((a) => a.insurer === name)?.seller_code || ''
          : '',
      detail: '',
      status: 'Active',
    })),
  );
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [error, setError] = useState('');
  const singular =
    page === 'Locations'
      ? 'Location'
      : page === 'Sellers'
        ? 'Seller'
        : 'Category';
  const filtered = rows.filter((r) =>
    `${r.name} ${r.code} ${r.detail}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <DraftNotice />
      <div className="content-card">
        <div className="table-toolbar">
          <strong>
            {page} ({rows.length})
          </strong>
          <div className="toolbar-right">
            <input
              className="form-control"
              aria-label={`Search ${page}`}
              placeholder={`Search ${page.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              className="btn btn-success"
              onClick={() => {
                setError('');
                setEditing({
                  id: crypto.randomUUID(),
                  name: '',
                  code: '',
                  detail: '',
                  status: 'Active',
                  draft: true,
                });
              }}
            >
              + Add {singular}
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>{singular}</th>
                <th>{page === 'Locations' ? 'State / Region' : 'Code'}</th>
                <th>{page === 'Sellers' ? 'Email' : 'Description'}</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    {row.draft && <small>Draft</small>}
                  </td>
                  <td>{row.code || '—'}</td>
                  <td>{row.detail || '—'}</td>
                  <td>{row.status}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => {
                        setError('');
                        setEditing({ ...row });
                      }}
                    >
                      Edit draft
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="empty-panel">
            No {page.toLowerCase()} match this view.
          </div>
        )}
        <div className="table-footer">{filtered.length} records</div>
      </div>
      {editing && (
        <Modal title={`${singular} draft`} onClose={() => setEditing(null)}>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                rows.some(
                  (r) =>
                    r.id !== editing.id &&
                    r.name.toLowerCase() === editing.name.trim().toLowerCase(),
                )
              ) {
                setError('This name is already in the list.');
                return;
              }
              setRows((old) => [
                ...old.filter((r) => r.id !== editing.id),
                { ...editing, name: editing.name.trim(), draft: true },
              ]);
              setEditing(null);
            }}
          >
            <label>
              {singular} name
              <input
                required
                maxLength={160}
                className="form-control"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label>
              {page === 'Locations' ? 'State / Region' : 'Code'}
              <input
                maxLength={160}
                className="form-control"
                value={editing.code}
                onChange={(e) =>
                  setEditing({ ...editing, code: e.target.value })
                }
              />
            </label>
            <label>
              {page === 'Sellers' ? 'Email' : 'Description'}
              <input
                type={page === 'Sellers' ? 'email' : 'text'}
                maxLength={254}
                className="form-control"
                value={editing.detail}
                onChange={(e) =>
                  setEditing({ ...editing, detail: e.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                className="form-select"
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value })
                }
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
            {error && (
              <p className="alert alert-danger" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="btn btn-success">Save draft</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

const importColumns = {
  'Import RSD': [
    'Buyer User Name',
    'Seller',
    'Amount INR',
    'Reference',
    'Request ID',
    'Remarks',
  ],
  'Import Adjustments': [
    'Buyer User Name',
    'Seller',
    'Amount INR',
    'Reference',
    'Request ID',
    'Remarks',
  ],
  'Import Credit Limit': [
    'Buyer User Name',
    'Seller',
    'Amount Limit INR',
    'Vehicle Limit',
    'Remarks',
  ],
};
function ImportPage({ page }: { page: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const columns = importColumns[page as keyof typeof importColumns];
  return (
    <div className="content-card operations-import-page">
      <div className="form-section-label">{page} workbook</div>
      <p>
        Use one buyer and seller per row. Amounts must be entered in INR.
        {page === 'Import Adjustments' &&
          ' Adjustments reduce the available RSD balance.'}
      </p>
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          setReviewed(true);
        }}
      >
        <label>
          Workbook (.xlsx or .csv)
          <input
            className="form-control"
            type="file"
            required
            accept=".xlsx,.csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setReviewed(false);
            }}
          />
        </label>
        <label>
          Import remarks
          <input
            className="form-control"
            required
            minLength={3}
            maxLength={2000}
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setReviewed(false);
            }}
          />
        </label>
        <div className="workflow-actions wide">
          <a
            className="btn btn-outline-success"
            href={
              'data:text/csv;charset=utf-8,' +
              encodeURIComponent(columns.join(',') + '\r\n')
            }
            download={`ELVXCHANGE-${page.toLowerCase().replaceAll(' ', '-')}-template.csv`}
          >
            Download CSV template
          </a>
          <button className="btn btn-success">Review selection</button>
        </div>
      </form>
      <div className="form-section-label">Required columns</div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length}>
                Your file rows will appear here after import validation is
                available.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {file && (
        <div className="operations-file-summary">
          <strong>{file.name}</strong>
          <span>{Math.ceil(file.size / 1024)} KB</span>
        </div>
      )}
      {reviewed && (
        <p className="alert alert-info" role="status">
          File selection reviewed. File contents have not been validated or
          imported.
        </p>
      )}
      <div className="form-actions">
        <span>Import processing is not connected yet.</span>
        <button className="btn btn-success" disabled>
          Import records
        </button>
      </div>
    </div>
  );
}

type CallingDraft = {
  categories: string[];
  locations: string[];
  sellers: string[];
};
function CallingMaster({
  users,
  locations,
  sellers,
}: {
  users: User[];
  locations: string[];
  sellers: string[];
}) {
  const [telecaller, setTelecaller] = useState('');
  const [drafts, setDrafts] = useState<Record<string, CallingDraft>>({});
  const [notice, setNotice] = useState('');
  const person = users.find((u) => u.id === telecaller);
  const selected = drafts[telecaller] || {
    categories: person?.categories || [],
    locations: person?.locations || [],
    sellers: person?.assigned_insurers || [],
  };
  return (
    <>
      <DraftNotice />
      <div className="content-card operations-calling-page">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNotice(
              'Calling assignment draft ready. No account access has been changed.',
            );
          }}
        >
          <div className="table-toolbar">
            <label>
              Business entity
              <input className="form-control" readOnly value="Insurance" />
            </label>
            <label>
              Telecaller
              <select
                required
                className="form-select"
                value={telecaller}
                onChange={(e) => {
                  setTelecaller(e.target.value);
                  setNotice('');
                }}
              >
                <option value="">Select telecaller…</option>
                {users
                  .filter((u) => u.role === 'TELECALLER')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="operations-assignment-grid">
            {(
              [
                ['categories', 'Vehicle Type', categories],
                ['locations', 'Region / Locations', locations],
                ['sellers', 'Sellers', sellers],
              ] as const
            ).map(([key, label, values]) => (
              <fieldset key={key} disabled={!telecaller}>
                <legend>{label}</legend>
                <div>
                  {values.map((v) => (
                    <label key={v}>
                      <input
                        type="checkbox"
                        checked={selected[key].includes(v)}
                        onChange={(e) => {
                          setDrafts({
                            ...drafts,
                            [telecaller]: {
                              ...selected,
                              [key]: e.target.checked
                                ? [...selected[key], v]
                                : selected[key].filter((item) => item !== v),
                            },
                          });
                          setNotice('');
                        }}
                      />
                      {v}
                    </label>
                  ))}
                  {!values.length && <p>No records available.</p>}
                </div>
              </fieldset>
            ))}
          </div>
          {notice && (
            <p className="alert alert-success" role="status">
              {notice}
            </p>
          )}
          <div className="form-actions">
            <button className="btn btn-success" disabled={!telecaller}>
              Save assignment draft
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function ActivityLogs() {
  const [query, setQuery] = useState('');
  return (
    <div className="content-card">
      <div className="table-toolbar">
        <label>
          Search activity
          <input
            className="form-control"
            placeholder="Operator, action or record…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          From
          <input type="date" className="form-control" />
        </label>
        <label>
          To
          <input type="date" className="form-control" />
        </label>
        <label>
          Action
          <select className="form-select">
            <option>All actions</option>
            <option>Auction scheduled</option>
            <option>User updated</option>
            <option>Finance imported</option>
            <option>Images linked</option>
          </select>
        </label>
      </div>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {['Date / Time', 'Operator', 'Action', 'Record', 'Details'].map(
                (h) => (
                  <th key={h}>{h}</th>
                ),
              )}
            </tr>
          </thead>
        </table>
      </div>
      <div className="empty-panel">
        <h3>Activity history</h3>
        <p>
          The activity feed is not connected yet. Recorded actions will appear
          here.
        </p>
      </div>
      <div className="table-footer">0 records</div>
    </div>
  );
}
