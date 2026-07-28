import * as React from 'react';
import { Inbox } from 'lucide-react';

import { ENTITY_NAMES, T, entMeta } from '../model/constants';
import { IEventItem, IFilters } from '../model/types';
import { daysUntil, eventOverdue, readiness } from '../model/helpers';
import { lblStyle, serif } from './styles';
import { Empty } from './primitives';
import { Card, EventRow } from './EventCard';

export interface IEventsViewProps {
  events: IEventItem[];
  onOpen: (e: IEventItem) => void;
  filters: IFilters;
}

type Sorter = (a: IEventItem, b: IEventItem) => number;

export const EventsView = (props: IEventsViewProps): JSX.Element => {
  const { events, onOpen, filters } = props;
  const { section, status, q, attention, sort, layout } = filters;

  const visible = events.filter((e) =>
    e.entity
    && (section === 'All' || e.entity === section)
    && (status === 'All' || e.status === status)
    && (!q || `${e.name}${e.cat || ''}${e.entity || ''}`.toLowerCase().indexOf(q.toLowerCase()) > -1)
    && (!attention || eventOverdue(e) > 0)
  );

  const sorters: { [key: string]: Sorter } = {
    soonest: (a, b) => {
      const da = daysUntil(a.date); const db = daysUntil(b.date);
      return (da === undefined ? 9e9 : da) - (db === undefined ? 9e9 : db);
    },
    name: (a, b) => a.name.localeCompare(b.name),
    readiness: (a, b) => {
      const ra = readiness(a.tasks); const rb = readiness(b.tasks);
      return (ra === undefined ? -1 : ra) - (rb === undefined ? -1 : rb);
    }
  };
  const sorter = sorters[sort] || sorters.soonest;

  if (layout === 'list') {
    const rows = [...visible].sort(sorter);
    return rows.length
      ? <div style={{ maxWidth: 900 }}>{rows.map((e) => <EventRow key={e.id} ev={e} onOpen={onOpen} />)}</div>
      : <Empty icon={Inbox} title="No events match" body="Clear a filter, or check Manage for anything uncategorized." />;
  }

  const groups: { [entity: string]: { [cat: string]: IEventItem[] } } = {};
  visible.forEach((e) => {
    if (!groups[e.entity]) groups[e.entity] = {};
    const key = e.cat || '_direct';
    if (!groups[e.entity][key]) groups[e.entity][key] = [];
    groups[e.entity][key].push(e);
  });
  Object.keys(groups).forEach((en) => Object.keys(groups[en]).forEach((k) => groups[en][k].sort(sorter)));

  const order = section === 'All' ? ENTITY_NAMES : [section];
  if (!visible.length) return <Empty icon={Inbox} title="No events match" body="Clear a filter, or check Manage for anything uncategorized." />;

  return (
    <div>
      {order.filter((en) => groups[en]).map((en) => {
        const catKeys = Object.keys(groups[en]).sort();
        const total = catKeys.reduce((n, k) => n + groups[en][k].length, 0);
        return (
          <section key={en} style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: entMeta(en).color }} />
              <h3 style={{ ...serif(18), margin: 0 }}>{en}</h3>
              <span style={{ fontSize: 12, color: T.faint, background: T.hair, padding: '2px 9px', borderRadius: 99 }}>{total}</span>
            </div>
            {catKeys.map((catKey) => (
              <div key={catKey} style={{ marginBottom: 16 }}>
                {catKey !== '_direct' && <div style={{ ...lblStyle, margin: '0 0 10px 2px' }}>{catKey}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,240px),1fr))', gap: 14 }}>
                  {groups[en][catKey].map((e) => <Card key={e.id} ev={e} onOpen={onOpen} />)}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
};
