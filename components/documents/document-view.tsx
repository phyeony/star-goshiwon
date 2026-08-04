import type { ResolvedDocument } from "@/lib/documents/resolve";
import type { DocumentModel } from "@/lib/documents/types";

/**
 * Renders a resolved document — either the built-in structured model or an
 * admin-uploaded HTML template. Used by the admin preview and the print page,
 * so it stays free of hooks, data fetching, and anything browser-only.
 */
export function DocumentView({ resolved }: { resolved: ResolvedDocument }) {
  return (
    <article className="bg-white text-gray-900 mx-auto w-full max-w-[210mm] px-10 py-12 print:px-0 print:py-0">
      {resolved.kind === "model" ? (
        <ModelBody model={resolved.model} />
      ) : (
        <>
          <header className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-wide">
              {resolved.title}
            </h1>
          </header>
          <div
            className="document-template-body text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: resolved.html }}
          />
        </>
      )}
    </article>
  );
}

function ModelBody({ model }: { model: DocumentModel }) {
  return (
    <>
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-wide">{model.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{model.subtitle}</p>
      </header>

      {model.sections.map((section) => (
        <section key={section.heading} className="mb-6 break-inside-avoid">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
            {section.heading}
          </h2>
          {section.fields.length > 0 && (
            <dl className="grid grid-cols-[10rem_1fr] gap-y-1 text-sm">
              {section.fields.map((field) => (
                <div key={field.label} className="contents">
                  <dt className="text-gray-500">{field.label}</dt>
                  <dd className="text-gray-900">{field.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed mt-1">
              {section.fields.length > 0 ? paragraph : `${i + 1}. ${paragraph}`}
            </p>
          ))}
        </section>
      ))}

      {model.statement.map((paragraph, i) => (
        <p key={i} className="text-sm leading-7 mt-4">
          {paragraph}
        </p>
      ))}

      <p className="text-center text-sm mt-10">{model.issueDateLine}</p>

      <div className="mt-6 space-y-4">
        {model.signatures.map((signature) => (
          <div
            key={signature.role}
            className="flex items-center justify-end gap-3 text-sm"
          >
            <span className="text-gray-500">{signature.role}</span>
            <span className="font-medium">{signature.name}</span>
            <span className="text-gray-400">
              {model.lang === "ko" ? "(서명 또는 인)" : "(signature)"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
