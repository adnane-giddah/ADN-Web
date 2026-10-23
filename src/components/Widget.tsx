import type { ReactNode } from 'react';

type WidgetProps = {
  /** Small uppercase label shown in the title bar. */
  label: string;
  /** Optional short text on the right of the title bar (status, index...). */
  tag?: string;
  /** Optional footer content. */
  footer?: ReactNode;
  /** `hero` is the large centred variant, `default` a compact tile. */
  variant?: 'default' | 'hero';
  children: ReactNode;
};

export default function Widget({
  label,
  tag,
  footer,
  variant = 'default',
  children,
}: WidgetProps) {
  return (
    <section className={`widget widget--${variant}`}>
      <header className="widget__bar">
        <span className="widget__dot" aria-hidden="true" />
        <span className="widget__label">{label}</span>
        {tag && <span className="widget__tag">{tag}</span>}
      </header>
      <div className="widget__body">{children}</div>
      {footer && <footer className="widget__footer">{footer}</footer>}
    </section>
  );
}
