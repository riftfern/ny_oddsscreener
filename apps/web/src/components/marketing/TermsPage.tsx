import { Link } from 'react-router-dom';
import { BRAND, SUPPORT_MAILTO } from '@ny-sharp-edge/shared';
import LegalShell, { LegalH2 } from './LegalShell';

export default function TermsPage() {
  return (
    <LegalShell title="Terms of use">
      <section>
        <LegalH2>1. The agreement</LegalH2>
        <p>
          These terms govern use of {BRAND.name} at {BRAND.domain} and related apps (the
          “Service”). By creating an account, paying, or using the Service you agree to them. If you
          do not agree, do not use it.
        </p>
      </section>

      <section>
        <LegalH2>2. Who we are</LegalH2>
        <p>
          {BRAND.name} operates {BRAND.url}. Contact:{' '}
          <a href={SUPPORT_MAILTO} className="text-lichen break-all">
            {BRAND.supportEmail}
          </a>
          .
        </p>
      </section>

      <section>
        <LegalH2>3. What the Service is — and is not</LegalH2>
        <p>
          The Service shows sportsbook and exchange odds, compares them to a sharp fair line
          (typically Pinnacle, juice removed), and may surface +EV, ticket shapes, and related
          tools. It is an information product only.
        </p>
        <p className="mt-3">
          We are not a sportsbook. We do not accept wagers, hold funds for betting, or place bets
          for you. We are not a registered investment advisor. Nothing here is a recommendation to
          bet. You can lose money. Past examples are not a guarantee of future results.
        </p>
      </section>

      <section>
        <LegalH2>4. Eligibility</LegalH2>
        <p>
          You must be 18 or older. You are responsible for following the betting and advertising
          laws where you live, including New York. If you cannot legally bet, do not use the Service
          to decide wagers.
        </p>
      </section>

      <section>
        <LegalH2>5. Accounts</LegalH2>
        <p>
          Sign-in is provided by Clerk. You must keep your login safe. We may suspend access for
          abuse, fraud, chargebacks, or violation of these terms.
        </p>
      </section>

      <section>
        <LegalH2>6. Plans and billing</LegalH2>
        <p>
          Paid plans are billed by Stripe. Current list prices: Edge $19 per month; Pro $49 per
          month. Taxes may apply. You authorize Stripe to charge the payment method on file until
          you cancel.
        </p>
        <p className="mt-3">
          Cancel any time in the Stripe customer portal (More → Manage billing). Cancellation stops
          future renewals. You keep paid access until the end of the period you already paid,
          unless we end access for a chargeback or a terms violation.
        </p>
        <p className="mt-3">
          If a payment fails, Stripe may retry. After retries fail the subscription can become
          unpaid or canceled and the account falls back to the free tier. Chargebacks end paid
          access when the subscription ends.
        </p>
      </section>

      <section>
        <LegalH2>7. Odds, tickets, and data quality</LegalH2>
        <p>
          Odds come from third parties (including The Odds API and, where shown, exchange venues).
          Lines can be wrong, delayed, stale, or pulled without notice. A number on screen may have
          moved by the time you bet. +EV is a calculation against a fair line, not a promise the
          bet will win or that the book will take it.
        </p>
        <p className="mt-3">
          Parlays, teasers, round robins, if-bets, and similar tickets are shapes, not locks.
          Combined payouts are illustrations if every leg cashes at the displayed price. Extra
          juice often applies. We do not guarantee fill, limits, or promo eligibility at any book.
        </p>
      </section>

      <section>
        <LegalH2>8. Acceptable use</LegalH2>
        <p>
          Do not scrape, overload, or reverse-engineer the Service; share a paid login; bypass plan
          gates; or use the Service for anything illegal. Automated harvesting of odds through our
          API without permission is not allowed.
        </p>
      </section>

      <section>
        <LegalH2>9. Intellectual property</LegalH2>
        <p>
          The {BRAND.name} name, wordmark, and product UI belong to us. Odds data remains subject
          to its providers’ terms. You may not copy the product as a competing service.
        </p>
      </section>

      <section>
        <LegalH2>10. Disclaimer and limit of liability</LegalH2>
        <p>
          THE SERVICE IS PROVIDED “AS IS.” WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT TO THE FULLEST EXTENT THE LAW ALLOWS. We are not
          liable for lost bets, limited accounts, stale lines, downtime, or lost profits. To the
          extent liability cannot be excluded, it is limited to the amount you paid us in the
          three months before the claim, or $49, whichever is greater.
        </p>
      </section>

      <section>
        <LegalH2>11. Changes</LegalH2>
        <p>
          We may change the Service or these terms. Material changes will be posted on this page
          with a new effective date. Continued use after that date is acceptance.
        </p>
      </section>

      <section>
        <LegalH2>12. Law</LegalH2>
        <p>
          These terms are governed by the laws of the State of New York, excluding conflict-of-law
          rules. If a court finds a piece unenforceable, the rest still applies.
        </p>
      </section>

      <section>
        <LegalH2>13. Contact</LegalH2>
        <p>
          <a href={SUPPORT_MAILTO} className="text-lichen break-all">
            {BRAND.supportEmail}
          </a>
          {' · '}
          <Link to="/privacy" className="text-lichen">
            Privacy
          </Link>
          {' · '}
          <Link to="/legal" className="text-lichen">
            Support
          </Link>
        </p>
      </section>
    </LegalShell>
  );
}
