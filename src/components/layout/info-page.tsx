import type { Locale } from "@/i18n/routing";
import type { InfoPage } from "@/lib/content/info-pages";

export function InfoPageContent({ page, locale }: { page: InfoPage; locale: Locale }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-vondel-900">
        {page.title[locale]}
      </h1>
      <p className="mt-3 text-lg text-vondel-600">{page.intro[locale]}</p>

      <div className="mt-8 flex flex-col gap-8">
        {page.sections.map((section, i) => (
          <section key={i}>
            {section.heading && (
              <h2 className="mb-3 text-xl font-semibold text-vondel-900">
                {section.heading[locale]}
              </h2>
            )}
            {section.paragraphs?.map((paragraph, j) => (
              <p key={j} className="mb-3 leading-relaxed text-vondel-700">
                {paragraph[locale]}
              </p>
            ))}
            {section.bullets && (
              <ul className="flex flex-col gap-2">
                {section.bullets.map((bullet, j) => (
                  <li key={j} className="flex gap-2 text-vondel-700">
                    <span aria-hidden className="text-vondel-500">✓</span>
                    {bullet[locale]}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
