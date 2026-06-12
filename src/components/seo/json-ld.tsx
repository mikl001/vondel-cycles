/** Renders a JSON-LD structured data block. Content is JSON.stringify'd,
 *  never raw user input, so the dangerouslySetInnerHTML stays safe. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
