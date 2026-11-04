import { useState } from 'react';
import {
  api,
  InventoryErrorReport,
  date,
} from '../../shared/components/shared';

export function HistoricalImport({
  onSaved,
}: {
  onSaved: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null),
    [evidence, setEvidence] = useState<File | null>(null),
    [remarks, setRemarks] = useState(''),
    [error, setError] = useState(''),
    [report, setReport] = useState(''),
    [busy, setBusy] = useState(false),
    [rows, setRows] = useState<
      { id: string; auction_number: number; rows: number; reused: boolean }[]
    >([]);
  return (
    <details className="workflow-panel">
      <summary>Import historical / offline insurance ACR</summary>
      <p>
        Use existing buyer user names. Imports preserve the supplied historical
        result and bid; they do not notify buyers or place live bids. Up to 100
        rows / 10 events per request.
      </p>
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!file) return;
          const body = new FormData();
          body.append('file', file);
          body.append('remarks', remarks);
          if (evidence) body.append('evidence', evidence);
          setBusy(true);
          setError('');
          setReport('');
          void api<typeof rows>('/workflow/acr-import', 'POST', body)
            .then(async (result) => {
              setRows(result);
              await onSaved();
            })
            .catch((e) => {
              setError(e.message);
              setReport(e.reportBase64 || '');
            })
            .finally(() => setBusy(false));
        }}
      >
        <label>
          Historical ACR workbook
          <input
            className="form-control"
            required
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <label>
          Approval evidence PDF (required for Approved rows)
          <input
            className="form-control"
            type="file"
            accept=".pdf"
            onChange={(e) => setEvidence(e.target.files?.[0] || null)}
          />
        </label>
        <label>
          Import remarks
          <input
            className="form-control"
            required
            minLength={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </label>
        <div className="workflow-actions wide">
          <a className="btn btn-light" href="/api/workflow/acr-import/template">
            Download historical ACR template
          </a>
          <button className="btn btn-success" disabled={busy}>
            Validate and import
          </button>
        </div>
      </form>
      {error && (
        <p className="alert alert-danger" role="alert">
          {error}
        </p>
      )}
      <InventoryErrorReport base64={report} />
      {rows.map((row) => (
        <p key={row.id}>
          Auction #{row.auction_number}: {row.rows} historical vehicle(s) ·{' '}
          {row.reused ? 'existing import reused' : 'saved'}
        </p>
      ))}
    </details>
  );
}
type Group = {
  title: string;
  insurer: string;
  location: string;
  category: string;
  count: number;
  starts_at: string;
  ends_at: string;
  existing: { id: string; title: string; auction_number: number } | null;
};
export function BatchSchedule({ onSaved }: { onSaved: () => Promise<void> }) {
  const [inventory, setInventory] = useState<File | null>(null),
    [excel, setExcel] = useState<File | null>(null),
    [pdf, setPdf] = useState<File | null>(null),
    [append, setAppend] = useState(false),
    [groups, setGroups] = useState<Group[]>([]),
    [rows, setRows] = useState<
      {
        id?: string;
        title: string;
        count: number;
        ok: boolean;
        message?: string;
        appended?: boolean;
      }[]
    >([]),
    [error, setError] = useState(''),
    [report, setReport] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(preview: boolean) {
    if (!inventory) return;
    setBusy(true);
    setError('');
    setReport('');
    try {
      const body = new FormData();
      body.append('inventory', inventory);
      body.append('append', String(append));
      if (excel) body.append('terms_excel', excel);
      if (pdf) body.append('terms_pdf', pdf);
      if (preview)
        setGroups(
          await api<Group[]>(
            '/workflow/grouped-inventory/preview',
            'POST',
            body,
          ),
        );
      else {
        setRows(
          await api<typeof rows>(
            '/workflow/grouped-inventory/schedule',
            'POST',
            body,
          ),
        );
        await onSaved();
      }
    } catch (e) {
      setError((e as Error).message);
      setReport((e as Error & { reportBase64?: string }).reportBase64 || '');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="content-card workflow-panel">
      <h1>Schedule grouped insurance inventory</h1>
      <p>
        Preview groups by insurer, category, location, mode, event title and
        closing day. Up to 2000 vehicles / 10 event groups per file.
      </p>
      <form
        className="workflow-form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
      >
        <label>
          Grouped inventory (.xlsx)
          <input
            className="form-control"
            type="file"
            required
            accept=".xlsx"
            onChange={(e) => {
              setInventory(e.target.files?.[0] || null);
              setGroups([]);
              setRows([]);
            }}
          />
        </label>
        <label>
          Terms Excel
          <input
            className="form-control"
            type="file"
            accept=".xlsx"
            required
            onChange={(e) => setExcel(e.target.files?.[0] || null)}
          />
        </label>
        <label>
          Terms PDF
          <input
            className="form-control"
            type="file"
            accept=".pdf"
            required
            onChange={(e) => setPdf(e.target.files?.[0] || null)}
          />
        </label>
        <label className="wide">
          <span>
            <input
              type="checkbox"
              checked={append}
              onChange={(e) => setAppend(e.target.checked)}
            />{' '}
            Confirm adding vehicles to the matching open events shown below.
            Otherwise create separate events.
          </span>
        </label>
        <div className="workflow-actions wide">
          <a
            className="btn btn-light"
            href="/api/workflow/grouped-inventory/template"
          >
            Download grouped inventory template
          </a>
          <button
            type="button"
            className="btn btn-outline-success"
            disabled={!inventory || busy}
            onClick={() => void submit(true)}
          >
            Preview and validate groups
          </button>
          <button className="btn btn-success" disabled={busy || !groups.length}>
            Save scheduled groups
          </button>
        </div>
      </form>
      {error && (
        <p className="alert alert-danger" role="alert">
          {error}
        </p>
      )}
      <InventoryErrorReport base64={report} />
      {!!groups.length && (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Insurer / location / category</th>
                <th>Vehicles</th>
                <th>Timing</th>
                <th>Matching open event</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={i}>
                  <td>{g.title}</td>
                  <td>
                    {g.insurer}
                    <small>
                      {g.location} · {g.category}
                    </small>
                  </td>
                  <td>{g.count}</td>
                  <td>
                    {date(g.starts_at)}
                    <small>{date(g.ends_at)}</small>
                  </td>
                  <td>
                    {g.existing
                      ? '#' + g.existing.auction_number + ' ' + g.existing.title
                      : 'New event'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.map((row, i) => (
        <p
          key={i}
          className={row.ok ? 'alert alert-success' : 'alert alert-danger'}
        >
          {row.title}:{' '}
          {row.ok
            ? `${row.count} vehicle(s) ${row.appended ? 'added' : 'scheduled'}.`
            : row.message}
        </p>
      ))}
    </section>
  );
}
