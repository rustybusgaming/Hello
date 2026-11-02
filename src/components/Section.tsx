import React from 'react';

interface SectionProps {
  title: string;
  /** One grey sentence about the content, never about the interface */
  note?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  id?: string;
}

/** A titled block on a screen: a 16px heading, an optional note, a "View all" on the right. */
export function Section({ title, note, action, children, id }: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section aria-labelledby={headingId} className="pt-10">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[16px] font-semibold">{title}</h2>
          {note && <p className="mt-1 text-[13px] text-faint">{note}</p>}
        </div>
        {action && (
          <a href={action.href} className="flex-none text-[13px] font-semibold text-muted hover:text-ink">
            {action.label}
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

/** An empty block keeps its frame and says, in one sentence, what will appear here. */
export function EmptyBlock({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 bg-paper px-5 py-5 text-[14px] text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>{children}</p>
      {action}
    </div>
  );
}

/**
 * The grid every row of cards uses, so cards land on the same columns across the screen:
 * 2 / 3 / 4 / 5 / 6 columns as the canvas widens, one 14px gap.
 * At 1440 with the sidebar: 6 x 181.8 + 5 x 14 = 1161 = the content width.
 */
export const CARD_GRID =
  'grid grid-cols-2 gap-x-[14px] gap-y-6 sm:grid-cols-3 md:grid-cols-4 wide:grid-cols-5 huge:grid-cols-6';

/**
 * A rail is one row of that grid: it shows as many cards as the row has columns (four, as two
 * rows of two, on a phone), so a rail never ends on a half-empty row.
 */
export function railItemClass(index: number): string {
  if (index < 3) return '';
  if (index === 3) return 'sm:hidden md:block';
  if (index === 4) return 'hidden wide:block';
  if (index === 5) return 'hidden huge:block';
  return 'hidden';
}
