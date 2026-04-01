type Props = {
  eyebrow: string;
  title: string;
  body: string;
};

export function SectionTitle({ eyebrow, title, body }: Props) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coral">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-ink md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-ink/70">{body}</p>
    </div>
  );
}
