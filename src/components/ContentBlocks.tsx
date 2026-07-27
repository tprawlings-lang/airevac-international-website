import type { Block } from '@/content/blocks';

/**
 * Renders the block content model. Section 5 (Page templates and reusable
 * modules).
 *
 * All text arrives as plain strings and is rendered as React children, so it is
 * escaped by React — there is no `dangerouslySetInnerHTML` path for authored
 * content anywhere in this component. That is deliberate: the CMS this model
 * describes will eventually be edited by non-developers, and an HTML-accepting
 * field is a stored-XSS vector regardless of who is trusted to use it.
 */
export function ContentBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="prose-content">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'prose':
      return (
        <section>
          {block.heading !== undefined && <h2>{block.heading}</h2>}
          {block.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>
      );

    case 'list':
      return (
        <section>
          <h2>{block.heading}</h2>
          {block.ordered === true ? (
            <ol>
              {block.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          ) : (
            <ul>
              {block.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      );

    case 'callout': {
      const isWarning = block.tone === 'warning';
      return (
        <aside
          className={`not-prose my-6 rounded-panel border-l-4 p-5 ${
            isWarning
              ? 'border-urgent-600 bg-urgent-50'
              : 'border-support-500 bg-support-50'
          }`}
        >
          <h2 className="text-lg font-bold text-navy-900">{block.heading}</h2>
          <p className="mt-2 text-ink-900">{block.body}</p>
        </aside>
      );
    }

    case 'faq':
      /*
       * Native <details>/<summary>: keyboard-operable and screen-reader-announced
       * without JavaScript, which the degradation rule on page 20 requires.
       *
       * NOTE: no FAQPage structured data is emitted. Section 19 permits FAQ
       * markup "only when eligible", and Google restricts FAQ rich results to a
       * narrow set of sites. Emitting it speculatively risks a structured-data
       * mismatch penalty for no gain.
       */
      return (
        <section>
          <h2>{block.heading}</h2>
          <div className="not-prose mt-4 space-y-3">
            {block.items.map((item, index) => (
              <details
                key={index}
                className="rounded-panel border border-ink-300 bg-white"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-navy-900">
                  {item.question}
                </summary>
                <p className="border-t border-ink-300 px-5 py-4 text-ink-700">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      );

    case 'definitions':
      return (
        <section>
          <h2>{block.heading}</h2>
          <dl className="not-prose mt-4 space-y-4">
            {block.items.map((item, index) => (
              <div
                key={index}
                className="border-l-2 border-support-500 pl-4"
              >
                <dt className="font-bold text-navy-900">{item.term}</dt>
                <dd className="mt-1 text-ink-700">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
  }
}
