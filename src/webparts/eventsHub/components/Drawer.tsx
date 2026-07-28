import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  Check, ExternalLink, Info, Layers, ListChecks, Pencil, Plus, Sparkles, Trash2, X
} from 'lucide-react';

import { ALERT, STATUS, STATUS_NAMES, T, entMeta } from '../model/constants';
import { IEventItem, IPerson, ITask, ITemplate } from '../model/types';
import { assignees, countdown, eventOverdue, fmtShort, isOverdue, libUrl, readiness } from '../model/helpers';
import { btnGhost, btnIcon, btnPrimary, input, lblStyle, miniBtn, rowAction, serif } from './styles';
import { AvatarStack, Avatar, Badge, Dot, Field, Ring, SectionHead, ringCenter, ringTitle } from './primitives';
import { PeoplePickerField } from './PeoplePickerField';
import { PhaseEditor } from './PhaseEditor';
import { TemplateModal } from './TemplateModal';

export interface ITaskPatch {
  text?: string;
  phase?: string;
  who?: IPerson | undefined;
  clearWho?: boolean;
  due?: string;
}

export interface IDrawerProps {
  context: WebPartContext;
  siteUrl: string;
  ev: IEventItem;
  phases: string[];
  templates: ITemplate[];
  onClose: () => void;
  onSchedule: (patch: { date?: string; time?: string; venue?: string; status?: string }) => void;
  onAddTask: (phase: string, text: string, who: IPerson | undefined, due: string) => void;
  onEditTask: (taskId: number, patch: ITaskPatch) => void;
  onToggleTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  onUseTemplate: (t: ITemplate) => void;
  addPhase: (name: string) => void;
  renamePhase: (from: string, to: string) => void;
  removePhase: (name: string) => void;
  saveTemplate: (name: string, tasks: ITask[]) => void;
  renameTemplate: (id: number, name: string) => void;
  deleteTemplate: (id: number) => void;
}

