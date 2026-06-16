/**
 * Renders json-render UI specs (https://json-render.dev) for React 18.
 * Supports: Stack, Grid, Text, Heading, Card, Badge, Metric, Table, Accordion
 */

import { useState } from 'react';

export interface UiElement {
  type: string;
  props?: Record<string, unknown>;
  children?: string[];
}

export interface UiSpec {
  root: string;
  elements: Record<string, UiElement>;
}

function BadgeEl({ label, variant = 'default' }: { label: string; variant?: string }) {
  const colors: Record<string, string> = {
    default: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    success: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    destructive: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    outline: 'border border-border-light dark:border-border-dark text-text-light-secondary dark:text-text-dark-secondary',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[variant] ?? colors.default}`}>
      {label}
    </span>
  );
}

function MetricEl({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark">
      <span className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary uppercase tracking-wide">{label}</span>
      <span className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">{String(value)}</span>
      {delta && <span className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary">{delta}</span>}
    </div>
  );
}

function TableEl({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-light dark:border-border-dark">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark">
            {columns.map((col, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-text-light-secondary dark:text-text-dark-secondary whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border-light dark:border-border-dark last:border-0 hover:bg-card-light/50 dark:hover:bg-card-dark/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-text-light-primary dark:text-text-dark-primary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccordionEl({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-text-light-primary dark:text-text-dark-primary bg-card-light dark:bg-card-dark hover:bg-card-light/70 dark:hover:bg-card-dark/70 transition-colors"
      >
        {title}
        <span className={`transition-transform text-text-light-secondary dark:text-text-dark-secondary text-xs ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="px-3 py-2 space-y-2">{children}</div>}
    </div>
  );
}

function RenderElement({ id, elements }: { id: string; elements: Record<string, UiElement> }) {
  const el = elements[id];
  if (!el) return null;

  const props = el.props ?? {};
  const childNodes = (el.children ?? []).map((cid) => (
    <RenderElement key={cid} id={cid} elements={elements} />
  ));

  switch (el.type) {
    case 'Stack':
      return <div className={`flex flex-col gap-${(props.gap as number) ?? 3}`}>{childNodes}</div>;

    case 'Grid': {
      const cols = (props.columns as number) ?? 2;
      const gridClass = cols === 4 ? 'grid-cols-4' : cols === 3 ? 'grid-cols-3' : 'grid-cols-2';
      return <div className={`grid ${gridClass} gap-2`}>{childNodes}</div>;
    }

    case 'Text':
      return (
        <p className={`text-xs leading-relaxed ${
          props.variant === 'muted'
            ? 'text-text-light-secondary dark:text-text-dark-secondary'
            : 'text-text-light-primary dark:text-text-dark-primary'
        }`}>
          {String(props.content ?? '')}
        </p>
      );

    case 'Heading':
      return (
        <p className={`font-semibold text-text-light-primary dark:text-text-dark-primary ${
          (props.level as number) <= 2 ? 'text-sm' : 'text-xs'
        }`}>
          {String(props.content ?? '')}
        </p>
      );

    case 'Card': {
      const cardTitle = props.title != null ? String(props.title) : '';
      const cardDesc = props.description != null ? String(props.description) : '';
      return (
        <div className="rounded-xl border border-border-light dark:border-border-dark p-3 bg-card-light dark:bg-card-dark space-y-1">
          {cardTitle && (
            <p className="text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">
              {cardTitle}
            </p>
          )}
          {cardDesc && (
            <p className="text-[11px] text-text-light-secondary dark:text-text-dark-secondary">
              {cardDesc}
            </p>
          )}
          {childNodes.length > 0 && <div className="pt-1 space-y-1">{childNodes}</div>}
        </div>
      );
    }

    case 'Badge':
      return <BadgeEl label={String(props.label ?? '')} variant={String(props.variant ?? 'default')} />;

    case 'Metric':
      return (
        <MetricEl
          label={String(props.label ?? '')}
          value={props.value as string | number}
          delta={props.delta ? String(props.delta) : undefined}
        />
      );

    case 'Table':
      return (
        <TableEl
          columns={(props.columns as string[]) ?? []}
          rows={(props.rows as string[][]) ?? []}
        />
      );

    case 'Accordion':
      return <AccordionEl title={String(props.title ?? '')}>{childNodes}</AccordionEl>;

    default:
      return <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">[unknown: {el.type}]</p>;
  }
}

export default function ChatRenderer({ spec }: { spec: UiSpec }) {
  return (
    <div className="text-sm">
      <RenderElement id={spec.root} elements={spec.elements} />
    </div>
  );
}
