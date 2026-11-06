import { assetUrl } from '../../demo/mode';
import { BatchSchedule } from '../../features/imports/imports-ui';
import {
  VehicleCommercial,
  WorkflowCreditBanner,
} from '../../features/workflow/operations-ui';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  closedSearch,
  closedFields,
  archiveSince,
} from '../../features/auctions/search';
import {
  WorkflowHub,
  WorkflowLotButton,
  ReferenceImages,
  workflowSections,
} from '../../features/workflow/workflow';
import {
  PublicAuctions,
  EventActions,
  VehicleThumbnail,
  BidConfirmation,
  AuctionEntry,
  UserStatus,
} from '../../features/auctions/layout';

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
} from '../../shared/components/shared';
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
} from '../../features/users/core';

type InventoryLot = Pick<
  Lot,
  | 'registration'
  | 'make'
  | 'model'
  | 'year'
  | 'fuel'
  | 'condition'
  | 'starting_price'
  | 'increment'
> &
  Partial<Pick<Lot, 'metadata' | 'starts_at' | 'ends_at'>>;
export function AuctionForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Detail;
  onSave: (data: unknown, files?: File[]) => Promise<void>;
  onClose: () => void;
}) {
  const [termsExcel, setTermsExcel] = useState<File | null>(null),
    [termsPdf, setTermsPdf] = useState<File | null>(null),
    [imagesZip, setImagesZip] = useState<File | null>(null),
    [additionalTerms, setAdditionalTerms] = useState<File | null>(null);
  const [createKey] = useState(() => crypto.randomUUID());
  const [errorReport, setErrorReport] = useState('');
  const a = initial?.auction;
  const [data, setData] = useState({
    title: a?.title || '',
    insurer: a?.insurer || '',
    location: a?.location || '',
    starts_at: localDate(
      a?.starts_at || new Date(Date.now() + 3600000).toISOString(),
    ),
    ends_at: localDate(
      a?.ends_at || new Date(Date.now() + 7200000).toISOString(),
    ),
    extension_seconds: a?.extension_seconds || 0,
    buffer_seconds: a?.buffer_seconds || 0,
    terms: a?.terms || '',
    category: a?.category || '4W',
    mode: a?.mode || 'ONLINE',
    hidden: a?.hidden || false,
    enforce_limits: a?.enforce_limits ?? true,
    seller_code: a?.seller_code || '',
  });
  const [lots, setLots] = useState<InventoryLot[]>(initial?.lots || []),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState('');
  const [vehicle, setVehicle] = useState({
    registration: '',
    make: '',
    model: '',
    year: String(new Date().getFullYear()),
    fuel: 'Petrol',
    condition: '',
    price: '',
    increment: '500',
    start: '',
    end: '',
  });
  const change = (key: string, value: string | number) =>
    setData((d) => ({ ...d, [key]: value }));
  const v = (key: string, value: string) =>
    setVehicle((d) => ({ ...d, [key]: value }));
  function addVehicle() {
    if (
      !vehicle.registration.trim() ||
      !vehicle.make.trim() ||
      !vehicle.model.trim() ||
      !/^\d{4}$/.test(vehicle.year) ||
      Number(vehicle.year) < 1900 ||
      Number(vehicle.year) > 2100 ||
      paise(vehicle.price) <= 0 ||
      paise(vehicle.increment) <= 0 ||
      !Number.isFinite(paise(vehicle.price))
    ) {
      setError(
        'Enter registration, make, model, valid year, starting price and increment.',
      );
      return;
    }
    if (lots.length >= 2000) {
      setError('Maximum 2000 vehicles per auction.');
      return;
    }
    setLots((old) => [
      ...old,
      {
        registration: vehicle.registration.trim().toUpperCase(),
        make: vehicle.make,
        model: vehicle.model,
        year: Number(vehicle.year),
        fuel: vehicle.fuel,
        condition: vehicle.condition,
        starting_price: paise(vehicle.price),
        increment: paise(vehicle.increment),
        starts_at: vehicle.start
          ? new Date(vehicle.start).toISOString()
          : undefined,
        ends_at: vehicle.end ? new Date(vehicle.end).toISOString() : undefined,
      },
    ]);
    setVehicle((old) => ({
      ...old,
      registration: '',
      make: '',
      model: '',
      condition: '',
      price: '',
    }));
    setError('');
  }
  return (
    <Modal
      className="schedule-modal"
      title={a ? 'Edit upcoming auction' : 'Schedule insurance auction'}
      onClose={() => {
        if (!busy && !uploading) onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await onSave(
              {
                ...data,
                create_key: createKey,
                starts_at: new Date(data.starts_at).toISOString(),
                ends_at: new Date(data.ends_at).toISOString(),
                lots,
              },
              [termsExcel, termsPdf, imagesZip, additionalTerms].filter(
                (f): f is File => !!f,
              ),
            );
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-section-label">Inventory File</div>
        <div className="upload-box">
          <div>
            <strong>Upload inventory</strong>
            <p>
              Use our blank Excel template. Up to 2000 vehicles / 2 MB. Import
              replaces the list below.
            </p>
            <a
              className="btn btn-outline-success btn-sm"
              href={assetUrl('/api/inventory/template')}
              download
            >
              ↓ Download template
            </a>
          </div>
          <Field label={uploading ? 'Reading file…' : 'Inventory file (.xlsx)'}>
            <input
              type="file"
              className="form-control"
              accept=".xlsx"
              disabled={uploading || busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (
                  lots.length &&
                  !confirm(
                    'Replace the current vehicle list with this inventory?',
                  )
                ) {
                  e.target.value = '';
                  return;
                }
                setUploading(true);
                setError('');
                setErrorReport('');
                try {
                  const form = new FormData();
                  form.append('inventory', file);
                  setLots(
                    await api<InventoryLot[]>(
                      '/inventory/preview',
                      'POST',
                      form,
                    ),
                  );
                } catch (e) {
                  setError((e as Error).message);
                  setErrorReport(
                    (e as Error & { reportBase64?: string }).reportBase64 || '',
                  );
                } finally {
                  setUploading(false);
                }
              }}
            />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="T & C (Excel)">
            <input
              className="form-control"
              type="file"
              accept=".xlsx"
              onChange={(e) => setTermsExcel(e.target.files?.[0] || null)}
            />
          </Field>
          <Field label="T & C (PDF)">
            <input
              className="form-control"
              type="file"
              accept=".pdf"
              onChange={(e) => setTermsPdf(e.target.files?.[0] || null)}
            />
          </Field>
          <Field label="Upload Images (.zip, max 10 MB)">
            <input
              className="form-control"
              type="file"
              accept=".zip"
              onChange={(e) => setImagesZip(e.target.files?.[0] || null)}
            />
          </Field>
          <Field label="Additional T & C documents (PDF)">
            <input
              className="form-control"
              type="file"
              accept=".pdf"
              onChange={(e) => setAdditionalTerms(e.target.files?.[0] || null)}
            />
          </Field>
        </div>{' '}
        <div className="form-section-label">Auction Details & Schedule</div>
        <div className="form-grid">
          {(['title', 'insurer', 'location'] as const).map((key) => (
            <Field
              key={key}
              label={
                key === 'title'
                  ? 'Auction title'
                  : key === 'insurer'
                    ? 'Insurance company'
                    : 'Location'
              }
            >
              <input
                className="form-control"
                required
                maxLength={160}
                value={data[key]}
                onChange={(e) => change(key, e.target.value)}
              />
            </Field>
          ))}
          <Field label="Auction mode">
            <select
              className="form-select"
              value={data.mode}
              onChange={(e) => change('mode', e.target.value)}
            >
              {['ONLINE', 'OPEN', 'YARD', 'OFFLINE'].map((mode) => (
                <option key={mode}>{mode}</option>
              ))}
            </select>
          </Field>
          <Field label="Seller code">
            <input
              className="form-control"
              value={data.seller_code}
              onChange={(e) => change('seller_code', e.target.value)}
            />
          </Field>
          <Field label="Require insurance credit / vehicle limit">
            <input
              type="checkbox"
              checked={data.enforce_limits}
              onChange={(e) =>
                setData({ ...data, enforce_limits: e.target.checked })
              }
            />
          </Field>
          <Field label="Hidden event">
            <input
              type="checkbox"
              checked={data.hidden}
              onChange={(e) => setData({ ...data, hidden: e.target.checked })}
            />
          </Field>
          <Field label="Product / category">
            <select
              className="form-select"
              value={data.category}
              onChange={(e) => change('category', e.target.value)}
            >
              {['2W', '3W', '4W', 'CV', 'CE', 'FE', 'Mixed'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Starts at (your local time)">
            <input
              type="datetime-local"
              className="form-control"
              required
              value={data.starts_at}
              onChange={(e) => change('starts_at', e.target.value)}
            />
          </Field>
          <Field label="Closes at (your local time)">
            <input
              type="datetime-local"
              className="form-control"
              required
              value={data.ends_at}
              onChange={(e) => change('ends_at', e.target.value)}
            />
          </Field>
          <Field label="Auto-extension (seconds; 0 = off)">
            <input
              type="number"
              className="form-control"
              min="0"
              max="600"
              required
              value={data.extension_seconds}
              onChange={(e) =>
                change('extension_seconds', Number(e.target.value))
              }
            />
          </Field>
          <Field label="Extend for bids in last (seconds)">
            <input
              type="number"
              className="form-control"
              min="0"
              max="600"
              required
              value={data.buffer_seconds}
              onChange={(e) => change('buffer_seconds', Number(e.target.value))}
            />
          </Field>
        </div>
        <Field label="Auction terms / vehicle inspection instructions">
          <textarea
            className="form-control"
            rows={3}
            maxLength={10000}
            value={data.terms}
            onChange={(e) => change('terms', e.target.value)}
          />
        </Field>
        <details className="manual-entry" open={!lots.length}>
          <summary>Or add a vehicle manually</summary>
          <div className="form-grid mt-3">
            {(
              [
                'registration',
                'make',
                'model',
                'year',
                'fuel',
                'price',
                'increment',
              ] as const
            ).map((key) => (
              <Field
                key={key}
                label={
                  key === 'price'
                    ? 'Starting price (₹)'
                    : key === 'increment'
                      ? 'Bid increment (₹)'
                      : key[0].toUpperCase() + key.slice(1)
                }
              >
                <input
                  type={
                    ['year', 'price', 'increment'].includes(key)
                      ? 'number'
                      : 'text'
                  }
                  step={key === 'year' ? '1' : '0.01'}
                  min={key === 'year' ? '1900' : '0.01'}
                  max={key === 'year' ? '2100' : undefined}
                  className="form-control"
                  maxLength={160}
                  value={vehicle[key]}
                  onChange={(e) => v(key, e.target.value)}
                />
              </Field>
            ))}
            <Field label="Vehicle starts (optional local time)">
              <input
                type="datetime-local"
                className="form-control"
                value={vehicle.start}
                onChange={(e) => v('start', e.target.value)}
              />
            </Field>
            <Field label="Vehicle closes (optional local time)">
              <input
                type="datetime-local"
                className="form-control"
                value={vehicle.end}
                onChange={(e) => v('end', e.target.value)}
              />
            </Field>
            <Field label="Condition / damage">
              <input
                className="form-control"
                maxLength={2000}
                value={vehicle.condition}
                onChange={(e) => v('condition', e.target.value)}
              />
            </Field>
          </div>
          <button
            className="btn btn-outline-success btn-sm"
            type="button"
            onClick={addVehicle}
          >
            + Add vehicle to inventory
          </button>
        </details>
        {lots.length > 0 && (
          <div className="table-responsive inventory-preview">
            <table className="table">
              <caption>{lots.length} vehicles ready to schedule</caption>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Registration</th>
                  <th>Starting price</th>
                  <th>Increment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((l, i) => (
                  <tr key={i}>
                    <td>
                      {l.make} {l.model} · {l.year}
                    </td>
                    <td>{l.registration}</td>
                    <td>{rupees(l.starting_price)}</td>
                    <td>{rupees(l.increment)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          setLots((all) => all.filter((_, n) => n !== i))
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <InventoryErrorReport base64={errorReport} />
        <div className="form-actions">
          <span className="text-secondary me-auto">
            {lots.length} vehicles · Insurance only
          </span>
          <button
            type="button"
            disabled={busy || uploading}
            className="btn btn-light"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-success"
            disabled={busy || uploading || !lots.length}
          >
            {busy ? 'Saving…' : a ? 'Save changes' : 'Schedule auction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
