import { HistoricalImport } from '../imports/imports-ui';
import { OperationsForms, ResultCorrection } from './operations-ui';
import { useEffect, useState } from 'react';
import {
  InventoryErrorReport,
  api,
  Modal,
  rupees,
  paise,
  date,
  localDate,
  type User,
  type Auction,
  type Lot,
} from '../../shared/components/shared';

type WorkflowLot = Lot & {
  auction_id: string;
  title: string;
  insurer: string;
  location: string;
  winner_id?: string;
  winner_email?: string;
  payment_status?: string;
};
type Payment = {
  status: string;
  substatus: string;
  fulfillment_date: string;
  version: number;
  details: Record<string, string | number>;
};
type ResultDetail = {
  receipts: { id: string; name: string }[];
  quotation_enabled: boolean;
  quote_email_enabled: boolean;
  lot: WorkflowLot;
  payment: Payment | null;
  history: { id: string; action: string; created_at: string; actor: string }[];
  bidders: { id: string; name: string; amount: number }[];
};
type Balance = {
  user_id: string;
  buyer_name: string;
  insurer: string;
  balance: number;
};
type Entry = {
  id: string;
  user_id: string;
  buyer_name: string;
  insurer: string;
  kind: string;
  amount: number;
  reference: string;
  remarks: string;
  created_at: string;
};
type Limit = {
  user_id: string;
  buyer_name: string;
  insurer: string;
  amount_limit: number;
  vehicle_limit: number;
  used_amount: number;
  used_vehicles: number;
  available_amount: number;
  available_vehicles: number;
};
const staff = (u: User) => u.role !== 'BUYER';
export const workflowSections = (user: User) =>
  staff(user)
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
const textInput = (
  label: string,
  value: string,
  onChange: (value: string) => void,
  type = 'text',
  required = true,
) => (
  <label>
    {label}
    <input
      className="form-control"
      type={type}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    />
  </label>
);
const options = (values: string[]) =>
  values.map((value) => (
    <option key={value} value={value}>
      {value.replaceAll('_', ' ')}
    </option>
  ));

