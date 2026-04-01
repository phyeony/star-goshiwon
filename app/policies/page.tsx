export default function PoliciesPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-5xl text-ink">Policies</h1>
      <div className="mt-10 grid gap-4">
        {[
          "Requesting a room does not guarantee confirmation.",
          "Check-in instructions are shared after host approval.",
          "Guests should review room rules, quiet hours, and ID requirements before arrival."
        ].map((item) => (
          <div key={item} className="rounded-[28px] bg-white p-6 text-sm leading-7 text-ink/75 shadow-card">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
