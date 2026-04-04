export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-base text-gray-500">{subtitle}</p>}
    </div>
  );
}
