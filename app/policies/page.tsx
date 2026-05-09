import type { Metadata } from "next";
import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { siteConfig } from "@/lib/site-data";
import {
  CURRENT_POLICY_VERSION,
  ARCHIVED_POLICY_VERSIONS,
  formatPolicyDate,
} from "@/lib/policy-versions";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Booking, payment, cancellation and refund policy, house rules, and check-in details for Seoul Goshiwon by Star Goshiwon.",
  alternates: {
    canonical: "/policies",
    languages: {
      en: "/policies",
      ko: "/policies/ko",
    },
  },
};

const sections = [
  { id: "booking", label: "Booking & Confirmation" },
  { id: "payment", label: "Payment" },
  { id: "cancellation", label: "Cancellation & Refund" },
  { id: "changes", label: "Date Changes & Extensions" },
  { id: "checkin", label: "Check-in / Check-out" },
  { id: "deposit", label: "Security Deposit & Damages" },
  { id: "house-rules", label: "House Rules" },
  { id: "men-only", label: "Men-Only Residence" },
  { id: "liability", label: "Personal Property & Liability" },
  { id: "room-access", label: "Room Access Without Prior Consent" },
  { id: "termination", label: "Termination by Management" },
  { id: "belongings", label: "Handling of Personal Belongings After Non-Payment" },
  { id: "force-majeure", label: "Force Majeure" },
  { id: "privacy", label: "Privacy & Data" },
  { id: "updates", label: "Updates to These Policies" },
];

