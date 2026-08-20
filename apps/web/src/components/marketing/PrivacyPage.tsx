import { Link } from 'react-router-dom';
import { BRAND, SUPPORT_MAILTO } from '@ny-sharp-edge/shared';
import LegalShell, { LegalH2 } from './LegalShell';

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy policy">
      <section>
        <LegalH2>1. Scope</LegalH2>
        <p>
          This policy describes how {BRAND.name} ({BRAND.domain}) handles personal information when
          you use the Service. It is written for a small subscription product: we collect as little
          as we need to run accounts, billing, and the odds board.
        </p>
      </section>

      <section>
        <LegalH2>2. What we collect</LegalH2>
        <p>Depending on how you use the Service, we may process:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Account data from Clerk: email, user id, session, and sign-in metadata.</li>
          <li>
            Billing data via Stripe: customer id, plan, and payment status. We do not store full
            card numbers. Stripe does.
          </li>
          <li>
            Product data we store on your Clerk user: plan (`free` / `edge` / `pro`), optional
            Stripe customer id, and the sportsbooks you said you use.
          </li>
          <li>
            Browser-only data: local bankroll, slip, and book picks saved on your device. That
            does not automatically sync to our servers unless you are signed in and we write books
            to your Clerk profile.
          </li>
          <li>Technical logs: IP, user agent, and error traces as needed to keep the API up.</li>
        </ul>
      </section>

      <section>
        <LegalH2>3. What we do not collect</LegalH2>
        <p>
          We do not ask for your sportsbook passwords or bank login. We do not receive a feed of
          the bets you actually placed at FanDuel or DraftKings. Simulated tickets in the app live
          in your browser unless you later choose a synced tracker.
        </p>
      </section>

      <section>
        <LegalH2>4. Why we use it</LegalH2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To authenticate you and enforce the plan you paid for.</li>
          <li>To show odds and edges only for shops you selected.</li>
          <li>To bill, refund, or cancel through Stripe.</li>
          <li>To answer support mail and fix bugs.</li>
          <li>To protect the Service from abuse.</li>
        </ul>
      </section>

      <section>
        <LegalH2>5. Processors</LegalH2>
        <p>We use other companies to run the product:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Clerk — authentication.</li>
          <li>Stripe — payments and the customer portal.</li>
          <li>
            The Odds API and similar market-data providers — odds. Requests are for sports and
            regions, not your name.
          </li>
          <li>Hosting and DNS for {BRAND.domain} when the site is in production.</li>
        </ul>
        <p className="mt-3">
          Those processors have their own policies. We do not sell your personal information and we
          do not rent email lists.
        </p>
      </section>

      <section>
        <LegalH2>6. Cookies and sessions</LegalH2>
        <p>
          Clerk sets session cookies so you stay signed in. We do not run a third-party ad network
          on the product today. If that changes, this page will too.
        </p>
      </section>

      <section>
        <LegalH2>7. Retention</LegalH2>
        <p>
          Account and plan data last as long as the account is open. After you ask us to delete the
          account we remove Clerk user records we control, subject to billing and legal holds
          Stripe or the law may require. Browser storage you can clear yourself.
        </p>
      </section>

      <section>
        <LegalH2>8. Your choices</LegalH2>
        <p>
          You can update books in the app, cancel in Stripe, sign out, or email{' '}
          <a href={SUPPORT_MAILTO} className="text-lichen break-all">
            {BRAND.supportEmail}
          </a>{' '}
          to correct data or request deletion. If you are in a place with extra privacy rights
          (including some US states), we will honor a verifiable request to access or delete
          personal information we hold.
        </p>
      </section>

      <section>
        <LegalH2>9. Children</LegalH2>
        <p>The Service is 18+. We do not knowingly collect data from children.</p>
      </section>

      <section>
        <LegalH2>10. Changes and contact</LegalH2>
        <p>
          Updates land on this page with a new effective date.{' '}
          <a href={SUPPORT_MAILTO} className="text-lichen break-all">
            {BRAND.supportEmail}
          </a>
          {' · '}
          <Link to="/terms" className="text-lichen">
            Terms
          </Link>
        </p>
      </section>
    </LegalShell>
  );
}