export const Drawer = (props: IDrawerProps): JSX.Element => {
  const {
    context, siteUrl, ev, phases, templates, onClose, onSchedule, onAddTask, onEditTask, onToggleTask,
    onDeleteTask, onUseTemplate, addPhase, renamePhase, removePhase, saveTemplate, renameTemplate, deleteTemplate
  } = props;

  const [tab, setTab] = React.useState('overview');
  const [text, setText] = React.useState('');
  const [phase, setPhase] = React.useState(phases[0] || '');
  const [addWho, setAddWho] = React.useState<IPerson | undefined>(undefined);
  const [addDue, setAddDue] = React.useState('');
  const [editId, setEditId] = React.useState(0);
  const [ed, setEd] = React.useState<{ text: string; phase: string; who: IPerson | undefined; due: string }>({ text: '', phase: '', who: undefined, due: '' });
  const [showPhases, setShowPhases] = React.useState(false);
  const [picker, setPicker] = React.useState(false);

  React.useEffect(() => {
    if (phases.length && phases.indexOf(phase) === -1) setPhase(phases[0]);
  }, [phases, phase]);

  const c = entMeta(ev.entity).color;

  const add = (): void => {
    if (!text.trim()) return;
    onAddTask(phase, text.trim(), addWho, addDue);
    setText(''); setAddDue(''); setAddWho(undefined);
  };

  const startEdit = (t: ITask): void => {
    setEditId(t.id);
    setEd({ text: t.text, phase: t.phase, who: t.who, due: t.due });
  };

  const saveEdit = (): void => {
    const original = ev.tasks.filter((t) => t.id === editId)[0];
    onEditTask(editId, {
      text: ed.text.trim() || (original ? original.text : ''),
      phase: ed.phase,
      who: ed.who,
      clearWho: !ed.who,
      due: ed.due
    });
    setEditId(0);
  };

  const activePhases = phases.filter((ph) => ev.tasks.filter((t) => t.phase === ph).length > 0);
  const looseTasks = ev.tasks.filter((t) => phases.indexOf(t.phase) === -1);

  const doneBox = (on: boolean): React.CSSProperties => ({
    width: 19, height: 19, flexShrink: 0, borderRadius: 6, cursor: 'pointer', display: 'grid', placeItems: 'center',
    background: on ? T.brand : T.surface, color: '#fff', border: on ? 'none' : `1.5px solid ${T.line}`, transition: 'all .15s ease'
  });

  const r = readiness(ev.tasks);
  const over = eventOverdue(ev);

  const taskRow = (t: ITask): JSX.Element => (
    editId === t.id
      ? (
        <div key={t.id} style={{ padding: 9, background: T.canvas, borderRadius: 11, marginBottom: 5 }}>
          <input
            autoFocus value={ed.text} onChange={(e) => setEd({ ...ed, text: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(0); }}
            style={{ ...input, width: '100%', padding: '7px 10px' }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'start' }}>
            <select value={ed.phase} onChange={(e) => setEd({ ...ed, phase: e.target.value })} style={{ ...input, flex: 1, padding: '7px 6px', fontSize: 12 }}>
              {phases.map((p) => <option key={p}>{p}</option>)}
            </select>
            <div style={{ flex: 1.4 }}>
              <PeoplePickerField context={context} value={ed.who} onChange={(v) => setEd({ ...ed, who: v })} small />
            </div>
            <input type="date" value={ed.due} onChange={(e) => setEd({ ...ed, due: e.target.value })} style={{ ...input, flex: 1, padding: '7px 6px', fontSize: 12 }} />
            <button className="jes-primary" style={{ ...btnPrimary, padding: '7px 9px' }} onClick={saveEdit} title="Save"><Check size={14} /></button>
          </div>
        </div>
      )
      : (
        <div key={t.id} className="jes-task" style={{ display: 'flex', alignItems: 'start', gap: 11, padding: '8px', borderRadius: 9 }}>
          <button onClick={() => onToggleTask(t.id)} aria-label="Toggle" style={{ marginTop: 1, ...doneBox(t.done) }}>{t.done && <Check size={12} strokeWidth={3} />}</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, color: t.done ? T.ghost : T.ink, textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</div>
            {(t.who || t.due) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 5, fontSize: 11.5 }}>
                {t.who && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.muted }}><Avatar name={t.who.title} size={17} />{t.who.title}</span>}
                {t.due && <span style={{ color: isOverdue(t) ? ALERT : T.faint, fontWeight: isOverdue(t) ? 600 : 400 }}>{isOverdue(t) ? 'overdue ' : 'due '}{fmtShort(t.due)}</span>}
              </div>
            )}
          </div>
          <button className="jes-rowx" onClick={() => startEdit(t)} aria-label="Edit task" style={rowAction} title="Edit"><Pencil size={13} /></button>
          <button className="jes-rowx" onClick={() => onDeleteTask(t.id)} aria-label="Delete task" style={rowAction} title="Delete"><Trash2 size={13} /></button>
        </div>
      )
  );

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 60 }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(26,33,31,.32)' }} />
      <aside className="jes-drawer" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(480px,96%)', background: T.surface, boxShadow: '-20px 0 54px rgba(26,33,31,.16)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 4, background: c }} />
        <div style={{ padding: '18px 24px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Dot e={ev.entity} />
                <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{ev.entity ? `${ev.entity}${ev.cat ? ` · ${ev.cat}` : ''}${ev.sub ? ` · ${ev.sub}` : ''}` : 'Not categorized'}</span>
              </div>
              <h2 style={{ ...serif(23), lineHeight: 1.12, margin: 0 }}>{ev.name}</h2>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge s={ev.status} />
                <span style={{ fontSize: 12.5, color: over ? ALERT : T.muted, fontWeight: over ? 600 : 500 }}>{over ? `${over} overdue` : countdown(ev.date)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ring value={r} size={52} stroke={4} center={ringCenter(ev)} title={ringTitle(ev)} />
              <button className="jes-icon" onClick={onClose} aria-label="Close" style={btnIcon}><X size={19} /></button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 16, borderBottom: `1px solid ${T.lineSoft}` }}>
            {[['overview', 'Overview'], ['checklist', `Checklist${ev.tasks.length ? ` · ${ev.tasks.filter((t) => t.done).length}/${ev.tasks.length}` : ''}`]].map(([id, label]) => (
              <button
                key={id} onClick={() => setTab(id)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '9px 4px', marginRight: 14, fontSize: 13, fontWeight: 600, color: tab === id ? T.ink : T.faint, borderBottom: `2px solid ${tab === id ? T.brand : 'transparent'}`, marginBottom: -1 }}
              >{label}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '18px 24px 28px', flex: 1 }}>
          {tab === 'overview' && (
            <>
              <a
                href={libUrl(siteUrl, ev.libraryUrl, ev.name)} target="_blank" rel="noreferrer" className="jes-primary"
                style={{ ...btnPrimary, textDecoration: 'none', width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}
              ><ExternalLink size={15} strokeWidth={2.2} /> Open {ev.name} library</a>
              <div style={{ marginTop: 22 }}>
                <SectionHead>Schedule</SectionHead>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                  <Field label="Date"><input type="date" value={ev.date} onChange={(e) => onSchedule({ date: e.target.value })} style={{ ...input, width: '100%' }} /></Field>
                  <Field label="Time"><input value={ev.time} onChange={(e) => onSchedule({ time: e.target.value })} style={{ ...input, width: '100%' }} /></Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Venue"><input value={ev.venue} onChange={(e) => onSchedule({ venue: e.target.value })} style={{ ...input, width: '100%' }} /></Field>
                  </div>
                  <Field label="Status">
                    <select value={ev.status} onChange={(e) => onSchedule({ status: e.target.value })} style={{ ...input, width: '100%' }}>
                      {STATUS_NAMES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 9, background: ev.entity ? T.canvas : STATUS.Planning.bg, border: `1px solid ${ev.entity ? T.line : '#EAD9B4'}`, borderRadius: 11, padding: '11px 13px' }}>
                <Info size={15} style={{ color: ev.entity ? T.faint : STATUS.Planning.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: ev.entity ? T.muted : '#7A5A1E', lineHeight: 1.45 }}>
                  {ev.entity
                    ? <>Filed under <strong style={{ color: T.ink }}>{ev.entity}{ev.cat ? ` · ${ev.cat}` : ''}{ev.sub ? ` · ${ev.sub}` : ''}</strong>. Change this in Manage.</>
                    : <>Not categorized yet. Assign a section in Manage to see it in Browse and the calendar.</>}
                </span>
              </div>
              <div style={{ marginTop: 22 }}>
                <SectionHead>People on this event</SectionHead>
                <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 11 }}><AvatarStack people={assignees(ev)} size={28} max={6} /></div>
              </div>
            </>
          )}

          {tab === 'checklist' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <SectionHead>Checklist</SectionHead>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="jes-mini" onClick={() => setShowPhases((v) => !v)} style={miniBtn} title="Edit phases"><Layers size={12} /> Phases</button>
                  <button className="jes-mini" onClick={() => setPicker(true)} style={miniBtn}><Sparkles size={12} /> Templates</button>
                </div>
              </div>
              {showPhases && <PhaseEditor phases={phases} addPhase={addPhase} renamePhase={renamePhase} removePhase={removePhase} />}
              {ev.tasks.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {activePhases.map((ph) => (
                    <div key={ph} style={{ marginBottom: 14 }}>
                      <div style={{ ...lblStyle, margin: '8px 0' }}>{ph}</div>
                      {ev.tasks.filter((t) => t.phase === ph).map(taskRow)}
                    </div>
                  ))}
                  {looseTasks.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ ...lblStyle, margin: '8px 0' }}>No phase</div>
                      {looseTasks.map(taskRow)}
                    </div>
                  )}
                </div>
              )}
              {!ev.tasks.length && (
                <div style={{ marginTop: 14, textAlign: 'center', padding: '26px 18px', border: `1px dashed ${T.line}`, borderRadius: 13, background: T.canvas }}>
                  <ListChecks size={22} style={{ color: T.ghost, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: T.muted, margin: '0 0 12px' }}>No checklist yet. Start from a template, or add tasks below.</p>
                  <button className="jes-ghost" style={{ ...btnGhost, margin: '0 auto' }} onClick={() => setPicker(true)}><Sparkles size={14} /> Browse templates</button>
                </div>
              )}
              <div style={{ marginTop: 13, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 12, padding: 11 }}>
                <input
                  value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
                  placeholder="Add a task" style={{ ...input, width: '100%', padding: '9px 11px' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 7, alignItems: 'start' }}>
                  <select value={phase} onChange={(e) => setPhase(e.target.value)} style={{ ...input, flex: 1, padding: '7px 6px', fontSize: 12 }}>
                    {phases.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <div style={{ flex: 1.4 }}>
                    <PeoplePickerField context={context} value={addWho} onChange={setAddWho} direction="up" small />
                  </div>
                  <input type="date" value={addDue} onChange={(e) => setAddDue(e.target.value)} style={{ ...input, flex: 1, padding: '7px 6px', fontSize: 12 }} />
                  <button className="jes-primary" style={{ ...btnPrimary, padding: '7px 11px' }} onClick={add}><Plus size={15} strokeWidth={2.6} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
      {picker && (
        <TemplateModal
          templates={templates} phases={phases} current={ev.tasks}
          onClose={() => setPicker(false)}
          onUse={(t) => { onUseTemplate(t); setPicker(false); }}
          onSaveCurrent={(name) => saveTemplate(name, ev.tasks)}
          onRename={renameTemplate}
          onDelete={deleteTemplate}
        />
      )}
    </div>
  );
};
