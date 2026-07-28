import * as React from 'react';
import { ArrowUpRight, Check, LucideIcon, Plus } from 'lucide-react';

import { ALERT, STATUS, T, entMeta } from '../model/constants';
import { IEventItem, IPerson } from '../model/types';
import { initials, readiness } from '../model/helpers';
import { lblStyle, serif } from './styles';

export const Dot = ({ e, size = 8 }: { e: string; size?: number }): JSX.Element => (
  <span style={{ width: size, height: size, borderRadius: 99, background: entMeta(e).color, display: 'inline-block', flexShrink: 0 }} />
);

export const Badge = ({ s }: { s: string }): JSX.Element => {
  const x = STATUS[s] || { color: T.faint, bg: T.hair };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: x.color, background: x.bg, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: 0.1 }}>{s}</span>
  );
};

export const Avatar = ({ name, size = 22 }: { name: string; size?: number }): JSX.Element => (
  name
    ? (
      <span title={name} style={{ width: size, height: size, borderRadius: 99, background: T.hair, color: T.muted, display: 'grid', placeItems: 'center', fontSize: size * 0.4, fontWeight: 700, flexShrink: 0, border: `1px solid ${T.line}` }}>{initials(name)}</span>
    )
    : (
      <span title="Unassigned" style={{ width: size, height: size, borderRadius: 99, border: `1px dashed ${T.line}`, color: T.ghost, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Plus size={size * 0.5} /></span>
    )
);

export const AvatarStack = ({ people, size = 22, max = 4 }: { people: IPerson[]; size?: number; max?: number }): JSX.Element => {
  if (!people.length) return <span style={{ fontSize: 11.5, color: T.ghost }}>No one assigned</span>;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <span key={p.loginName || p.title || i} style={{ marginLeft: i ? -8 : 0, borderRadius: 99, boxShadow: `0 0 0 2px ${T.surface}`, zIndex: max - i }}>
          <Avatar name={p.title} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span style={{ marginLeft: -8, width: size, height: size, borderRadius: 99, background: T.surface, color: T.muted, border: `1px solid ${T.line}`, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700, boxShadow: `0 0 0 2px ${T.surface}` }}>+{extra}</span>
      )}
    </div>
  );
};

export interface IRingProps {
  value: number | undefined;
  size?: number;
  stroke?: number;
  center: React.ReactNode;
  title?: string;
}

/** The readiness ring. Checklist completion, with the countdown, a check, or a dash inside. */
export const Ring = ({ value, size = 46, stroke = 3.5, center, title }: IRingProps): JSX.Element => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = value === undefined ? 0 : Math.max(0, Math.min(100, value));
  const off = circ * (1 - v / 100);
  return (
    <div title={title} style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.lineSoft} strokeWidth={stroke} />
        {value !== undefined && (
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.brand} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={off}
            style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.22,1,.36,1)' }}
          />
        )}
      </svg>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, display: 'grid', placeItems: 'center', fontSize: size * 0.26, fontWeight: 700, color: value === undefined ? T.ghost : T.ink, fontVariantNumeric: 'tabular-nums' }}>{center}</div>
    </div>
  );
};

export const ringCenter = (e: IEventItem): React.ReactNode => {
  if (e.status === 'Complete') return <Check size={16} strokeWidth={2.6} style={{ color: T.brand }} />;
  const r = readiness(e.tasks);
  return r === undefined ? '–' : r;
};

export const ringTitle = (e: IEventItem): string => {
  const r = readiness(e.tasks);
  return r === undefined ? 'No checklist' : `Checklist ${r}% complete`;
};

export const Field = ({ label, children }: { label: string; children?: React.ReactNode }): JSX.Element => (
  <label style={{ display: 'block' }}><div style={lblStyle}>{label}</div>{children}</label>
);

export const SectionHead = ({ children }: { children?: React.ReactNode }): JSX.Element => (
  <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>{children}</div>
);

export interface IEmptyProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  small?: boolean;
}

export const Empty = ({ icon: Icon, title, body, small }: IEmptyProps): JSX.Element => (
  <div style={{ textAlign: 'center', padding: small ? '22px 16px' : '34px 20px', color: T.faint }}>
    <Icon size={small ? 20 : 26} style={{ color: T.ghost, margin: '0 auto 9px' }} />
    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.muted }}>{title}</div>
    {body && <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 260, margin: '4px auto 0', lineHeight: 1.5 }}>{body}</div>}
  </div>
);

export const Seg = ({ options, value, onChange }: { options: string[][]; value: string; onChange: (v: string) => void }): JSX.Element => (
  <div style={{ display: 'inline-flex', background: T.hair, borderRadius: 9, padding: 3, gap: 2 }}>
    {options.map(([v, l]) => (
      <button
        key={v} onClick={() => onChange(v)}
        style={{ border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, background: value === v ? T.surface : 'transparent', color: value === v ? T.ink : T.muted, boxShadow: value === v ? '0 1px 3px rgba(26,33,31,.1)' : 'none' }}
      >{l}</button>
    ))}
  </div>
);

export interface IStatTileProps {
  icon: LucideIcon;
  value: number;
  label: string;
  tone?: string;
  onClick: () => void;
}

export const StatTile = ({ icon: Icon, value, label, tone, onClick }: IStatTileProps): JSX.Element => (
  <button
    className="jes-tile" onClick={onClick}
    style={{ textAlign: 'left', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 15, padding: '16px 18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, flex: '1 1 150px', minWidth: 0 }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Icon size={17} style={{ color: tone || T.faint }} />
      <ArrowUpRight size={15} className="jes-tile-arrow" style={{ color: T.ghost, opacity: 0, transition: 'opacity .15s' }} />
    </div>
    <div>
      <div style={{ ...serif(30), lineHeight: 1, color: tone && value ? tone : T.ink }}>{value}</div>
      <div style={{ fontSize: 12, color: T.muted, marginTop: 5 }}>{label}</div>
    </div>
  </button>
);

export const OVERDUE = ALERT;
