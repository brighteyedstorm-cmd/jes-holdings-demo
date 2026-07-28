import * as React from 'react';
import {
  AlertCircle, ArrowRight, CalendarRange, CheckSquare, CircleCheck, LayoutGrid, MapPin
} from 'lucide-react';

import { ALERT, ENTITY_NAMES, T, entMeta } from '../model/constants';
import { IEventItem, IPerson, ITask } from '../model/types';
import { countdown, daysUntil, fmtShort, greeting, isOverdue, readiness, samePerson } from '../model/helpers';
import { btnPrimary, chip, linkBtn, panel, panelHead, serif } from './styles';
import { Dot, Empty, Ring, StatTile, ringCenter, ringTitle } from './primitives';

export interface IOverviewProps {
  events: IEventItem[];
  me: IPerson;
  onOpen: (e: IEventItem) => void;
  go: (view: string) => void;
  showUncat: () => void;
  toggleTask: (eventId: number, taskId: number) => void;
}

export const Overview = (props: IOverviewProps): JSX.Element => {
  const { events, me, onOpen, go, showUncat, toggleTask } = props;

  const categorized = events.filter((e) => e.entity);
  const upcoming = categorized
    .filter((e) => { const d = daysUntil(e.date); return d !== undefined && d >= 0 && e.status !== 'Complete'; })
    .sort((a, b) => (daysUntil(a.date) as number) - (daysUntil(b.date) as number));
  const uncats = events.filter((e) => !e.entity);

  const myTasks: { e: IEventItem; t: ITask }[] = [];
  events.forEach((e) => e.tasks.forEach((t) => { if (samePerson(t.who, me) && !t.done) myTasks.push({ e, t }); }));
  myTasks.sort((a, b) => (a.t.due ? new Date(a.t.due).getTime() : Infinity) - (b.t.due ? new Date(b.t.due).getTime() : Infinity));

  const overdueAll: { e: IEventItem; t: ITask }[] = [];
  events.forEach((e) => e.tasks.forEach((t) => { if (isOverdue(t)) overdueAll.push({ e, t }); }));

  const perSection = ENTITY_NAMES
    .map((n) => ({ n, c: entMeta(n).color, count: categorized.filter((e) => e.entity === n).length }))
    .filter((x) => x.count);
  const totalSec = perSection.reduce((a, b) => a + b.count, 0) || 1;
  const now = new Date();

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 5, fontWeight: 600 }}>{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 style={{ ...serif(28), margin: 0 }}>{greeting()}, {me.title.split(' ')[0]}</h1>
        </div>
        <button className="jes-primary" onClick={() => go('events')} style={{ ...btnPrimary }}><LayoutGrid size={15} /> Browse events</button>
      </div>

      <div style={{ display: 'flex', gap: 13, marginBottom: 22, flexWrap: 'wrap' }}>
        <StatTile icon={LayoutGrid} value={categorized.length} label="Events tracked" onClick={() => go('events')} />
        <StatTile icon={CalendarRange} value={upcoming.length} label="Upcoming" onClick={() => go('calendar')} />
        <StatTile icon={CheckSquare} value={myTasks.length} label="Your open tasks" onClick={() => go('tasks')} />
        <StatTile
          icon={AlertCircle} value={uncats.length + overdueAll.length} label="Need attention"
          tone={(uncats.length + overdueAll.length) ? ALERT : undefined}
          onClick={() => (uncats.length ? showUncat() : go('tasks'))}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }} className="jes-ov-grid">
        {/* Up next */}
        <div style={panel}>
          <div style={panelHead}>
            <span style={{ ...serif(17) }}>Up next</span>
            <button className="jes-link" onClick={() => go('calendar')} style={linkBtn}>Calendar <ArrowRight size={13} /></button>
          </div>
          <div style={{ padding: '6px 8px 10px' }}>
            {!upcoming.length && <Empty icon={CalendarRange} title="Nothing scheduled" body="Set a date on an event and it will appear here." />}
            {upcoming.slice(0, 6).map((e) => (
              <button
                key={e.id} className="jes-uprow" onClick={() => onOpen(e)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '10px 11px', borderRadius: 11, cursor: 'pointer' }}
              >
                <Ring value={readiness(e.tasks)} size={42} center={ringCenter(e)} title={ringTitle(e)} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ ...serif(15), lineHeight: 1.15 }}>{e.name}</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Dot e={e.entity} size={7} />{entMeta(e.entity).short}<span style={{ color: T.ghost }}>·</span><MapPin size={11} />{e.venue || 'TBD'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{countdown(e.date)}</div>
                  <div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}>{fmtShort(e.date)}{e.time ? ` · ${e.time}` : ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={panel}>
            <div style={panelHead}><span style={{ ...serif(16) }}>Needs attention</span></div>
            <div style={{ padding: '6px 14px 14px' }}>
              {!uncats.length && !overdueAll.length && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 2px', color: T.muted, fontSize: 13 }}>
                  <CircleCheck size={17} style={{ color: T.brand }} /> All clear. Nothing needs attention.
                </div>
              )}
              {uncats.length > 0 && (
                <div style={{ marginBottom: overdueAll.length ? 14 : 0 }}>
                  <div style={{ fontSize: 11.5, color: T.faint, fontWeight: 600, marginBottom: 7 }}>{uncats.length} uncategorized {uncats.length === 1 ? 'event' : 'events'}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {uncats.slice(0, 5).map((e) => <button key={e.id} className="jes-chip" onClick={() => onOpen(e)} style={chip}>{e.name}</button>)}
                  </div>
                  <button className="jes-link" onClick={showUncat} style={{ ...linkBtn, marginTop: 9 }}>Categorize in Manage <ArrowRight size={13} /></button>
                </div>
              )}
              {overdueAll.length > 0 && (
                <div>
                  <div style={{ fontSize: 11.5, color: ALERT, fontWeight: 600, marginBottom: 7 }}>{overdueAll.length} overdue {overdueAll.length === 1 ? 'task' : 'tasks'}</div>
                  {overdueAll.slice(0, 3).map(({ e, t }) => (
                    <button
                      key={t.id} className="jes-uprow" onClick={() => onOpen(e)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '6px 4px', borderRadius: 8, cursor: 'pointer' }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: ALERT, flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.text}</span>
                      <span style={{ fontSize: 11, color: T.faint }}>{e.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={panel}>
            <div style={panelHead}>
              <span style={{ ...serif(16) }}>Your open tasks</span>
              <button className="jes-link" onClick={() => go('tasks')} style={linkBtn}>All <ArrowRight size={13} /></button>
            </div>
            <div style={{ padding: '4px 8px 10px' }}>
              {!myTasks.length && <Empty icon={CheckSquare} title="You're all caught up" body="Tasks assigned to you show up here." small />}
              {myTasks.slice(0, 4).map(({ e, t }) => (
                <div key={t.id} className="jes-task" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px', borderRadius: 9 }}>
                  <button onClick={() => toggleTask(e.id, t.id)} aria-label="Complete" style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 6, cursor: 'pointer', border: `1.5px solid ${T.line}`, background: T.surface }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.text}</div>
                    <button className="jes-link" onClick={() => onOpen(e)} style={{ ...linkBtn, fontSize: 11, marginTop: 2 }}>{e.name}</button>
                  </div>
                  {t.due && <span style={{ fontSize: 11.5, color: isOverdue(t) ? ALERT : T.faint, fontWeight: isOverdue(t) ? 600 : 500, flexShrink: 0 }}>{fmtShort(t.due)}</span>}
                </div>
              ))}
            </div>
          </div>

          {perSection.length > 0 && (
            <div style={panel}>
              <div style={panelHead}><span style={{ ...serif(16) }}>By section</span></div>
              <div style={{ padding: '6px 16px 16px' }}>
                <div style={{ display: 'flex', height: 9, borderRadius: 99, overflow: 'hidden', marginBottom: 13 }}>
                  {perSection.map((s) => <div key={s.n} title={`${s.n}: ${s.count}`} style={{ width: `${s.count / totalSec * 100}%`, background: s.c }} />)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px 14px' }}>
                  {perSection.map((s) => (
                    <span key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.muted }}>
                      <Dot e={s.n} size={8} />{entMeta(s.n).short}<span style={{ color: T.ink, fontWeight: 600 }}>{s.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
