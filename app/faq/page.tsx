import { faqs } from "@/lib/site-data";

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl text-ink">FAQ</h1>
      <div className="mt-10 grid gap-4">
        {faqs.map((item) => (
          <article key={item.question} className="rounded-[28px] bg-white p-6 shadow-card">
            <h2 className="font-display text-2xl text-ink">{item.question}</h2>
            <p className="mt-3 text-sm leading-7 text-ink/70">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