export function WorkflowLotButton({
  id,
  user,
  auctions,
  onSaved,
  label = 'Sale / Operations',
}: {
  id: string;
  user: User;
  auctions: Auction[];
  onSaved: () => Promise<void>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn-outline-success btn-sm"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <ResultEditor
          id={id}
          user={user}
          auctions={auctions}
          onClose={() => setOpen(false)}
          onSaved={onSaved}
        />
      )}
    </>
  );
}
function ResultEditor({
  id,
  user,
  auctions,
  onClose,
  onSaved,
}: {
  id: string;
  user: User;
  auctions: Auction[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [data, setData] = useState<ResultDetail | null>(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const [action, setAction] = useState('APPROVED'),
    [remarks, setRemarks] = useState(''),
    [evidence, setEvidence] = useState<File | null>(null),
    [receipt, setReceipt] = useState('');
  const [destination, setDestination] = useState(''),
    [start, setStart] = useState(localDate(new Date().toISOString())),
    [end, setEnd] = useState(
      localDate(new Date(Date.now() + 86400000).toISOString()),
    ),
    [price, setPrice] = useState('');
  const [policy, setPolicy] = useState({
    reserve: '',
    max_bids: '0',
    show_start_price: true,
    show_current_price: true,
    valuation_url: '',
    fop_url: '',
  });
  const load = async () => {
    const value = await api<ResultDetail>(`/workflow/lots/${id}`);
    setData(value);
    setReceipt(value.lot.receipt_number || '');
    setPrice(String(value.lot.starting_price / 100));
    setPolicy({
      reserve: value.lot.reserve_price
        ? String(value.lot.reserve_price / 100)
        : '',
      max_bids: String(value.lot.max_bids || 0),
      show_start_price: value.lot.show_start_price !== false,
      show_current_price: value.lot.show_current_price !== false,
      valuation_url: String(value.lot.metadata?.valuation_url || ''),
      fop_url: String(value.lot.metadata?.fop_url || ''),
    });
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);
  async function run(work: () => Promise<unknown>, message = 'Saved.') {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      await load();
      await onSaved();
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const lot = data?.lot;
  return (
    <Modal
      title={
        lot
          ? `${lot.registration} · ${lot.result_status || lot.status}`
          : 'Vehicle operations'
      }
      onClose={onClose}
      className="vehicle-editor-modal"
    >
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
      {!data || !lot ? (
        <p>Loading saved result…</p>
      ) : (
        <>
          <div className="workflow-metrics">
            <div>
              Highest bid<strong>{rupees(lot.current_bid)}</strong>
            </div>
            <div>
              Winner<strong>{lot.winner_name || '—'}</strong>
            </div>
            <div>
              Payment<strong>{lot.payment_status || 'Not recorded'}</strong>
            </div>
          </div>
          <div className="workflow-actions">
            {data.receipts?.map((file) => (
              <a
                key={file.id}
                className="btn btn-light btn-sm"
                href={`/api/files/${file.id}`}
              >
                Receipt: {file.name}
              </a>
            ))}
            <a
              className="btn btn-light btn-sm"
              href={`/api/workflow/lots/${id}/pdf?kind=vehicle`}
              target="_blank"
              rel="noreferrer"
            >
              Vehicle PDF
            </a>
            <a
              className="btn btn-light btn-sm"
              href={`/api/workflow/lots/${id}/images.zip`}
            >
              Download all images
            </a>
            {['APPROVED', 'UNPICKED'].includes(lot.result_status || '') && (
              <a
                className="btn btn-success btn-sm"
                href={`/api/workflow/lots/${id}/pdf?kind=winning-letter`}
                target="_blank"
                rel="noreferrer"
              >
                Winning Letter
              </a>
            )}
            {data.quotation_enabled && (
              <>
                <a
                  className="btn btn-light btn-sm"
                  href={`/api/workflow/lots/${id}/pdf?kind=quotation`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Quotation PDF
                </a>
                {data.quote_email_enabled &&
                  (user.role === 'ADMIN' ||
                    user.permissions?.includes('results')) && (
                    <button
                      className="btn btn-light btn-sm"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            api(`/workflow/lots/${id}/quotation-email`, 'POST'),
                          'Quotation email queued. Check Notifications for delivery status.',
                        )
                      }
                    >
                      Queue quotation email
                    </button>
                  )}
              </>
            )}
          </div>
          {(user.role === 'ADMIN' || user.permissions?.includes('results')) &&
            lot.status !== 'OPEN' && (
              <form
                className="workflow-panel workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    if (['RELIST', 'COPY', 'MOVE'].includes(action))
                      return api(`/workflow/lots/${id}/inventory`, 'POST', {
                        action,
                        destination_id: destination || undefined,
                        starts_at: new Date(start).toISOString(),
                        ends_at: new Date(end).toISOString(),
                        starting_price: paise(price),
                        remarks,
                      });
                    let evidence_id: string | undefined;
                    if (evidence) {
                      const body = new FormData();
                      body.append('file', evidence);
                      evidence_id = (
                        await api<{ id: string }>(
                          `/workflow/lots/${id}/evidence`,
                          'POST',
                          body,
                        )
                      ).id;
                    }
                    if (action === 'RECEIPT')
                      return api(`/workflow/lots/${id}/receipt`, 'PUT', {
                        receipt_number: receipt,
                        remarks,
                        document_id: evidence_id,
                      });
                    return api(`/workflow/lots/${id}/result`, 'POST', {
                      status: action,
                      remarks,
                      evidence_id,
                      version: lot.version || 0,
                    });
                  });
                }}
              >
                <h3 className="wide">Process result</h3>
                <label>
                  Action
                  <select
                    className="form-select"
                    value={action}
                    onChange={(e) => {
                      setAction(e.target.value);
                      setEvidence(null);
                    }}
                  >
                    {options([
                      'APPROVED',
                      'REJECTED',
                      'CANCELLED',
                      'UNPICKED',
                      'RECEIPT',
                      'RELIST',
                      'COPY',
                      'MOVE',
                    ])}
                  </select>
                </label>
                {textInput('Remarks', remarks, setRemarks)}
                {action === 'RECEIPT' ? (
                  <>
                    {textInput('Receipt number', receipt, setReceipt)}
                    <label>
                      Receipt file (optional PDF/PNG/JPEG)
                      <input
                        className="form-control"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) =>
                          setEvidence(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  </>
                ) : ['RELIST', 'COPY', 'MOVE'].includes(action) ? (
                  <>
                    {action !== 'RELIST' && (
                      <label>
                        Destination event
                        <select
                          required
                          className="form-select"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                        >
                          <option value="">Choose event</option>
                          {auctions
                            .filter((a) => a.status !== 'CLOSED')
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.title}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                    {textInput(
                      'Starts (local)',
                      start,
                      setStart,
                      'datetime-local',
                    )}
                    {textInput('Closes (local)', end, setEnd, 'datetime-local')}
                    {textInput(
                      'Starting price (INR)',
                      price,
                      setPrice,
                      'number',
                    )}
                    <p className="wide">
                      Relisting starts a new bid round and keeps the prior round
                      in history. Copy creates a new lot. Move retains its bids.
                    </p>
                  </>
                ) : (
                  action !== 'UNPICKED' && (
                    <label>
                      Supporting evidence (PDF/PNG/JPEG)
                      <input
                        className="form-control"
                        type="file"
                        required
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) =>
                          setEvidence(e.target.files?.[0] || null)
                        }
                      />
                    </label>
                  )
                )}
                <button disabled={busy} className="btn btn-success">
                  Save action
                </button>
              </form>
            )}
          {(user.role === 'ADMIN' || user.permissions?.includes('events')) &&
            lot.status === 'OPEN' && (
              <form
                className="workflow-panel workflow-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(() =>
                    api(`/workflow/lots/${id}/settings`, 'PUT', {
                      reserve_price: policy.reserve
                        ? paise(policy.reserve)
                        : null,
                      max_bids: Number(policy.max_bids),
                      show_start_price: policy.show_start_price,
                      show_current_price: policy.show_current_price,
                      valuation_url: policy.valuation_url,
                      fop_url: policy.fop_url,
                    }),
                  );
                }}
              >
                <h3 className="wide">Vehicle bidding settings and links</h3>
                {textInput(
                  'Reserve price (INR, optional)',
                  policy.reserve,
                  (v) => setPolicy({ ...policy, reserve: v }),
                  'number',
                  false,
                )}
                {textInput(
                  'Bids per buyer (0 = unlimited)',
                  policy.max_bids,
                  (v) => setPolicy({ ...policy, max_bids: v }),
                  'number',
                )}
                {(['show_start_price', 'show_current_price'] as const).map(
                  (key) => (
                    <label key={key}>
                      <span>{key.replaceAll('_', ' ')}</span>
                      <input
                        type="checkbox"
                        checked={policy[key]}
                        onChange={(e) =>
                          setPolicy({ ...policy, [key]: e.target.checked })
                        }
                      />
                    </label>
                  ),
                )}
                {textInput(
                  'Valuation URL',
                  policy.valuation_url,
                  (v) => setPolicy({ ...policy, valuation_url: v }),
                  'url',
                  false,
                )}
                {textInput(
                  'FOP / video URL',
                  policy.fop_url,
                  (v) => setPolicy({ ...policy, fop_url: v }),
                  'url',
                  false,
                )}
                <button className="btn btn-success" disabled={busy}>
                  Save settings
                </button>
              </form>
            )}
          {['APPROVED', 'UNPICKED'].includes(lot.result_status || '') && (
            <PaymentEditor
              id={id}
              payment={data.payment}
              staff={
                user.role === 'ADMIN' ||
                !!user.permissions?.includes('payments')
              }
              total={lot.current_bid || 0}
              onSave={(value) =>
                run(() => api(`/workflow/lots/${id}/payment`, 'PUT', value))
              }
              busy={busy}
            />
          )}
          {(user.role === 'ADMIN' || user.permissions?.includes('results')) &&
            lot.status === 'CLOSED' && (
              <ResultCorrection
                lot={lot}
                bidders={data.bidders}
                onSave={(work) => run(work)}
              />
            )}
          <ImageManager id={id} editable={user.role === 'ADMIN'} />
          <details>
            <summary>
              Result and payment history ({data.history.length})
            </summary>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Operator</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((h) => (
                  <tr key={h.id}>
                    <td>{date(h.created_at)}</td>
                    <td>{h.action}</td>
                    <td>{h.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Modal>
  );
}
function PaymentEditor({
  id,
  payment,
  staff: editable,
  total,
  onSave,
  busy,
}: {
  id: string;
  payment: Payment | null;
  staff: boolean;
  total: number;
  onSave: (value: unknown) => Promise<void>;
  busy: boolean;
}) {
  const [status, setStatus] = useState(payment?.status || 'Follow Up'),
    [substatus, setSubstatus] = useState(
      payment?.substatus || 'Awaiting payment',
    ),
    [fulfillment, setFulfillment] = useState(
      payment?.fulfillment_date?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
    );
  const [details, setDetails] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      [
        'payment_date',
        'transaction_date',
        'expected_date',
        'utr',
        'payer',
        'beneficiary',
        'bank',
        'remarks',
        'amount',
        'emd',
      ].map((key) => [
        key,
        ['amount', 'emd'].includes(key)
          ? String(Number(payment?.details[key] || 0) / 100)
          : String(payment?.details[key] || ''),
      ]),
    ),
  );
  return (
    <form
      key={id}
      className="workflow-panel workflow-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({
          status,
          substatus,
          fulfillment_date: fulfillment,
          version: payment?.version || 0,
          details: {
            ...details,
            payment_date: details.payment_date || undefined,
            transaction_date: details.transaction_date || undefined,
            expected_date: details.expected_date || undefined,
            amount: paise(details.amount || '0'),
            emd: paise(details.emd || '0'),
          },
        });
      }}
    >
      <h3 className="wide">Payment MIS · Approved amount {rupees(total)}</h3>
      <label>
        Status
        <select
          disabled={!editable}
          className="form-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {options([
            'Paid',
            'Part Payment',
            'Follow Up',
            'Default',
            'Dispute',
            'Client Hold',
          ])}
        </select>
      </label>
      {textInput('Substatus', substatus, setSubstatus)}
      {textInput('Fulfillment date', fulfillment, setFulfillment, 'date')}
      {Object.keys(details).map((key) => (
        <label key={key}>
          {key.replaceAll('_', ' ')}
          {['amount', 'emd'].includes(key) ? ' (INR)' : ''}
          <input
            disabled={!editable}
            className="form-control"
            type={
              key.endsWith('_date')
                ? 'date'
                : ['amount', 'emd'].includes(key)
                  ? 'number'
                  : 'text'
            }
            min={0}
            step={['amount', 'emd'].includes(key) ? '0.01' : undefined}
            required={key === 'remarks'}
            value={details[key]}
            onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
          />
        </label>
      ))}
      {editable && (
        <button disabled={busy} className="btn btn-success">
          Save payment status
        </button>
      )}
    </form>
  );
}
function ImageManager({ id, editable }: { id: string; editable: boolean }) {
  const [files, setFiles] = useState<
      { id: string; name: string; kind: string }[]
    >([]),
    [error, setError] = useState('');
  const load = () =>
    api<typeof files>(`/files?owner=lot&id=${id}`).then(setFiles);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);
  async function change(image: string, remove = false) {
    setError('');
    try {
      await api(
        `/workflow/images/${image}${remove ? '' : '/first'}`,
        remove ? 'DELETE' : 'PUT',
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <details className="workflow-panel">
      <summary>Vehicle images</summary>
      {error && <p role="alert">{error}</p>}
      <div className="photo-grid">
        {files
          .filter((f) => f.kind === 'IMAGE')
          .map((f) => (
            <div key={f.id}>
              <a href={`/api/files/${f.id}`} target="_blank" rel="noreferrer">
                <img src={`/api/files/${f.id}`} alt={f.name} />
              </a>
              {editable && (
                <div className="workflow-actions">
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => void change(f.id)}
                  >
                    Set first
                  </button>
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => {
                      if (confirm('Remove this vehicle image?'))
                        void change(f.id, true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
    </details>
  );
}

export function ReferenceImages({
  auctions,
  user,
}: {
  auctions: Auction[];
  user: User;
}) {
  const storageKey = 'elvxchange:image-job:' + user.id;
  const [auction, setAuction] = useState(''),
    [mode, setMode] = useState('LAN_ZIP'),
    [file, setFile] = useState<File | null>(null),
    [jobId, setJobId] = useState(
      () => sessionStorage.getItem(storageKey) || '',
    ),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const [job, setJob] = useState<{
    status: string;
    processed: number;
    error?: string;
    results: { row: number; reference: string; ok: boolean; message: string }[];
  } | null>(null);
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false,
      timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await api<NonNullable<typeof job>>(
          '/workflow/image-jobs/' + jobId,
        );
        if (cancelled) return;
        setJob(response);
        if (['PENDING', 'RUNNING'].includes(response.status))
          timer = setTimeout(() => void poll(), 1500);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId]);
  return (
    <section className="workflow-panel">
      <h2>Link images by LAN / reference</h2>
      <p>
        For this event, use <code>INSREF123 (1).jpg</code> in a flat ZIP, or use
        the image-link workbook. LAN must match the saved vehicle metadata.
      </p>
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!file) return;
          const body = new FormData();
          body.append('file', file);
          body.append('mode', mode);
          setBusy(true);
          setError('');
          void api<{ id: string }>(
            `/workflow/auctions/${auction}/link-images`,
            'POST',
            body,
          )
            .then((value) => {
              setJobId(value.id);
              sessionStorage.setItem(storageKey, value.id);
            })
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Event
          <select
            required
            className="form-select"
            value={auction}
            onChange={(e) => setAuction(e.target.value)}
          >
            <option value="">Choose event</option>
            {auctions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Method
          <select
            className="form-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="LAN_ZIP">LAN and sequence ZIP</option>
            <option value="URL_WORKBOOK">
              Excel image / ZIP / valuation URLs
            </option>
          </select>
        </label>
        <label>
          Upload
          <input
            className="form-control"
            type="file"
            required
            accept={mode === 'LAN_ZIP' ? '.zip' : '.xlsx'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <div className="workflow-actions wide">
          <button disabled={busy} className="btn btn-success">
            Start image import
          </button>
          <a className="btn btn-light" href="/api/workflow/image-link-template">
            Download Image Link Template
          </a>
        </div>
      </form>
      {error && (
        <p className="alert alert-danger" role="alert">
          {error}
        </p>
      )}
      {job && (
        <>
          <p role="status">
            <strong>{job.status}</strong> · {job.processed} rows processed.{' '}
            {job.error}
          </p>
          <p>
            Imports continue while you use other screens. Existing images cause
            Excel rows for that LAN to be skipped; LAN ZIP imports replace
            matching sequence positions.
          </p>
          <a
            className="btn btn-light btn-sm"
            href={`/api/workflow/image-jobs/${jobId}?download=1`}
          >
            Download row results
          </a>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>LAN</th>
                  <th>Result</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {job.results.slice(0, 100).map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.reference}</td>
                    <td>{r.ok ? 'Processed' : 'Error'}</td>
                    <td>{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {job.results.length > 100 && (
              <p>Showing the first 100 rows. Download includes every result.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function WorkflowHub({
  user,
  auctions,
  onRefresh,
  tab,
  onTabChange,
}: {
  user: User;
  auctions: Auction[];
  onRefresh: () => Promise<void>;
  tab: string;
  onTabChange: (tab: string) => void;
}) {
  const [lots, setLots] = useState<WorkflowLot[]>([]),
    [users, setUsers] = useState<User[]>([]),
    [entries, setEntries] = useState<Entry[]>([]),
    [balances, setBalances] = useState<Balance[]>([]),
    [limits, setLimits] = useState<Limit[]>([]),
    [error, setError] = useState(''),
    [filter, setFilter] = useState('ALL'),
    [auction, setAuction] = useState(''),
    [query, setQuery] = useState('');
  async function load() {
    setError('');
    try {
      const [records, finance, buyers] = await Promise.all([
        api<WorkflowLot[]>('/workflow/lots'),
        user.role === 'BUYER' ||
        user.role === 'ADMIN' ||
        user.permissions?.includes('finance')
          ? api<{
              entries: Entry[];
              balances: Balance[];
              limits: Limit[];
            }>('/workflow/finance')
          : Promise.resolve({ entries: [], limits: [], balances: [] }),
        staff(user) ? api<User[]>('/workflow/buyers') : Promise.resolve([]),
      ]);
      setLots(records);
      setEntries(finance.entries);
      setBalances(finance.balances);
      setLimits(finance.limits);
      setUsers(buyers.filter((u) => u.role === 'BUYER'));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, [user.id]);
  const saved = async () => {
    await load();
    await onRefresh();
  };
  const rows = lots.filter(
    (l) =>
      (!auction || l.auction_id === auction) &&
      (filter === 'ALL' || l.result_status === filter) &&
      `${l.registration} ${l.title} ${l.winner_name || ''}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (tab === 'Payment MIS'
        ? ['APPROVED', 'UNPICKED'].includes(l.result_status || '')
        : l.status !== 'OPEN'),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{staff(user) ? 'Insurance Operations' : 'My Wins & Payments'}</h1>
          <p>
            Saved results, approvals, payment follow-up and insurance limits.
          </p>
        </div>
        <button className="btn btn-light" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      <div className="content-card">
        {!staff(user) && (
          <div className="tabs">
            {workflowSections(user).map((t) => (
              <button
                className={tab === t ? 'active' : ''}
                key={t}
                onClick={() => onTabChange(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        {error && (
          <p className="alert alert-danger" role="alert">
            {error}
          </p>
        )}
        {['Results', 'Payment MIS'].includes(tab) ? (
          <>
            <div className="table-toolbar">
              <input
                className="form-control"
                aria-label="Search results"
                placeholder="Registration, event or buyer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="form-select"
                aria-label="Result state"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {options([
                  'ALL',
                  'PENDING',
                  'APPROVED',
                  'REJECTED',
                  'UNSOLD',
                  'CANCELLED',
                  'UNPICKED',
                ])}
              </select>
              <select
                aria-label="Event filter"
                className="form-select"
                value={auction}
                onChange={(e) => setAuction(e.target.value)}
              >
                <option value="">All events</option>
                {auctions.map((a) => (
                  <option value={a.id} key={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vehicle / Event</th>
                    <th>Insurer</th>
                    <th>Highest bid / Winner</th>
                    <th>Result</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.registration}</strong>
                        <small>{l.title}</small>
                      </td>
                      <td>
                        {l.insurer}
                        <small>{l.location}</small>
                      </td>
                      <td>
                        {rupees(l.current_bid)}
                        <small>{l.winner_name || 'No winning bidder'}</small>
                      </td>
                      <td>
                        <span className="workflow-status">
                          {l.result_status || l.status}
                        </span>
                      </td>
                      <td>{l.payment_status || '—'}</td>
                      <td>
                        <WorkflowLotButton
                          id={l.id}
                          user={user}
                          auctions={auctions}
                          onSaved={saved}
                          label={staff(user) ? 'Process / View' : 'View result'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <p className="empty-panel">No results match this view.</p>
            )}
          </>
        ) : tab === 'RSD & Limits' ? (
          <FinancePanel
            user={user}
            buyers={users}
            entries={entries}
            balances={balances}
            limits={limits}
            onSaved={saved}
          />
        ) : tab === 'Reports' ? (
          <div className="workflow-panel">
            <h2>Insurance reports</h2>
            {user.role === 'ADMIN' && <HistoricalImport onSaved={saved} />}
            <select
              className="form-select"
              aria-label="Report event"
              value={auction}
              onChange={(e) => setAuction(e.target.value)}
            >
              <option value="">All events</option>
              {auctions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            <div className="workflow-actions">
              <a
                className="btn btn-success"
                href={`/api/workflow/report?kind=acr${auction ? '&auction=' + auction : ''}`}
              >
                Download Insurance ACR
              </a>
              <a
                className="btn btn-light"
                href={`/api/workflow/report?kind=payment${auction ? '&auction=' + auction : ''}`}
              >
                Payment MIS export
              </a>
            </div>
          </div>
        ) : tab === 'Insurers' ? (
          <Insurers />
        ) : tab === 'Notifications' ? (
          <Notifications />
        ) : (
          <BulkOperations
            auctions={auctions}
            buyers={users}
            lots={lots}
            onSaved={saved}
          />
        )}
      </div>
    </>
  );
}
function FinancePanel({
  user,
  buyers,
  entries,
  balances: ledgerBalances,
  limits,
  onSaved,
}: {
  user: User;
  buyers: User[];
  entries: Entry[];
  balances: Balance[];
  limits: Limit[];
  onSaved: () => Promise<void>;
}) {
  const [buyer, setBuyer] = useState(''),
    [insurer, setInsurer] = useState(''),
    [kind, setKind] = useState('DEPOSIT'),
    [amount, setAmount] = useState(''),
    [reference, setReference] = useState(''),
    [remarks, setRemarks] = useState(''),
    [vehicles, setVehicles] = useState('1'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [request, setRequest] = useState(() => crypto.randomUUID());
  async function save(credit = false) {
    setBusy(true);
    setError('');
    try {
      await api(
        credit ? '/workflow/credit' : '/workflow/finance',
        credit ? 'PUT' : 'POST',
        credit
          ? {
              user_id: buyer,
              insurer,
              amount_limit: paise(amount),
              vehicle_limit: Number(vehicles),
              remarks,
            }
          : {
              user_id: buyer,
              insurer,
              kind,
              amount: paise(amount),
              reference,
              remarks,
              request_id: request,
            },
      );
      setRequest(crypto.randomUUID());
      await onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const balances = new Map<string, number>();
  for (const e of entries) {
    const key = `${e.buyer_name} · ${e.insurer}`;
    balances.set(
      key,
      (balances.get(key) || 0) + (e.kind === 'DEPOSIT' ? e.amount : -e.amount),
    );
  }
  return (
    <div className="workflow-panel">
      <h2>Insurance RSD and bidding limits</h2>
      {error && (
        <p className="alert alert-danger" role="alert">
          {error}
        </p>
      )}
      <div className="workflow-metrics">
        {[...balances].map(([key, value]) => (
          <div key={key}>
            {key}
            <strong>{rupees(value)}</strong>
            <small>Available RSD</small>
          </div>
        ))}
      </div>
      {staff(user) && (
        <form
          className="workflow-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label>
            Buyer
            <select
              className="form-select"
              required
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            >
              <option value="">Choose buyer</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} · {b.username}
                </option>
              ))}
            </select>
          </label>
          {textInput('Insurance company', insurer, setInsurer)}
          <label>
            Entry kind
            <select
              className="form-select"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {options(['DEPOSIT', 'ADJUSTMENT', 'REFUND'])}
            </select>
          </label>
          {textInput(
            'Amount / credit limit (INR)',
            amount,
            setAmount,
            'number',
          )}
          {textInput('Reference', reference, setReference)}
          {textInput('Remarks', remarks, setRemarks)}
          {textInput('Vehicle limit', vehicles, setVehicles, 'number')}
          <div className="workflow-actions wide">
            <button className="btn btn-success" disabled={busy}>
              Record RSD entry
            </button>
            <button
              type="button"
              className="btn btn-outline-success"
              disabled={
                busy || !buyer || !insurer || !amount || remarks.length < 3
              }
              onClick={() => void save(true)}
            >
              Set credit and vehicle limit
            </button>
          </div>
        </form>
      )}
      <h3>Configured credit limits</h3>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Buyer / Insurer</th>
              <th>Credit limit</th>
              <th>Used</th>
              <th>Available</th>
              <th>Vehicles available / limit</th>
            </tr>
          </thead>
          <tbody>
            {limits.map((l) => (
              <tr key={l.user_id + l.insurer}>
                <td>
                  {l.buyer_name}
                  <small>{l.insurer}</small>
                </td>
                <td>{rupees(l.amount_limit)}</td>
                <td>{rupees(l.used_amount)}</td>
                <td>{rupees(l.available_amount)}</td>
                <td>
                  {l.available_vehicles} / {l.vehicle_limit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>RSD ledger</h3>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>Time / Buyer</th>
              <th>Insurer</th>
              <th>Kind</th>
              <th>Amount</th>
              <th>Reference / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>
                  {date(e.created_at)}
                  <small>{e.buyer_name}</small>
                </td>
                <td>{e.insurer}</td>
                <td>{e.kind}</td>
                <td>{rupees(e.amount)}</td>
                <td>
                  {e.reference}
                  <small>{e.remarks}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Notifications() {
  const [rows, setRows] = useState<
      {
        id: string;
        recipient: string;
        subject: string;
        status: string;
        last_error?: string;
      }[]
    >([]),
    [error, setError] = useState('');
  const load = () =>
    api<typeof rows>('/workflow/notifications')
      .then(setRows)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="workflow-panel">
      <h2>Approval and quotation messages</h2>
      <p>
        Delivery requires the configured ELVXCHANGE SMTP server. Saved approval
        and email delivery have separate statuses.
      </p>
      {error && <p role="alert">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Subject</th>
            <th>Delivery</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.recipient}</td>
              <td>{r.subject}</td>
              <td>
                {r.status}
                <small>{r.last_error}</small>
              </td>
              <td>
                {['FAILED', 'NOT_CONFIGURED'].includes(r.status) && (
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => {
                      void api(`/workflow/notifications/${r.id}/retry`, 'POST')
                        .then(load)
                        .catch((e) => setError(e.message));
                    }}
                  >
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-light" onClick={() => void load()}>
        Refresh delivery status
      </button>
    </div>
  );
}
function Insurers() {
  type Config = {
    insurer: string;
    seller_code: string;
    email: string;
    quotation_enabled: boolean;
    payment_instructions: string;
    quote_subject: string;
    quote_valid_days: number;
    locations: string[];
    subcategories: string[];
  };
  const [saved, setSaved] = useState<Config[]>([]),
    [insurer, setInsurer] = useState(''),
    [email, setEmail] = useState(''),
    [code, setCode] = useState(''),
    [instructions, setInstructions] = useState(''),
    [subject, setSubject] = useState(''),
    [days, setDays] = useState('7'),
    [locations, setLocations] = useState(''),
    [subcategories, setSubcategories] = useState(''),
    [enabled, setEnabled] = useState(false),
    [key, setKey] = useState(''),
    [notice, setNotice] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = () => api<Config[]>('/workflow/insurers').then(setSaved);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  function select(name: string) {
    const s = saved.find((s) => s.insurer === name);
    setInsurer(name);
    setCode(s?.seller_code || '');
    setEmail(s?.email || '');
    setInstructions(s?.payment_instructions || '');
    setSubject(s?.quote_subject || '');
    setDays(String(s?.quote_valid_days || 7));
    setLocations((s?.locations || []).join('\n'));
    setSubcategories((s?.subcategories || []).join('\n'));
    setEnabled(!!s?.quotation_enabled);
    setKey('');
    setNotice('');
  }
  return (
    <form
      className="workflow-panel workflow-form"
      onSubmit={(e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        void api('/workflow/insurers', 'PUT', {
          insurer,
          email,
          seller_code: code,
          payment_instructions: instructions,
          quotation_enabled: enabled,
          quote_subject: subject,
          quote_valid_days: Number(days),
          locations: locations
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean),
          subcategories: subcategories
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean),
        })
          .then(async () => {
            await load();
            setNotice('Insurer configuration saved.');
          })
          .catch((e) => setError(e.message))
          .finally(() => setBusy(false));
      }}
    >
      <h2 className="wide">Insurance seller configuration</h2>
      {error && (
        <p className="alert alert-danger wide" role="alert">
          {error}
        </p>
      )}
      {notice && <p className="alert alert-success wide">{notice}</p>}
      <label className="wide">
        Load saved insurer
        <select
          className="form-select"
          value={saved.some((s) => s.insurer === insurer) ? insurer : ''}
          onChange={(e) => select(e.target.value)}
        >
          <option value="">New insurer</option>
          {saved.map((s) => (
            <option key={s.insurer} value={s.insurer}>
              {s.insurer}
            </option>
          ))}
        </select>
      </label>
      {textInput('Insurance company', insurer, setInsurer)}
      {textInput('Seller code', code, setCode, 'text', false)}
      {textInput('Seller email', email, setEmail, 'email', false)}
      {textInput('Quotation email subject', subject, setSubject, 'text', false)}
      {textInput('Quote validity (days)', days, setDays, 'number')}
      <label>
        Quotation PDFs enabled
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
      </label>
      <label>
        Allowed locations (one per line; blank = no catalog restriction)
        <textarea
          className="form-control"
          value={locations}
          onChange={(e) => setLocations(e.target.value)}
        />
      </label>
      <label>
        Allowed subcategories (one per line)
        <textarea
          className="form-control"
          value={subcategories}
          onChange={(e) => setSubcategories(e.target.value)}
        />
      </label>
      <label className="wide">
        Verified payment / release instructions
        <textarea
          className="form-control"
          value={instructions}
          maxLength={5000}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </label>
      <button className="btn btn-success" disabled={busy}>
        Save configuration
      </button>
      <button
        type="button"
        className="btn btn-light"
        disabled={busy || !insurer}
        onClick={() => {
          setError('');
          void api<{ api_key: string }>('/workflow/insurers/key', 'POST', {
            insurer,
          })
            .then((r) => setKey(r.api_key))
            .catch((e) => setError(e.message));
        }}
      >
        Create / rotate seller API key
      </button>
      {key && (
        <label className="wide">
          New API key (shown once; save securely)
          <input readOnly className="form-control" value={key} />
        </label>
      )}
      <p className="wide">
        Seller APIs use the configured insurer identity and generated key. SMTP
        settings belong in the server environment. No messages are marked sent
        until the delivery service accepts them.
      </p>
    </form>
  );
}
function BulkOperations({
  auctions,
  buyers,
  lots,
  onSaved,
}: {
  auctions: Auction[];
  buyers: User[];
  lots: WorkflowLot[];
  onSaved: () => Promise<void>;
}) {
  const [kind, setKind] = useState('bids'),
    [file, setFile] = useState<File | null>(null),
    [evidence, setEvidence] = useState<File | null>(null),
    [remarks, setRemarks] = useState(''),
    [result, setResult] = useState<
      { row: number; ok: boolean; message: string }[]
    >([]),
    [report, setReport] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <div className="workflow-panel">
      <OperationsForms
        auctions={auctions}
        buyers={buyers}
        lots={lots}
        onSaved={onSaved}
      />
      <h2>Bulk operations</h2>
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!file) return;
          setBusy(true);
          setError('');
          const body = new FormData();
          body.append('file', file);
          if (evidence) body.append('evidence', evidence);
          body.append('remarks', remarks);
          void api<{ rows: typeof result; reportBase64: string }>(
            `/workflow/bulk/${kind}`,
            'POST',
            body,
          )
            .then(async (response) => {
              setResult(response.rows);
              setReport(response.reportBase64);
              await onSaved();
            })
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Operation
          <select
            className="form-select"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {options(['bids', 'approve', 'update', 'payment'])}
          </select>
        </label>
        <label>
          Workbook
          <input
            className="form-control"
            required
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <label>
          Supporting evidence (approval)
          <input
            className="form-control"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setEvidence(e.target.files?.[0] || null)}
          />
        </label>
        {textInput('Operator remarks', remarks, setRemarks)}
        <div className="workflow-actions wide">
          <a
            className="btn btn-light"
            href={`/api/workflow/bulk/${kind}/template`}
          >
            Download blank template
          </a>
          <button disabled={busy} className="btn btn-success">
            Validate and process
          </button>
        </div>
      </form>
      <InventoryErrorReport base64={report} />
      <p>
        Each row has its own outcome. Review successful rows before retrying.
      </p>
      {error && (
        <p className="alert alert-danger" role="alert">
          {error}
        </p>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>Row</th>
            <th>Result</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {result.map((r) => (
            <tr key={r.row}>
              <td>{r.row}</td>
              <td>{r.ok ? 'Saved' : 'Error'}</td>
              <td>{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Relive closed auction</h3>
      {auctions
        .filter((a) => a.status === 'CLOSED')
        .map((a) => (
          <div key={a.id} className="workflow-actions">
            <span>{a.title}</span>
            <button
              className="btn btn-light btn-sm"
              onClick={() => {
                const reason = prompt(
                  'Reason to relive this closed event (bids remain)?',
                );
                if (!reason) return;
                void api(`/workflow/auctions/${a.id}/relive`, 'POST', {
                  hours: 24,
                  remarks: reason,
                })
                  .then(onSaved)
                  .catch((e) => setError(e.message));
              }}
            >
              Relive for 24 hours
            </button>
          </div>
        ))}
    </div>
  );
}
