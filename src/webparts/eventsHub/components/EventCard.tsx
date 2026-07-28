import * as React from 'react';
import { ChevronRight, MapPin } from 'lucide-react';

import { ALERT, T, entMeta } from '../model/constants';
import { IEventItem } from '../model/types';
import { assignees, countdown, eventOverdue, fmtShort, readiness } from '../model/helpers';
import { serif } from './styles';
import { AvatarStack, Badge, Dot, Ring, ringCenter, ringTitle } from './primitives';

export const Card = ({ ev, onOpen }: { ev: IEventItem; onOpen: (e: IEventItem) => void }): JSX.Element => {
  const c = entMeta(ev.entity).color;
  const r = readiness(ev.tasks);
  const over = eventOverdue(ev);
  return (
    <button
      className="jes-card" onClick={() => onOpen(ev)}
      style={{ textAlign: 'left', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 15, padding: 0, cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: c }} />
      <div style={{ padding: '16px 17px 15px 20px', display: 'flex', flexDirection: 'column', gap: 13, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, color: T.faint, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
              <Dot e={ev.entity} size={7} />{entMeta(ev.entity).short}{ev.cat ? ` · ${ev.cat}` : ''}
            </div>
            <div style={{ ...serif(16.5), lineHeight: 1.18 }}>{ev.name}</div>
          </div>
          <Ring value={r} size={44} center={ringCenter(ev)} title={ringTitle(ev)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5 }}>
          <span style={{ fontWeight: 600, color: over ? ALERT : T.ink }}>{over ? `${over} overdue` : countdown(ev.date)}</span>
          <span style={{ color: T.ghost }}>·</span>
          <span style={{ color: T.muted }}>{fmtShort(ev.date) || 'unscheduled'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          <AvatarStack people={assignees(ev)} size={22} max={4} />
          <Badge s={ev.status} />
        </div>
      </div>
    </button>
  );
};

export const EventRow = ({ ev, onOpen }: { ev: IEventItem; onOpen: (e: IEventItem) => void }): JSX.Element => {
  const r = readiness(ev.tasks);
  const over = eventOverdue(ev);
  return (
    <button
      className="jes-row" onClick={() => onOpen(ev)}
      style={{ display: 'flex', alignItems: 'center', gap: 15, width: '100%', textAlign: 'left', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 13, padding: '12px 16px', cursor: 'pointer', marginBottom: 8 }}
    >
      <Ring value={r} size={40} center={ringCenter(ev)} title={ringTitle(ev)} />
      <div style={{ minWidth: 0, flex: 1.4 }}>
        <div style={{ ...serif(15.5), lineHeight: 1.15 }}>{ev.name}</div>
        <div style={{ fontSize: 11.5, color: T.faint, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dot e={ev.entity} size={7} />{entMeta(ev.entity).short}{ev.cat ? ` · ${ev.cat}` : ''}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: over ? ALERT : T.ink }}>{over ? `${over} overdue` : countdown(ev.date)}</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} />{ev.venue || 'TBD'}</div>
      </div>
      <AvatarStack people={assignees(ev)} size={22} max={3} />
      <Badge s={ev.status} />
      <ChevronRight size={17} style={{ color: T.ghost, flexShrink: 0 }} />
    </button>
  );
};
