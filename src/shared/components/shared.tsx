import { DEMO_MODE } from '../../demo/mode';
import React, { useId, useEffect, useRef } from 'react';
export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  username?: string;
  profile?: Record<string, string>;
  insurance_eligible?: boolean;
  categories?: string[];
  locations?: string[];
  role:
    | 'ADMIN'
    | 'BUYER'
    | 'AUCTION_MANAGER'
    | 'UPLOAD_QC'
    | 'INFO_QC'
    | 'ZONAL_MANAGER'
    | 'SELLER_ADMIN'
    | 'TELECALLER';
  assigned_insurers?: string[];
  permissions?: string[];
  status: string;
};
export type Lot = {
  result_status?: string;
  version?: number;
  reserve_price?: number | null;
  max_bids?: number;
  show_start_price?: boolean;
  show_current_price?: boolean;
  receipt_number?: string;
  image_id?: string | null;
  id: string;
  lot_number: number;
  registration: string;
  make: string;
  model: string;
  year: number;
  fuel: string;
  condition: string;
  starting_price: number;
  increment: number;
  current_bid: number | null;
  bid_count: number;
  own_bid_count: number;
  is_mine: boolean;
  won: boolean;
  bidder_name?: string;
  winner_name?: string;
  metadata?: Record<string, string | number>;
  starts_at: string;
  ends_at: string;
  status: string;
  watched: boolean;
  auto_maximum: number | null;
};
export type Auction = {
  mode?: string;
  hidden?: boolean;
  enforce_limits?: boolean;
  seller_code?: string;
  banner?: string;
  auction_number?: number;
  search_vehicles?: Record<string, unknown>[];
  category?: string;
  cancelled_at?: string;
  id: string;
  title: string;
  insurer: string;
  location: string;
  starts_at: string;
  ends_at: string;
  status: string;
  lot_count: number;
  bid_count: number;
  extension_seconds: number;
  buffer_seconds: number;
  terms: string;
  closed_at?: string;
};
export type Bid = {
  id: string;
  lot_id: string;
  lot_number: number;
  amount: number;
  created_at: string;
  bidder_name: string;
  is_auto?: boolean;
};
export type Detail = {
  summary?: { bidders: number };
  auction: Auction;
  lots: Lot[];
  bids: Bid[];
  serverTime: string;
};
export const rupees = (n: number | null | undefined) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(n / 100);
export const date = (s?: string) =>
  s
    ? new Date(s).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      })
    : '—';
export const paise = (value: string) => Math.round(Number(value) * 100);
export function localDate(s: string) {
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export async function api<T = unknown>(
  path: string,
  method = 'GET',
  body?: unknown,
): Promise<T> {
  if (DEMO_MODE) {
    const { demoApi } = await import('../../demo/data');
    return demoApi<T>(path, method);
  }
  const form = body instanceof FormData;
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body && !form ? { 'Content-Type': 'application/json' } : {},
      body: body ? (form ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && path !== '/auth/login')
        window.dispatchEvent(new Event('session-ended'));
      throw Object.assign(new Error(data.error || 'Request failed.'), {
        reportBase64:
          typeof data.reportBase64 === 'string' ? data.reportBase64 : undefined,
      });
    }
    return data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError')
      throw new Error(
        'Request timed out. Refresh to check the result before retrying.',
      );
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
export function Brand() {
  return (
    <span className="brand">
      ELV<span className="brand-x">X</span>CHANGE
      <span className="brand-dot">●</span>
    </span>
  );
}
export function InventoryErrorReport({ base64 }: { base64: string }) {
  const [url, setUrl] = React.useState('');
  useEffect(() => {
    if (!base64) {
      setUrl('');
      return;
    }
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
      link = URL.createObjectURL(
        new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
    setUrl(link);
    return () => URL.revokeObjectURL(link);
  }, [base64]);
  return url ? (
    <a
      className="btn btn-outline-danger btn-sm mb-3"
      href={url}
      download="ELVXCHANGE-Inventory-Errors.xlsx"
    >
      Download row error report
    </a>
  ) : null;
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement<{ id?: string; required?: boolean }>;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {children.props.required && (
          <span className="required-mark" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {React.cloneElement(children, { id })}
    </div>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {status === 'LIVE' && <span className="live-dot" />}
      {status}
    </span>
  );
}
export function Modal({
  title,
  onClose,
  children,
  className,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="btn btn-light"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Countdown({ until, now }: { until: string; now: number }) {
  const seconds = Math.max(0, Math.ceil((Date.parse(until) - now) / 1000));
  const h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = seconds % 60;
  return (
    <span className="countdown">
      {h > 24 ? `${Math.floor(h / 24)}d ` : ''}
      {String(h % 24).padStart(2, '0')}:{String(m).padStart(2, '0')}:
      {String(s).padStart(2, '0')}
    </span>
  );
}
