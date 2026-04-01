import { RequestForm } from "@/components/request-form";
import { SectionTitle } from "@/components/section-title";

export default function RequestToBookPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <SectionTitle
        eyebrow="Request to Book"
        title="An Airbnb-style inquiry flow, adapted for goshiwon stays"
        body="Guests send a stay request first. The host reviews dates and room fit, then follows up through email, WhatsApp, or KakaoTalk before confirming anything."
      />
      <div className="mt-10">
        <RequestForm />
      </div>
    </section>
  );
}
