import * as React from 'react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';

import { MONTHS, T, entMeta } from '../model/constants';
import { IEventItem, IFilters } from '../model/types';
import { todayIso } from '../model/helpers';
import { btnGhost, btnIcon, panel, panelHead, serif } from './styles';
import { Empty } from './primitives';

export interface ICalendarViewProps {
  events: IEventItem[];
  onOpen: (e: IEventItem) => void;
  filters: IFilters;
}

export const CalendarView = (props: ICalendarViewProps): JSX.Element => {
  const { events, onOpen, filters } = props;
  const now = new Date();
  const [cur, setCur] = React.useState({ y: now.getFullYear(), m: now.getMonth() });

  const inScope = (e: IEventItem): boolean =>
    !!e.date
    && (filters.section === 'All' || e.entity === filters.section)
    && (filters.status === 'All' || e.status === filters.status);

  const byDay: { [day: number]: IEventItem[] } = {};
  const monthList: IEventItem[] = [];
  events.forEach((e) => {
    if (!inScope(e)) return;
    const d = new Date(`${e.date}T00:00:00`);
    if (d.getFullYear() === cur.y && d.getMonth() === cur.m) {
      if (!byDay[d.getDate()]) byDay[d.getDate()] = [];
      byDay[d.getDate()].push(e);
      monthList.push(e);
    }
  });
  monthList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const startDay = new Date(cur.y, cur.m, 1).getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: (number | undefined)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(undefined);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7) cells.push(undefined);

  const shift = (n: number): void => setCur(({ y, m }) => {
    const d = new Date(y, m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const today = todayIso();
  const todayParts = { y: Number(today.substring(0, 4)), m: Number(today.substring(5, 7)) - 1, d: Number(today.substring(8, 10)) };
  const isToday = (d: number): boolean => cur.y === todayParts.y && cur.m === todayParts.m && d === todayParts.d;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 18, alignItems: 'start' }} className="jes-cal-grid">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <button className="jes-icon" onClick={() => shift(-1)} aria-label="Previous month" style={btnIcon}><ChevronLeft size={18} /></button>
          <h3 style={{ ...serif(19), margin: 0, width: 172, maxWidth: '100%', textAlign: 'center' }}>{MONTHS[cur.m]} {cur.y}</h3>
          <button className="jes-icon" onClick={() => shift(1)} aria-label="Next month" style={btnIcon}><ChevronRight size={18} /></button>
          <button className="jes-ghost" style={{ ...btnGhost, marginLeft: 8, padding: '7px 13px' }} onClick={() => setCur({ y: todayParts.y, m: todayParts.m })}>Today</button>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="jes-dow" style={{ padding: '10px', fontSize: 10.5, fontWeight: 700, color: T.faint, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: `1px solid ${T.lineSoft}`, background: T.canvas }}>{d}</div>
            ))}
            {cells.map((d, i) => (
              <div
                key={i} className="jes-day"
                style={{ minHeight: 96, borderBottom: `1px solid ${T.lineSoft}`, borderRight: (i % 7 !== 6) ? `1px solid ${T.lineSoft}` : 'none', padding: 6, background: d ? T.surface : T.raise, display: 'flex', flexDirection: 'column', gap: 3 }}
              >
                {d && (
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: isToday(d) ? '#fff' : T.muted, alignSelf: 'flex-start', width: 21, height: 21, borderRadius: 99, display: 'grid', placeItems: 'center', background: isToday(d) ? T.brand : 'transparent' }}>{d}</div>
                )}
                {(d ? (byDay[d] || []) : []).slice(0, 3).map((e) => (
                  <button
                    key={e.id} onClick={() => onOpen(e)} className="jes-calev" title={`${e.name}${e.time ? ` · ${e.time}` : ''}`}
                    style={{ textAlign: 'left', border: 'none', cursor: 'pointer', background: `${entMeta(e.entity).color}18`, color: entMeta(e.entity).color, borderLeft: `3px solid ${entMeta(e.entity).color}`, borderRadius: 5, padding: '2px 6px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >{e.name}</button>
                ))}
                {d && (byDay[d] || []).length > 3 && <span style={{ fontSize: 10.5, color: T.faint, paddingLeft: 4 }}>+{byDay[d].length - 3} more</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={panel}>
        <div style={panelHead}>
          <span style={{ ...serif(16) }}>{MONTHS[cur.m]} agenda</span>
          <span style={{ fontSize: 12, color: T.faint }}>{monthList.length}</span>
        </div>
        <div style={{ padding: '6px 10px 12px', maxHeight: 460, overflowY: 'auto' }}>
          {!monthList.length && <Empty icon={CalendarRange} title="No events this month" small />}
          {monthList.map((e) => (
            <button
              key={e.id} className="jes-uprow" onClick={() => onOpen(e)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '9px 10px', borderRadius: 10, cursor: 'pointer' }}
            >
              <div style={{ textAlign: 'center', width: 34, flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{new Date(`${e.date}T00:00:00`).getDate()}</div>
                <div style={{ fontSize: 10, color: T.faint, textTransform: 'uppercase', marginTop: 2 }}>{new Date(`${e.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}</div>
              </div>
              <div style={{ minWidth: 0, flex: 1, borderLeft: `2px solid ${entMeta(e.entity).color}`, paddingLeft: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{[e.time, e.venue].filter(Boolean).join(' · ')}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
