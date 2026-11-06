import { DEMO_MODE } from '../../demo/mode';
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

const demoStateContacts = [
  ['Andaman and Nicobar Islands', 'Aditya Roy'],
  ['Andhra Pradesh', 'Sai Reddy'],
  ['Arunachal Pradesh', 'Tashi Dorjee'],
  ['Assam', 'Ananya Das'],
  ['Bihar', 'Amit Kumar'],
  ['Chandigarh', 'Navjot Kaur'],
  ['Chhattisgarh', 'Neha Verma'],
  ['Dadra and Nagar Haveli and Daman and Diu', 'Rohan Patel'],
  ['Delhi', 'Aarav Sharma'],
  ['Goa', 'Riya Naik'],
  ['Gujarat', 'Dhruv Shah'],
  ['Haryana', 'Karan Malik'],
  ['Himachal Pradesh', 'Pooja Thakur'],
  ['Jammu and Kashmir', 'Ayaan Mir'],
  ['Jharkhand', 'Rahul Sinha'],
  ['Karnataka', 'Ananya Rao'],
  ['Kerala', 'Arjun Nair'],
  ['Ladakh', 'Tsering Namgyal'],
  ['Lakshadweep', 'Sara Ali'],
  ['Madhya Pradesh', 'Vivek Joshi'],
  ['Maharashtra', 'Rohan Deshmukh'],
  ['Manipur', 'Priya Devi'],
  ['Meghalaya', 'Daniel Sangma'],
  ['Mizoram', 'Lalrin Puii'],
  ['Nagaland', 'Imli Ao'],
  ['Odisha', 'Sourav Das'],
  ['Puducherry', 'Kavya Raj'],
  ['Punjab', 'Simran Kaur'],
  ['Rajasthan', 'Mohit Rathore'],
  ['Sikkim', 'Pema Bhutia'],
  ['Tamil Nadu', 'Karthik Kumar'],
  ['Telangana', 'Harika Rao'],
  ['Tripura', 'Riya Deb'],
  ['Uttar Pradesh', 'Nitin Gupta'],
  ['Uttarakhand', 'Meera Rawat'],
  ['West Bengal', 'Ishita Sen'],
];

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [register, setRegister] = useState(false),
    [help, setHelp] = useState(false),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [demoRole, setDemoRole] = useState<User['role']>('ADMIN');
  const usernameRef = useRef<HTMLInputElement>(null);
  return (
    <div className="public-page">
      <header className="site-header public-header">
        <Brand />
        <nav aria-label="Public navigation">
          <a href="#auction-solution">AUCTION SOLUTION</a>
          <a href="#faqs">FAQS</a>
          <a href="#contact-us">CONTACT US</a>
        </nav>
      </header>
      <main className="public-container">
        <div className="public-login-row">
          <section className="content-card login-form-card">
            <h1>Sign in</h1>
            {DEMO_MODE && (
              <div className="alert alert-info">
                <p>
                  <strong>Client UI preview</strong>
                  <br />
                  Sample data only. Forms do not save changes. Sign out to
                  explore another role.
                </p>
                <label htmlFor="demo-role">Explore as</label>
                <select
                  id="demo-role"
                  className="form-select mb-2"
                  value={demoRole}
                  onChange={(e) => setDemoRole(e.target.value as User['role'])}
                >
                  {[
                    'ADMIN',
                    'BUYER',
                    'AUCTION_MANAGER',
                    'UPLOAD_QC',
                    'INFO_QC',
                    'ZONAL_MANAGER',
                    'SELLER_ADMIN',
                    'TELECALLER',
                  ].map((role) => (
                    <option key={role} value={role}>
                      {role.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={async () => {
                    const { selectDemoUser } = await import('../../demo/data');
                    if (!location.hash.startsWith('#/'))
                      location.hash = '/events/live-auctions';
                    onLogin(selectDemoUser(demoRole));
                  }}
                >
                  Enter UI preview
                </button>
              </div>
            )}
            <p>Welcome to ELVXCHANGE</p>
            {message && (
              <div className="alert alert-info" role="status">
                {message}
              </div>
            )}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError('');
                try {
                  onLogin(
                    await api<User>('/auth/login', 'POST', {
                      email: email.trim(),
                      password,
                    }),
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="User Name">
                <input
                  ref={usernameRef}
                  className="form-control"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  className="form-control"
                  required
                  maxLength={128}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <div className="login-action-row">
                <button className="btn btn-success" disabled={busy}>
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => setRegister(true)}
                >
                  Register
                </button>
              </div>
            </form>
            <button className="text-action" onClick={() => setHelp(true)}>
              Forgot password?
            </button>
          </section>
          <section className="content-card important-message">
            <span className="eyebrow">RETHINK / REVALUE / REUSE</span>
            <h2 id="state-contacts-heading">State-wise Contacts</h2>
            <p id="state-contacts-note">
              Demo contacts for all states and union territories. Numbers are
              placeholders for preview only.
            </p>
            <div
              className="state-contacts-scroll"
              role="region"
              aria-labelledby="state-contacts-heading"
              tabIndex={0}
            >
              <table
                className="state-contacts-table"
                aria-describedby="state-contacts-note"
              >
                <thead>
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">State / UT</th>
                    <th scope="col">Contact name</th>
                    <th scope="col">Number</th>
                  </tr>
                </thead>
                <tbody>
                  {demoStateContacts.map(([state, name], index) => (
                    <tr key={state}>
                      <td>{index + 1}</td>
                      <th scope="row">{state}</th>
                      <td>{name}</td>
                      <td>+91 98XXX {String(10001 + index)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <PublicAuctions
          onEnter={(a) => {
            location.hash =
              '/events/' + a.status.toLowerCase() + '-auction-details/' + a.id;
            setMessage('Sign in to enter ' + a.title + '.');
            usernameRef.current?.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <div className="public-info-grid">
          <section className="content-card info-card">
            <h2>Auction features</h2>
            <ul>
              <li>Upcoming, live and closed insurance auctions</li>
              <li>Vehicle details, images and inspection information</li>
              <li>Manual bids, auto bids and watchlist</li>
              <li>Bid history and saved auction results</li>
            </ul>
          </section>
          <section className="content-card info-card">
            <h2>Easy Registration Process</h2>
            <ol>
              <li>Create your buyer account.</li>
              <li>Complete your personal details and identity documents.</li>
              <li>Get verified and trained by an administrator.</li>
              <li>Review auction eligibility and start bidding.</li>
            </ol>
            <button
              className="btn btn-outline-success"
              onClick={() => setRegister(true)}
            >
              Register now
            </button>
          </section>
        </div>
        <section id="faqs" className="content-card info-card">
          <h2>Frequently Asked Questions</h2>
          <details>
            <summary>When can I place a bid?</summary>
            <p>
              Your account must be trained, insurance-eligible and permitted for
              the vehicle category/location. The vehicle must be open for
              bidding.
            </p>
          </details>
          <details>
            <summary>Can an auction end time change?</summary>
            <p>
              Valid late bids can extend a vehicle according to its extension
              settings. Always check the current server time and displayed end
              time.
            </p>
          </details>
          <details>
            <summary>Where can I check my bids?</summary>
            <p>
              Open the event's My bids tab. Saved vehicles appear in Watchlist,
              and your highest-bid results appear in My Results.
            </p>
          </details>
        </section>
        <section id="contact-us" className="content-card info-card">
          <h2>Contact Us</h2>
          <p>
            For account and auction assistance, contact the administrator who
            manages your ELVXCHANGE access.
          </p>
        </section>
        <footer className="site-footer">
          <Brand />
          <span>RETHINK / REVALUE / REUSE</span>
          <span>© 2026 ELVXCHANGE</span>
        </footer>
      </main>
      {register && <Registration onClose={() => setRegister(false)} />}
      {help && (
        <Modal title="Password help" onClose={() => setHelp(false)}>
          <p>
            Contact your ELVXCHANGE administrator to reset your account
            password. An administrator can reset it from Users → Edit user.
          </p>
          <button className="btn btn-success" onClick={() => setHelp(false)}>
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}
