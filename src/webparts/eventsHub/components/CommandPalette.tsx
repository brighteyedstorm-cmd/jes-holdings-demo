import * as React from 'react';
import {
  AlertCircle, CalendarRange, CheckSquare, CornerDownLeft, LayoutDashboard, LayoutGrid, LucideIcon, Plus, Search, SlidersHorizontal
} from 'lucide-react';

import { T } from '../model/constants';
import { IEventItem } from '../model/types';
import { countdown } from '../model/helpers';
import { kbd } from './styles';
import { Dot } from './primitives';

export interface ICommandPaletteProps {
  onClose: () => void;
  events: IEventItem[];
  go: (view: string) => void;
  openEvent: (e: IEventItem) => void;
  addEvent: () => void;
  showUncat: () => void;
}

type IconType = LucideIcon;

interface IPaletteItem {
  group: string;
  icon?: IconType;
  label: string;
  run: () => void;
  kw?: string;
  event?: IEventItem;
}

export const CommandPalette = (props: ICommandPaletteProps): JSX.Element => {
  const { onClose, events, go, openEvent, addEvent, showUncat } = props;
  const [q, setQ] = React.useState('');
  const [i, setI] = React.useState(0);

  const cmds: IPaletteItem[] = [
    { group: 'Actions', icon: Plus, label: 'Add event', run: addEvent, kw: 'new adopt library' },
    { group: 'Actions', icon: AlertCircle, label: 'Review uncategorized events', run: showUncat, kw: 'attention section' },
    { group: 'Go to', icon: LayoutDashboard, label: 'Overview', run: () => go('overview') },
    { group: 'Go to', icon: LayoutGrid, label: 'Events', run: () => go('events') },
    { group: 'Go to', icon: CalendarRange, label: 'Calendar', run: () => go('calendar') },
    { group: 'Go to', icon: CheckSquare, label: 'Tasks', run: () => go('tasks') },
    { group: 'Go to', icon: SlidersHorizontal, label: 'Manage', run: () => go('manage') }
  ];

  const ql = q.toLowerCase();
  const cmdMatches = cmds.filter((c) => !q || `${c.label} ${c.kw || ''}`.toLowerCase().indexOf(ql) > -1);
  const evMatches: IPaletteItem[] = (q ? events.filter((e) => e.name.toLowerCase().indexOf(ql) > -1) : events.slice(0, 6))
    .slice(0, 8)
    .map((e) => ({ group: 'Events', event: e, label: e.name, run: () => openEvent(e) }));
  const items = [...cmdMatches, ...evMatches];

  React.useEffect(() => { setI(0); }, [q]);

  const groups: { header: string; items: (IPaletteItem & { idx: number })[] }[] = [];
  let last: string | undefined;
  items.forEach((it, idx) => {
    if (it.group !== last) { groups.push({ header: it.group, items: [] }); last = it.group; }
    groups[groups.length - 1].items.push({ ...it, idx });
  });

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => (v + 1) % Math.max(1, items.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => (v - 1 + items.length) % Math.max(1, items.length)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[i]) items[i].run(); onClose(); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 110, display: 'grid', placeItems: 'start center', paddingTop: '9vh' }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(26,33,31,.34)', backdropFilter: 'blur(2px)' }} />
      <div className="jes-cmdk" style={{ position: 'relative', width: 'min(600px,92%)', background: T.surface, borderRadius: 16, boxShadow: '0 30px 70px rgba(26,33,31,.34)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 18px', borderBottom: `1px solid ${T.lineSoft}` }}>
          <Search size={18} style={{ color: T.faint }} />
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search events or run a command…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15.5, color: T.ink, background: 'transparent', fontFamily: 'inherit' }}
          />
          <span style={kbd}>Esc</span>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 8px 10px' }}>
          {!items.length && <div style={{ padding: '30px 16px', textAlign: 'center', color: T.faint, fontSize: 13.5 }}>Nothing matches “{q}”.</div>}
          {groups.map((g) => (
            <div key={g.header} style={{ marginBottom: 4 }}>
              <div style={{ padding: '8px 12px 4px', fontSize: 10.5, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.5 }}>{g.header}</div>
              {g.items.map((it) => {
                const active = it.idx === i;
                const Icon = it.icon;
                return (
                  <button
                    key={it.idx} onMouseEnter={() => setI(it.idx)} onClick={() => { it.run(); onClose(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderRadius: 9, cursor: 'pointer', background: active ? T.canvas : 'transparent' }}
                  >
                    {it.event ? <Dot e={it.event.entity} size={9} /> : (Icon ? <Icon size={16} style={{ color: T.muted }} /> : undefined)}
                    <span style={{ flex: 1, fontSize: 13.5, color: T.ink, fontWeight: it.event ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                    {it.event && <span style={{ fontSize: 11.5, color: T.faint }}>{countdown(it.event.date)}</span>}
                    {active && <CornerDownLeft size={14} style={{ color: T.ghost }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
