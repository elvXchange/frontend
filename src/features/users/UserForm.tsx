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

export function UserForm({
  user,
  onSave,
  onClose,
  initialRole = 'BUYER',
}: {
  user?: User;
  onSave: (data: unknown) => Promise<void>;
  onClose: () => void;
  initialRole?: 'ADMIN' | 'BUYER';
}) {
  const [data, setData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || '',
    insurance_eligible: user?.insurance_eligible ?? true,
    role: user?.role || initialRole,
    status: user?.status || (initialRole === 'ADMIN' ? 'ACTIVE' : 'UNVERIFIED'),
    password: '',
    assigned_insurers: (user?.assigned_insurers || []).join('\n'),
    status_reason: '',
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [profile, setProfile] = useState<Record<string, string>>(
    user?.profile || {},
  );
  const [categories, setCategories] = useState(
      user?.categories || ['2W', '3W', '4W', 'CV', 'CE', 'FE', 'Mixed'],
    ),
    [locationAccess, setLocationAccess] = useState(
      (user?.locations || []).join('\n'),
    );
  const change = (key: string, value: string) =>
    setData((d) => ({
      ...d,
      [key]: value,
      ...(key === 'role'
        ? { status: value !== 'BUYER' ? 'ACTIVE' : 'UNVERIFIED' }
        : {}),
    }));
  return (
    <Modal
      className="user-editor-modal"
      title={user ? 'Edit user' : 'Add user'}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="user-editor-grid">
        <div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                await onSave({
                  ...data,
                  assigned_insurers: data.assigned_insurers
                    .split(/\r?\n/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                  username: data.username || undefined,
                  profile,
                  categories,
                  locations: locationAccess
                    .split(/\r?\n/)
                    .map((v) => v.trim())
                    .filter(Boolean),
                  password: data.password || undefined,
                });
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
                <Field label="User name">
                  <input
                    className="form-control"
                    minLength={3}
                    maxLength={160}
                    value={data.username}
                    readOnly={!!user}
                    onChange={(e) => change('username', e.target.value)}
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    className="form-control"
                    required
                    maxLength={254}
                    value={data.email}
                    onChange={(e) => change('email', e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    className="form-control"
                    maxLength={25}
                    value={data.phone}
                    onChange={(e) => change('phone', e.target.value)}
                  />
                </Field>
                <Field label="Role">
                  <select
                    className="form-select"
                    value={data.role}
                    onChange={(e) => change('role', e.target.value)}
                  >
                    <option value="BUYER">Buyer</option>
                    <option value="ADMIN">Administrator</option>
                    {[
                      'AUCTION_MANAGER',
                      'UPLOAD_QC',
                      'INFO_QC',
                      'ZONAL_MANAGER',
                      'SELLER_ADMIN',
                      'TELECALLER',
                    ].map((role) => (
                      <option value={role} key={role}>
                        {role.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Assigned insurers (one per line; required for staff)">
                  <textarea
                    className="form-control"
                    value={data.assigned_insurers}
                    onChange={(e) =>
                      change('assigned_insurers', e.target.value)
                    }
                  />
                </Field>
                <Field
                  label={
                    user
                      ? 'New password (leave blank to keep)'
                      : 'Password (12+ characters)'
                  }
                >
                  <input
                    type="password"
                    className="form-control"
                    autoComplete="new-password"
                    required={!user}
                    minLength={12}
                    maxLength={128}
                    value={data.password}
                    onChange={(e) => change('password', e.target.value)}
                  />
                </Field>
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
                  value={data.name}
                  onChange={(e) => change('name', e.target.value)}
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
              <Field label="Insurance auction eligibility">
                <select
                  className="form-select"
                  value={String(data.insurance_eligible)}
                  onChange={(e) =>
                    setData({
                      ...data,
                      insurance_eligible: e.target.value === 'true',
                    })
                  }
                >
                  <option value="true">Eligible</option>
                  <option value="false">Not eligible</option>
                </select>
              </Field>
              {data.role === 'BUYER' && (
                <>
                  <CategoryChecks value={categories} onChange={setCategories} />
                  <Field label="Permitted auction locations (one per line; blank = all)">
                    <textarea
                      className="form-control"
                      rows={3}
                      value={locationAccess}
                      onChange={(e) => setLocationAccess(e.target.value)}
                    />
                  </Field>
                </>
              )}
            </section>
            <section className="form-card">
              <h3>KYC / Documents</h3>
              <ProfileFields
                section="identity"
                value={profile}
                onChange={setProfile}
              />
            </section>
            <section className="form-card">
              <h3>GST Info</h3>
              <ProfileFields
                section="gst"
                value={profile}
                onChange={setProfile}
              />
            </section>
            <section className="form-card">
              <h3>Operational Information</h3>
              <Field label="Status">
                <select
                  className="form-select"
                  value={data.status}
                  onChange={(e) => change('status', e.target.value)}
                >
                  {(data.role !== 'BUYER'
                    ? ['ACTIVE', 'BLOCKED']
                    : [
                        'UNVERIFIED',
                        'VERIFIED',
                        'TRAINED',
                        'BLOCKED',
                        'REJECTED',
                        ...(data.status === 'ACTIVE' ? ['ACTIVE'] : []),
                        ...(data.status === 'PENDING' ? ['PENDING'] : []),
                      ]
                  ).map((v) => (
                    <option key={v} value={v}>
                      {v === 'ACTIVE'
                        ? 'Active (existing account)'
                        : v[0] + v.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </Field>
              {user && data.status !== user.status && (
                <Field label="Status change remarks">
                  <textarea
                    className="form-control"
                    required
                    minLength={3}
                    maxLength={1000}
                    value={data.status_reason}
                    onChange={(e) => change('status_reason', e.target.value)}
                  />
                </Field>
              )}
            </section>
            {error && (
              <div role="alert" className="alert alert-danger">
                {error}
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-light"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
              <button className="btn btn-success" disabled={busy}>
                {busy ? 'Saving…' : 'Save user'}
              </button>
            </div>
          </form>
        </div>
        <aside className="user-support-panel">
          <h3>{user ? 'Uploaded Documents' : 'Requirements'}</h3>
          {user ? (
            <FilePanel owner="user" id={user.id} editable />
          ) : (
            <>
              <p>
                Review buyer details, category/location access and insurance
                eligibility before training an account.
              </p>
              <ul>
                <li>Valid user name, email and contact details</li>
                <li>Identity details and supporting documents</li>
                <li>Verification and training before bidding</li>
              </ul>
              <p>
                After saving, open the user details to upload or review
                documents.
              </p>
            </>
          )}
        </aside>
      </div>
    </Modal>
  );
}
