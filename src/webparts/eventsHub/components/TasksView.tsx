import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { CheckSquare } from 'lucide-react';

import { ALERT, T } from '../model/constants';
import { IEventItem, IPerson, ITask } from '../model/types';
import { daysUntil, fmtShort, isOverdue, samePerson } from '../model/helpers';
import { linkBtn } from './styles';
import { Avatar, Dot, Empty, Seg } from './primitives';
import { PeoplePickerField } from './PeoplePickerField';

export interface ITasksViewProps {
  context: WebPartContext;
  events: IEventItem[];
  me: IPerson;
  onOpen: (e: IEventItem) => void;
  toggleTask: (eventId: number, taskId: number) => void;
}

interface IPair { e: IEventItem; t: ITask; }
interface IGroup { key: string; e?: IEventItem; items: IPair[]; }

export const TasksView = (props: ITasksViewProps): JSX.Element => {
  const { context, events, me, onOpen, toggleTask } = props;
  const [scope, setScope] = React.useState('me');
  const [person, setPerson] = React.useState<IPerson | undefined>(undefined);
  const [groupBy, setGroupBy] = React.useState('due');

  const all: IPair[] = [];
  events.forEach((e) => e.tasks.forEach((t) => {
    if (t.done) return;
    if (scope === 'me' && !samePerson(t.who, me)) return;
    if (scope === 'person' && person && !samePerson(t.who, person)) return;
    all.push({ e, t });
  }));
  const overN = all.filter((x) => isOverdue(x.t)).length;

  let groups: IGroup[] = [];
  if (groupBy === 'due') {
    const buckets: { [key: string]: IPair[] } = { Overdue: [], Today: [], 'This week': [], Later: [], 'No date': [] };
    all.forEach((x) => {
      const d = daysUntil(x.t.due);
      if (!x.t.due || d === undefined) buckets['No date'].push(x);
      else if (d < 0) buckets.Overdue.push(x);
      else if (d === 0) buckets.Today.push(x);
      else if (d <= 7) buckets['This week'].push(x);
      else buckets.Later.push(x);
    });
    groups = Object.keys(buckets)
      .filter((k) => buckets[k].length)
      .map((k) => ({
        key: k,
        items: buckets[k].sort((a, z) => (a.t.due ? new Date(a.t.due).getTime() : Infinity) - (z.t.due ? new Date(z.t.due).getTime() : Infinity))
      }));
  } else {
    const m: { [id: number]: IGroup } = {};
    all.forEach((x) => {
      if (!m[x.e.id]) m[x.e.id] = { key: x.e.name, e: x.e, items: [] };
      m[x.e.id].items.push(x);
    });
    groups = Object.keys(m).map((k) => m[Number(k)]);
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <Seg options={[['me', 'Assigned to me'], ['all', 'Everyone'], ['person', 'By person']]} value={scope} onChange={setScope} />
        {scope === 'person' && (
          <div style={{ width: 210 }}>
            <PeoplePickerField context={context} value={person} onChange={setPerson} small placeholder="Pick a person…" />
          </div>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: T.muted }}>{all.length} open{overN ? ` · ${overN} overdue` : ''}</span>
        <Seg options={[['due', 'By due'], ['event', 'By event']]} value={groupBy} onChange={setGroupBy} />
      </div>
      {!all.length && (
        <Empty
          icon={CheckSquare} title="Nothing open here"
          body={scope === 'me' ? 'Tasks assigned to you will appear here.' : 'No open tasks match this view.'}
        />
      )}
      {groups.map((g) => (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
            {groupBy === 'event' && g.e && <Dot e={g.e.entity} />}
            <span style={{ fontSize: 13, fontWeight: 700, color: g.key === 'Overdue' ? ALERT : T.ink }}>{g.key}</span>
            <span style={{ fontSize: 11.5, color: T.faint, background: T.hair, padding: '1px 8px', borderRadius: 99 }}>{g.items.length}</span>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 13, overflow: 'hidden' }}>
            {g.items.map(({ e, t }, i) => (
              <div key={t.id} className="jes-task" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', borderTop: i ? `1px solid ${T.lineSoft}` : 'none' }}>
                <button onClick={() => toggleTask(e.id, t.id)} aria-label="Complete" style={{ width: 19, height: 19, flexShrink: 0, borderRadius: 6, cursor: 'pointer', border: `1.5px solid ${T.line}`, background: T.surface }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: T.ink }}>{t.text}</div>
                  <button className="jes-link" onClick={() => onOpen(e)} style={{ ...linkBtn, fontSize: 11.5, marginTop: 3 }}><Dot e={e.entity} size={6} /> {e.name}</button>
                </div>
                <span className="jes-phasepill" style={{ fontSize: 10.5, fontWeight: 600, color: T.muted, background: T.hair, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>{t.phase}</span>
                {t.who && <Avatar name={t.who.title} size={22} />}
                <span style={{ fontSize: 12, color: isOverdue(t) ? ALERT : T.faint, fontWeight: isOverdue(t) ? 600 : 500, width: 74, textAlign: 'right', whiteSpace: 'nowrap' }}>{t.due ? fmtShort(t.due) : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
