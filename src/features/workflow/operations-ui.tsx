import { useEffect, useState } from 'react';
import { assetUrl } from '../../demo/mode';
import {
  api,
  paise,
  rupees,
  localDate,
  type Auction,
  type Lot,
} from '../../shared/components/shared';

export function OperationsForms({
  auctions,
  buyers,
  lots,
  onSaved,
}: {
  auctions: Auction[];
  buyers: { id: string; name: string }[];
  lots: (Lot & { auction_id: string; title: string })[];
  onSaved: () => Promise<void>;
}) {
  const [lot, setLot] = useState(''),
    [buyer, setBuyer] = useState(''),
    [amount, setAmount] = useState(''),
    [bidRemarks, setBidRemarks] = useState(''),
    [request, setRequest] = useState(() => crypto.randomUUID());
  const [auction, setAuction] = useState(''),
    [end, setEnd] = useState(
      localDate(new Date(Date.now() + 3600000).toISOString()),
    ),
    [clubbing, setClubbing] = useState('1'),
    [interval, setInterval] = useState('1'),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  useEffect(() => setRequest(crypto.randomUUID()), [lot, buyer, amount]);
  async function save(work: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      await onSaved();
      setNotice('Operation saved.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h2>Single and grouped operations</h2>
      {error && (
        <p className="alert alert-danger" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="alert alert-success" role="status">
          {notice}
        </p>
      )}
      <details className="workflow-panel">
        <summary>Place a bid on behalf of a buyer</summary>
        <form
          className="workflow-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save(() =>
              api('/workflow/bids', 'POST', {
                lot_id: lot,
                buyer_id: buyer,
                amount: paise(amount),
                request_id: request,
                remarks: bidRemarks,
              }),
            );
          }}
        >
          <label>
            Vehicle
            <select
              className="form-select"
              required
              value={lot}
              onChange={(e) => setLot(e.target.value)}
            >
              <option value="">Choose open vehicle</option>
              {lots
                .filter((l) => l.status === 'OPEN')
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.registration} · {l.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Buyer
            <select
              className="form-select"
              required
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            >
              <option value="">Choose buyer</option>
              {buyers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount (INR)
            <input
              className="form-control"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Operator remarks
            <input
              className="form-control"
              required
              minLength={3}
              value={bidRemarks}
              onChange={(e) => setBidRemarks(e.target.value)}
            />
          </label>
          <button disabled={busy} className="btn btn-success">
            Submit buyer bid
          </button>
        </form>
      </details>
      <details className="workflow-panel">
        <summary>Grouped closing-time extension</summary>
        <form
          className="workflow-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save(() =>
              api(`/workflow/auctions/${auction}/grouped-extension`, 'POST', {
                ends_at: new Date(end).toISOString(),
                clubbing: Number(clubbing),
                interval_seconds: Number(interval) * 60,
                remarks: reason,
              }),
            );
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
              {auctions
                .filter((a) => a.status !== 'CLOSED')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            First group closes (local)
            <input
              required
              className="form-control"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          <label>
            Vehicles in each group
            <input
              required
              className="form-control"
              type="number"
              min={1}
              max={2000}
              value={clubbing}
              onChange={(e) => setClubbing(e.target.value)}
            />
          </label>
          <label>
            Interval between groups (minutes)
            <input
              required
              className="form-control"
              type="number"
              min={0}
              max={1440}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            />
          </label>
          <label>
            Reason
            <input
              required
              minLength={3}
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <button disabled={busy} className="btn btn-success">
            Update grouped closes
          </button>
        </form>
      </details>
    </>
  );
}
export function ResultCorrection({
  lot,
  bidders,
  onSave,
}: {
  lot: Lot & { winner_id?: string };
  bidders: { id: string; name: string; amount: number }[];
  onSave: (work: () => Promise<unknown>) => Promise<void>;
}) {
  const [buyer, setBuyer] = useState(lot.winner_id || ''),
    [amount, setAmount] = useState(String((lot.current_bid || 0) / 100)),
    [remarks, setRemarks] = useState(''),
    [evidence, setEvidence] = useState<File | null>(null),
    [busy, setBusy] = useState(false);
  if (!bidders.length) return null;
  return (
    <details className="workflow-panel">
      <summary>Correct winning amount / Make Winner</summary>
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!evidence) return;
          setBusy(true);
          void onSave(async () => {
            const body = new FormData();
            body.append('file', evidence);
            const upload = await api<{ id: string }>(
              `/workflow/lots/${lot.id}/evidence`,
              'POST',
              body,
            );
            await api(`/workflow/lots/${lot.id}/correction`, 'POST', {
              buyer_id: buyer,
              amount: paise(amount),
              remarks,
              evidence_id: upload.id,
            });
          }).finally(() => setBusy(false));
        }}
      >
        <p className="wide">
          Corrections are recorded in history and return the result to Approval
          Pending. Results with payment records are protected.
        </p>
        <label>
          Winning bidder
          <select
            required
            className="form-select"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
          >
            <option value="">Choose an actual bidder</option>
            {bidders.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · highest placed {rupees(b.amount)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Corrected winning amount (INR)
          <input
            className="form-control"
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Remarks
          <input
            className="form-control"
            required
            minLength={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </label>
        <label>
          Supporting evidence
          <input
            className="form-control"
            type="file"
            required
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setEvidence(e.target.files?.[0] || null)}
          />
        </label>
        <button className="btn btn-success" disabled={busy}>
          Save correction
        </button>
      </form>
    </details>
  );
}
export function VehicleCommercial({ lot }: { lot: Lot }) {
  const metadata = lot.metadata || {},
    percent = Number(metadata.buyer_fee_percent || 0),
    flat = Number(metadata.buyer_fee_amount || 0),
    gst = (metadata.gst as unknown) === true;
  const valuation = String(metadata.valuation_url || ''),
    fop = String(metadata.fop_url || '');
  return (
    <div className="vehicle-commercial">
      {metadata.sub_seller && (
        <small>Sub-seller: {String(metadata.sub_seller)}</small>
      )}
      {metadata.sub_zone && (
        <small>Sub-zone: {String(metadata.sub_zone)}</small>
      )}
      {(percent > 0 || flat > 0) && (
        <small>
          Buyer fee: {percent > 0 ? percent + '%' : ''}
          {flat > 0 ? (percent > 0 ? ' · minimum ' : '') + rupees(flat) : ''}
          {gst ? ' + GST' : ''}
        </small>
      )}
      <div className="workflow-actions">
        {valuation.startsWith('https://') && (
          <a
            className="workflow-link"
            target="_blank"
            rel="noreferrer"
            href={assetUrl(valuation)}
          >
            VALUATION
          </a>
        )}
        {fop.startsWith('https://') && (
          <a
            className="workflow-link"
            target="_blank"
            rel="noreferrer"
            href={assetUrl(fop)}
          >
            FOP / VIDEO
          </a>
        )}
      </div>
    </div>
  );
}
export function WorkflowCreditBanner({
  insurer,
  enforced,
  revision,
}: {
  insurer: string;
  enforced: boolean;
  revision?: string;
}) {
  const [finance, setFinance] = useState<{
      limits: {
        insurer: string;
        available_amount: number;
        available_vehicles: number;
      }[];
      balances?: { insurer: string; balance: number }[];
    } | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    api<NonNullable<typeof finance>>('/workflow/finance')
      .then((value) => {
        if (!cancelled) setFinance(value);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [insurer, revision]);
  const limit = finance?.limits.find(
      (l) => l.insurer.toLowerCase() === insurer.toLowerCase(),
    ),
    balance = finance?.balances?.find(
      (l) => l.insurer.toLowerCase() === insurer.toLowerCase(),
    );
  return (
    <div className="workflow-panel">
      <strong>{insurer} · Insurance participation limits</strong>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <div className="workflow-metrics">
          <div>
            Available credit
            <strong>{rupees(limit?.available_amount || 0)}</strong>
          </div>
          <div>
            Available vehicles<strong>{limit?.available_vehicles || 0}</strong>
          </div>
          <div>
            Available RSD<strong>{rupees(balance?.balance || 0)}</strong>
          </div>
        </div>
      )}
      <small>
        {enforced
          ? 'Bids are checked against the available insurance credit and vehicle limits.'
          : 'Credit checks are not enabled for this event.'}
      </small>
    </div>
  );
}
