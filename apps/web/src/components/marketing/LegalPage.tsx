import { Link } from 'react-router-dom';
import { BRAND, SUPPORT_MAILTO } from '@ny-sharp-edge/shared';
import LegalShell, { LegalH2 } from './LegalShell';

export default function LegalPage() {
  return (
    <LegalShell title="Support">
      <section>
        <LegalH2>Email</LegalH2>
        <p>
          Billing, access, and product questions:{' '}
          <a href={SUPPORT_MAILTO} className="text-lichen break-all">
            {BRAND.supportEmail}
          </a>
          . We read it. Aim for a reply within two business days. We do not place bets, call
          sportsbooks about limited accounts, or give wagering advice.
        </p>
      </section>

      <section>
        <LegalH2>Billing</LegalH2>
        <p>
          Edge is $19/mo. Pro is $49/mo. Cancel any time from More → Manage billing (Stripe Customer
          Portal). Access to paid screens follows the live subscription. A chargeback ends access
          when the subscription ends.
        </p>
      </section>

      <section>
        <LegalH2>What this product is</LegalH2>
        <p>
          {BRAND.name} is an informational odds screener. It is not a sportsbook, not a gambling
          operator, and not an investment advisor. We do not accept wagers. Odds can be stale,
          delayed, or pulled. Ticket ideas are shapes, not locks.
        </p>
      </section>

      <section>
        <LegalH2>Legal</LegalH2>
        <p>
          <Link to="/terms" className="text-lichen">
            Terms of use
          </Link>
          {' · '}
          <Link to="/privacy" className="text-lichen">
            Privacy policy
          </Link>
          . You must be 18 or older.
        </p>
      </section>
    </LegalShell>
  );
}