export default function PoliciesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionTitle
        title="Policies"
        subtitle="The rules of the house and how bookings, payments, and refunds work. Please read before submitting a booking request."
      />

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="text-sm text-gray-500">
          Effective from{" "}
          <strong>
            {formatPolicyDate(CURRENT_POLICY_VERSION.effectiveFrom, "en")}
          </strong>
          . By submitting a booking request you agree to the policies below.
        </p>
        <Link
          href="/policies/ko"
          className="text-sm font-medium text-indigo-600 hover:underline"
          hrefLang="ko"
        >
          한국어로 보기 →
        </Link>
      </div>
      {ARCHIVED_POLICY_VERSIONS.length > 0 && (
        <p className="text-sm text-gray-500 mb-8">
          Booked before{" "}
          {formatPolicyDate(CURRENT_POLICY_VERSION.effectiveFrom, "en")}?{" "}
          <Link
            href="/policies/archive"
            className="font-medium text-indigo-600 hover:underline"
          >
            View previous versions →
          </Link>
        </p>
      )}

      <nav
        aria-label="Policy sections"
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-10"
      >
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
          On this page
        </h2>
        <ol className="list-decimal pl-5 space-y-1 text-base text-indigo-700">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="hover:underline">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        <Section id="booking" title="1. Booking & Confirmation">
          <p>
            All stays start with a booking request — submitting the form on{" "}
            <Link href="/request-to-book" className="text-indigo-600 hover:underline">
              Request to Book
            </Link>{" "}
            does not charge you and does not guarantee a room. We review every
            request and respond within {siteConfig.responseTime}, usually faster.
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              A request becomes a confirmed booking only after we approve it and
              you complete payment of the first prepaid amount via PayPal.
            </li>
            <li>
              Rooms are released to other guests if payment is not received within{" "}
              <strong>48 hours</strong> of the payment link being sent.
            </li>
            <li>
              We may decline a request without explanation — for example if a
              room becomes unavailable, if the requested dates are below our
              minimum stay, or if we cannot verify your identity.
            </li>
            <li>
              The minimum stay is <strong>7 days (1 week)</strong>.
            </li>
          </ul>
        </Section>

        <Section id="payment" title="2. Payment">
          <p>
            All amounts are quoted and charged in <strong>USD via PayPal</strong>.
            KRW figures shown on the site are approximate, calculated from the
            current exchange rate. PayPal accepts most major credit and debit
            cards; a PayPal account is not required.
          </p>
          <p>
            <strong>Everything is prepaid via PayPal at booking confirmation</strong>{" "}
            — there are no cash payments at check-in. Your single PayPal charge
            covers:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              The full room rate for your booked stay (after any 15% long-stay
              discount).
            </li>
            <li>
              The optional <strong>$15 bedding set</strong> (≈ ₩20,000) if you choose to add
              it. If you don&rsquo;t add it, bedding is not provided.
            </li>
            <li>
              A refundable <strong>$70 security deposit</strong>{" "}
              (≈ ₩100,000), held against damages and unpaid charges. The
              deposit is <strong>refunded via PayPal</strong> to the same
              account at the end of your stay if the room is left undamaged.
              See{" "}
              <a href="#deposit" className="text-indigo-600 hover:underline">
                Security Deposit & Damages
              </a>
              .
            </li>
            <li>
              We do not store your card details. PayPal handles the entire
              transaction.
            </li>
            <li>
              Currency conversion fees charged by your bank or card issuer are
              not refundable by us.
            </li>
            <li>
              Exchange-rate movement between the time you pay the deposit and
              the time it is refunded is not compensated — both transactions
              are settled in USD.
            </li>
          </ul>
        </Section>

        <Section id="cancellation" title="3. Cancellation & Refund Policy">
          <p>
            Cancellations must be sent in writing — by email to{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-indigo-600 hover:underline"
            >
              {siteConfig.email}
            </a>{" "}
            or via WhatsApp. The cancellation timestamp is when we receive your
            message, in <strong>Seoul time (KST)</strong>. Refund percentages
            below apply to the <strong>total room rate paid</strong> (after any
            long-stay discount, before bedding and deposit).
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
            Before check-in
          </h3>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="text-left font-semibold text-gray-900 px-3 py-2">
                    When you cancel
                  </th>
                  <th className="text-left font-semibold text-gray-900 px-3 py-2">
                    Refund of room rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>30+ days</strong> before check-in
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>100%</strong>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>15–29 days</strong> before check-in
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>90%</strong> (10% admin fee)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>8–14 days</strong> before check-in
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>70%</strong>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>1–7 days</strong> before check-in
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>50%</strong>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>Day of check-in / no-show</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>0%</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            The <strong>$70 deposit is always refunded in full</strong> when
            you cancel — it&rsquo;s a damage deposit, not a cancellation
            penalty.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            Early check-out after you&rsquo;ve moved in
          </h3>
          <p>
            We refund a percentage of the <strong>unused portion</strong> of
            your stay (calculated pro-rata by remaining days at your effective
            daily rate), based on how much written notice you give. The 10%
            admin fee on early termination matches the Korean Fair Trade
            Commission&rsquo;s consumer-dispute standard for shared
            residential rentals.
          </p>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="text-left font-semibold text-gray-900 px-3 py-2">
                    Notice given before intended departure
                  </th>
                  <th className="text-left font-semibold text-gray-900 px-3 py-2">
                    Refund of unused portion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>7+ days notice</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>90%</strong> (10% admin fee)
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-3 align-top">
                    <strong>Less than 7 days notice</strong>
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    <strong>80%</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="list-disc pl-6 space-y-1.5 mt-3">
            <li>
              If your actual stay drops below 4 weeks, the 15% long-stay
              discount is recalculated and the difference is deducted from your
              refund. If recalculation shows you owe more than what was
              prepaid, the balance is due before checkout.
            </li>
            <li>
              The <strong>$70 deposit</strong> is returned via PayPal after
              checkout if the room is left clean and undamaged. See{" "}
              <a href="#deposit" className="text-indigo-600 hover:underline">
                Security Deposit & Damages
              </a>
              .
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            Non-refundable items
          </h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              The <strong>$15 bedding fee</strong> once bedding has been
              prepared, opened, or used.
            </li>
            <li>
              PayPal and card-network processing fees, currency conversion
              spreads charged by your bank, and any local taxes withheld by the
              payment processor.
            </li>
            <li>
              Optional services already delivered (e.g., airport pickup if we
              offered one).
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            How and when refunds are paid
          </h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              All refunds — including cancellation refunds and the security
              deposit — are issued through <strong>PayPal</strong> to the same
              account or card you paid with. There are no cash refunds.
            </li>
            <li>
              The security deposit refund is initiated within{" "}
              <strong>5 business days</strong> after checkout, once we have
              inspected the room.
            </li>
            <li>
              PayPal typically settles within <strong>5–10 business days</strong>;
              your bank may add additional processing time.
            </li>
            <li>
              All payments and refunds are settled in <strong>USD</strong>.
              Exchange-rate movement between payment and refund is not
              compensated.
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">
            Exceptional circumstances
          </h3>
          <p>
            For documented medical emergencies, denied visas, or other serious
            events outside your control, contact us as early as possible. We
            review these case by case and frequently waive penalties when
            supporting documentation is provided. See also{" "}
            <a href="#force-majeure" className="text-indigo-600 hover:underline">
              Force Majeure
            </a>
            .
          </p>
        </Section>

        <Section id="changes" title="4. Date Changes & Extensions">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>Date changes before check-in:</strong> free of charge if
              requested 7+ days before check-in and the new dates are
              available. Within 7 days, treated as a cancellation under the
              schedule above unless we can swap dates without re-letting the
              room.
            </li>
            <li>
              <strong>Extending your stay:</strong> let us know at least 7 days
              before your scheduled check-out. Extensions are subject to
              availability and the rate in effect for the extension period.
            </li>
            <li>
              If your extension brings the total stay to 4 weeks or longer, the
              15% long-stay discount is applied retroactively across the full
              stay.
            </li>
          </ul>
        </Section>

        <Section id="checkin" title="5. Check-in / Check-out">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>Check-in:</strong> 2 PM.
            </li>
            <li>
              <strong>Late arrival:</strong> message us as soon as you know.
            </li>
            <li>
              <strong>Check-out:</strong> by 11 AM on your departure date.
            </li>
            <li>
              Check-in is <strong>self check-in</strong> — there is no front
              desk to greet you, so identity verification must be completed
              <strong> before</strong> arrival.
            </li>
            <li>
              Before arrival, send us clear photos of your{" "}
              <strong>passport</strong> and your{" "}
              <strong>valid Korean visa</strong> (or other proof of legal stay,
              such as a visa-free entry stamp). Document verification is a
              condition of booking approval and is required for foreign-guest
              registration in Korea.
            </li>
            <li>
              Your personal room key is issued at check-in and should be returned at
              checkout. <strong>No cash payments are taken at check-in</strong>{" "}
              — everything has already been paid via PayPal.
            </li>
          </ul>
        </Section>

        <Section id="deposit" title="6. Security Deposit & Damages">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              The <strong>$70 deposit</strong> (≈ ₩100,000) is{" "}
              <strong>prepaid via PayPal</strong> together with your room rate
              at booking confirmation. It is held against damages, missing
              items, and any unpaid charges.
            </li>
            <li>
              It is <strong>refunded in full via PayPal</strong> to the same
              account you paid with, within{" "}
              <strong>5 business days after checkout</strong>, if the room is
              undamaged, all keys/equipment are returned, and the room is left
              in reasonable condition. Funds typically reach your account 5–10
              business days after we initiate the refund, depending on PayPal
              and your bank.
            </li>
            <li>
              Deductions, when they happen, are itemized in writing. Examples:
              broken or missing furniture, damage to walls or fixtures,
              excessive cleaning required, smoking inside the room.
            </li>
            <li>
              If repair or replacement costs exceed the deposit, the difference
              is invoiced separately. Photos of any damage are sent to you
              before deductions are finalized.
            </li>
            <li>
              If you fail to check out (abandoned room, no contact within 7
              days of the scheduled checkout), the deposit may be forfeited to
              cover cleaning, key replacement, and removal of belongings.
            </li>
          </ul>
        </Section>

        <Section id="house-rules" title="7. House Rules">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>Quiet hours:</strong> 11 PM – 6 AM. The walls are thin and
              other residents are studying or sleeping.
            </li>
            <li>
              <strong>No smoking</strong> anywhere inside the building,
              including rooms, bathrooms, hallways, kitchen, and laundry. This
              is a fire-safety rule and is strictly enforced. Korean law also
              prohibits smoking in shared residential buildings.
            </li>
            <li>
              <strong>No pets.</strong>
            </li>
            <li>
              <strong>No overnight guests</strong> without prior written
              approval. Day visitors must leave by 10 PM and are the
              responsibility of the resident hosting them.
            </li>
            <li>
              <strong>Shared kitchen and laundry:</strong> clean up after
              yourself, and don&rsquo;t leave
              laundry in the machine after the cycle ends.
            </li>
            <li>
              <strong>Trash:</strong> dispose of waste in the designated bins
              with proper separation (general / food / recycling), as required
              by Seoul municipal rules.
            </li>
            <li>
              <strong>Safety equipment:</strong> do not tamper with locks, fire
              alarms, sprinklers, or extinguishers.
            </li>
            <li>
              <strong>Maintenance:</strong> report leaks, electrical issues, or
              broken equipment promptly so we can fix them.
            </li>
            <li>
              <strong>Illegal activity</strong> of any kind, including drug use
              or possession, results in immediate termination of the stay and
              forfeiture of remaining rent and deposit, plus referral to the
              authorities where required by law.
            </li>
          </ul>
        </Section>

        <Section id="men-only" title="8. Men-Only Residence">
          <p>
            Seoul Goshiwon by Star Goshiwon is a <strong>men-only</strong>{" "}
            residence. All bookings must be for male guests; rooms cannot be
            shared, sublet, or transferred. This is consistent with how most
            Korean goshiwons operate — separate buildings or floors are
            designated by gender for shared-bath safety and privacy reasons.
          </p>
        </Section>

        <Section id="liability" title="9. Personal Property & Liability">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              Each room locks individually. We are not responsible for loss or
              theft of personal belongings inside the room or in shared areas.
              Don&rsquo;t leave valuables in the
              kitchen or laundry.
            </li>
            <li>
              We carry standard building insurance against fire and structural
              risks. This does not cover guests&rsquo; personal items — bring
              travel insurance if you want that coverage.
            </li>
            <li>
              Guests are liable for damage they (or their visitors) cause to the
              room, shared facilities, or other residents&rsquo; property.
            </li>
            <li>
              <strong>Washing machines and dryers are used at the
              tenant&rsquo;s own risk.</strong> The residence is not
              responsible for damage to clothing or fabrics caused by shared
              laundry appliances.
            </li>
          </ul>
        </Section>

        <Section id="room-access" title="10. Room Access Without Prior Consent">
          <p>
            We will not enter your room without notice except in the
            circumstances listed below. Routine maintenance and inspections are
            scheduled with reasonable advance notice when possible.
          </p>
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>
              Management may access rooms in case of <strong>emergency or
              facility maintenance</strong> that cannot wait.
            </li>
            <li>
              Rooms may be opened for <strong>inspections</strong> — sanitation,
              fire safety, electrical, or pest control.
            </li>
            <li>
              In case of <strong>fire alarms or other emergencies</strong>,
              authorized personnel (including fire and police) may enter
              without consent.
            </li>
            <li>
              If <strong>rent is unpaid for more than 3 days</strong> without
              prior agreement, the contract may be terminated and the room
              accessed.
            </li>
          </ol>
        </Section>

        <Section id="termination" title="11. Termination by Management">
          <p>
            We may immediately end a stay if a guest:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              <strong>Causes a disturbance</strong> — including but not limited
              to excessive noise, smoking indoors, foul odors, violence, theft,
              or illegal activities.
            </li>
            <li>
              Threatens, harasses, or endangers other residents or staff.
            </li>
            <li>
              Tampers with locks, fire alarms, or other safety equipment.
            </li>
            <li>
              Misrepresents identity at booking or check-in.
            </li>
            <li>
              Falls <strong>more than 3 days behind</strong> on a rent payment
              without prior agreement.
            </li>
            <li>
              Repeatedly breaks house rules after a written warning.
            </li>
          </ul>
          <p>
            <strong>In such cases, eviction will be enforced without refund</strong>{" "}
            of any prepaid rent, and the deposit may be applied against damages
            or unpaid charges. <strong>Refusal to vacate may result in legal
            action under applicable Korean law.</strong>
          </p>
        </Section>

        <Section
          id="belongings"
          title="12. Handling of Personal Belongings After Non-Payment"
        >
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>
              After contract termination, management may remove any belongings
              remaining in the room.
            </li>
            <li>
              Items may be <strong>disposed of after 3 days</strong> of
              continuing non-payment without resolution.
            </li>
            <li>
              The tenant cannot claim compensation for disposed items.
            </li>
          </ol>
          <p>
            We will make reasonable efforts to contact you using the email and
            phone number on file before disposing of belongings.
          </p>
        </Section>

        <Section id="force-majeure" title="13. Force Majeure">
          <p>
            If a stay is prevented or cut short by events outside reasonable
            control — natural disasters, government orders, public-health
            measures, civil unrest, fire, or building-wide utility outage we
            cannot resolve within 48 hours — we will refund unused nights at
            cost (waiving the standard cancellation penalties). We are not
            responsible for downstream costs such as flights, visas, or
            replacement housing.
          </p>
        </Section>

        <Section id="privacy" title="14. Privacy & Data">
          <ul className="list-disc pl-6 space-y-1.5">
            <li>
              Information you submit through the booking form (name, contact
              details, dates, and pre-arrival photos of your passport and
              Korean visa) is used only to manage your booking, comply with
              foreign-guest registration requirements, and contact you about
              your stay.
            </li>
            <li>
              We do not sell or share your data with marketers. Payment data is
              processed by PayPal under their own privacy terms; we never see
              your full card number.
            </li>
            <li>
              You can request deletion of your booking data after your stay by
              emailing{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-indigo-600 hover:underline"
              >
                {siteConfig.email}
              </a>
              , subject to records we are legally required to retain.
            </li>
          </ul>
        </Section>

        <Section id="updates" title="15. Updates to These Policies">
          <p>
            These policies may be updated from time to time. The version that
            applies to your stay is the version in effect on the date you
            submitted your booking request — changes made afterward will not
            apply retroactively to your booking.
          </p>
        </Section>
      </div>

      <div className="mt-12 bg-indigo-50 rounded-2xl border border-indigo-100 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Questions about a specific situation?
        </h3>
        <p className="text-base text-gray-600 mb-6">
          Tell us your dates and circumstances — we&rsquo;ll give you a clear
          answer before you book.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition duration-150 ease-in-out"
          >
            Email Us
          </a>
          <a
            href={siteConfig.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 scroll-mt-24"
    >
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      <div className="text-base text-gray-700 space-y-4 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
