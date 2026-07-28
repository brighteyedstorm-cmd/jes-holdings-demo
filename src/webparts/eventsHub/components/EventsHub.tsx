import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import {
  AlertCircle, CalendarRange, CheckSquare, Command as CommandIcon, LayoutDashboard, LayoutGrid,
  List as ListIcon, LucideIcon, Plus, Search, SlidersHorizontal, Tags
} from 'lucide-react';

import styles from './EventsHub.module.scss';
import { ENTITY_NAMES, STATUS, STATUS_NAMES, T } from '../model/constants';
import {
  ICategory, IEventItem, IFilters, ILibrary, INewEvent, IPerson, IPhase, ISubcategory, ITask, ITemplate
} from '../model/types';
import { buildTaxonomy, initials, samePerson } from '../model/helpers';
import { HubService } from '../services/HubService';
import { btnGhost, btnPrimary, input, kbd, linkBtn, serif, serifRaw } from './styles';
import { IToast, Toasts } from './Toasts';
import { CommandPalette } from './CommandPalette';
import { AddModal } from './AddModal';
import { Drawer, ITaskPatch } from './Drawer';
import { Overview } from './Overview';
import { EventsView } from './EventsView';
import { CalendarView } from './CalendarView';
import { TasksView } from './TasksView';
import { ManageLibraries } from './ManageLibraries';
import { TaxonomyView } from './TaxonomyView';

export interface IEventsHubProps {
  context: WebPartContext;
}

type IconType = LucideIcon;

const NAV: [string, string, IconType][] = [
  ['overview', 'Overview', LayoutDashboard],
  ['events', 'Events', LayoutGrid],
  ['calendar', 'Calendar', CalendarRange],
  ['tasks', 'Tasks', CheckSquare],
  ['manage', 'Manage', SlidersHorizontal]
];

const VIEW_TITLE: { [key: string]: string } = {
  overview: 'Overview', events: 'Events', calendar: 'Calendar', tasks: 'Tasks', manage: 'Manage'
};

const SAVE_FAILED = 'Could not save. Try again.';

export const EventsHub = (props: IEventsHubProps): JSX.Element => {
  const { context } = props;
  const service = React.useMemo(() => new HubService(context), [context]);
  const me: IPerson = React.useMemo(() => ({
    id: 0,
    title: context.pageContext.user.displayName,
    email: context.pageContext.user.email,
    loginName: context.pageContext.user.loginName
  }), [context]);

  const [stage, setStage] = React.useState<'setup' | 'loading' | 'ready' | 'failed'>('setup');
  const [events, setEvents] = React.useState<IEventItem[]>([]);
  const [libraries, setLibraries] = React.useState<ILibrary[]>([]);
  const [phases, setPhases] = React.useState<IPhase[]>([]);
  const [categories, setCategories] = React.useState<ICategory[]>([]);
  const [subcategories, setSubcategories] = React.useState<ISubcategory[]>([]);
  const [templates, setTemplates] = React.useState<ITemplate[]>([]);

  const [view, setView] = React.useState('overview');
  const [manageTab, setManageTab] = React.useState('libraries');
  const [filters, setFilters] = React.useState<IFilters>({ section: 'All', status: 'All', q: '', attention: false, sort: 'soonest', layout: 'grid' });
  const [open, setOpen] = React.useState(0);
  const [adding, setAdding] = React.useState(false);
  const [cmdk, setCmdk] = React.useState(false);
  const [toasts, setToasts] = React.useState<IToast[]>([]);

  const notify = React.useCallback((msg: string, error?: boolean) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, error }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Load                                                            */
  /* ---------------------------------------------------------------- */
  const applyData = React.useCallback((load: Awaited<ReturnType<HubService['load']>>) => {
    setEvents(load.events);
    setLibraries(load.libraries);
    setPhases(load.phases);
    setCategories(load.categories);
    setSubcategories(load.subcategories);
    setTemplates(load.templates);
  }, []);

  const reload = React.useCallback(async (): Promise<void> => {
    const load = await service.load();
    applyData(load);
  }, [service, applyData]);

  React.useEffect(() => {
    let cancelled = false;
    const boot = async (): Promise<void> => {
      try {
        await service.ensureLists();
        if (cancelled) return;
        setStage('loading');
        const load = await service.load();
        if (cancelled) return;
        applyData(load);
        setStage('ready');
      } catch {
        if (!cancelled) setStage('failed');
      }
    };
    boot().catch(() => setStage('failed'));
    return () => { cancelled = true; };
  }, [service, applyData]);

  /** Every write goes through here, so a failure always says so and resyncs. */
  const write = React.useCallback((msg: string, fn: () => Promise<void>): void => {
    fn()
      .then(() => notify(msg))
      .catch(() => {
        notify(SAVE_FAILED, true);
        // The toast has already said what happened, so a failed resync stays quiet.
        reload().catch(() => undefined);
      });
  }, [notify, reload]);

  /* ---------------------------------------------------------------- */
  /*  Derived                                                         */
  /* ---------------------------------------------------------------- */
  const taxonomy = React.useMemo(() => buildTaxonomy(categories, subcategories, ENTITY_NAMES), [categories, subcategories]);
  const phaseNames = React.useMemo(() => phases.map((p) => p.title), [phases]);
  const openEv = events.filter((e) => e.id === open)[0];
  const uncat = events.filter((e) => !e.entity).length;
  const myOpen = React.useMemo(() => {
    let n = 0;
    events.forEach((e) => e.tasks.forEach((t) => { if (samePerson(t.who, me) && !t.done) n++; }));
    return n;
  }, [events, me]);

  const patchEvent = React.useCallback((id: number, patch: Partial<IEventItem>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const patchTasks = React.useCallback((eventId: number, fn: (tasks: ITask[]) => ITask[]) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, tasks: fn(e.tasks) } : e)));
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Events                                                          */
  /* ---------------------------------------------------------------- */
  const addEvents = (items: INewEvent[]): void => {
    setAdding(false);
    const allTagged = items.every((i) => !!i.entity);
    write(`Added ${items.length} ${items.length === 1 ? 'event' : 'events'}`, async () => {
      const created = await service.addEvents(items, categories, subcategories);
      setEvents((prev) => [...created, ...prev]);
      const names = items.map((i) => i.name);
      setLibraries((prev) => prev.filter((l) => names.indexOf(l.name) === -1));
      setView(allTagged ? 'events' : 'manage');
      setManageTab('libraries');
    });
  };

  /* Schedule edits are typed, so the write waits for the typing to settle. */
  const scheduleTimers = React.useRef<{ [eventId: number]: number }>({});
  const schedulePending = React.useRef<{ [eventId: number]: { date?: string; time?: string; venue?: string; status?: string } }>({});

  const onSchedule = (eventId: number, patch: { date?: string; time?: string; venue?: string; status?: string }): void => {
    patchEvent(eventId, patch);
    schedulePending.current[eventId] = { ...schedulePending.current[eventId], ...patch };
    window.clearTimeout(scheduleTimers.current[eventId]);
    scheduleTimers.current[eventId] = window.setTimeout(() => {
      const body = schedulePending.current[eventId];
      delete schedulePending.current[eventId];
      write('Event saved', () => service.updateEventSchedule(eventId, body));
    }, 700);
  };

  React.useEffect(() => () => {
    Object.keys(scheduleTimers.current).forEach((k) => window.clearTimeout(scheduleTimers.current[Number(k)]));
  }, []);

  const setCategorization = (e: IEventItem, entity: string, cat: string, sub: string): void => {
    const catId = service.findCategoryId(categories, entity, cat);
    const subId = service.findSubcategoryId(subcategories, catId, sub);
    patchEvent(e.id, { entity, cat: catId ? cat : '', sub: subId ? sub : '', catId, subId });
    const msg = entity !== e.entity ? (entity ? 'Section assigned' : 'Section cleared') : 'Event updated';
    write(msg, () => service.updateEventCategorization(e.id, entity, catId, subId));
  };

  const setStatus = (e: IEventItem, status: string): void => {
    patchEvent(e.id, { status });
    write('Status updated', () => service.updateEventSchedule(e.id, { status }));
  };

  const bulkSetSection = (ids: number[], entity: string): void => {
    setEvents((prev) => prev.map((e) => (ids.indexOf(e.id) > -1 ? { ...e, entity, cat: '', sub: '', catId: 0, subId: 0 } : e)));
    write(`Updated ${ids.length} ${ids.length === 1 ? 'event' : 'events'}`, () => service.bulkSetSection(ids, entity));
  };

  /* ---------------------------------------------------------------- */
  /*  Tasks                                                           */
  /* ---------------------------------------------------------------- */
  const toggleTask = (eventId: number, taskId: number): void => {
    const ev = events.filter((e) => e.id === eventId)[0];
    if (!ev) return;
    const task = ev.tasks.filter((t) => t.id === taskId)[0];
    if (!task) return;
    const next = !task.done;
    patchTasks(eventId, (tasks) => tasks.map((t) => (t.id === taskId ? { ...t, done: next } : t)));
    write(next ? 'Task completed' : 'Task reopened', () => service.updateTask(taskId, { done: next }));
  };

  const addTask = (eventId: number, phaseName: string, text: string, who: IPerson | undefined, due: string): void => {
    const phase = phases.filter((p) => p.title === phaseName)[0];
    write('Task added', async () => {
      const id = await service.addTask(eventId, phase ? phase.id : 0, text, who, due);
      patchTasks(eventId, (tasks) => [...tasks, { id, phase: phaseName, text, done: false, who, due }]);
    });
  };

  const editTask = (eventId: number, taskId: number, patch: ITaskPatch): void => {
    const phase = patch.phase ? phases.filter((p) => p.title === patch.phase)[0] : undefined;
    patchTasks(eventId, (tasks) => tasks.map((t) => (t.id === taskId
      ? {
        ...t,
        text: patch.text !== undefined ? patch.text : t.text,
        phase: patch.phase !== undefined ? patch.phase : t.phase,
        who: patch.clearWho ? undefined : (patch.who !== undefined ? patch.who : t.who),
        due: patch.due !== undefined ? patch.due : t.due
      }
      : t)));
    write('Task updated', () => service.updateTask(taskId, {
      text: patch.text,
      phaseId: phase ? phase.id : undefined,
      who: patch.who,
      clearWho: patch.clearWho,
      due: patch.due
    }));
  };

  const deleteTask = (eventId: number, taskId: number): void => {
    patchTasks(eventId, (tasks) => tasks.filter((t) => t.id !== taskId));
    write('Task deleted', () => service.deleteTask(taskId));
  };

  const useTemplate = (eventId: number, t: ITemplate): void => {
    write(`Added ${t.tasks.length} ${t.tasks.length === 1 ? 'task' : 'tasks'}`, async () => {
      const known = [...phases];
      for (const row of t.tasks) {
        if (known.filter((p) => p.title === row.phase).length === 0) {
          const created = await service.addPhase(row.phase, known.length + 1);
          known.push(created);
        }
      }
      if (known.length !== phases.length) setPhases(known);
      const rows = t.tasks.map((row) => {
        const phase = known.filter((p) => p.title === row.phase)[0];
        return { phaseId: phase ? phase.id : 0, text: row.text };
      });
      const ids = await service.addTasks(eventId, rows);
      patchTasks(eventId, (tasks) => [
        ...tasks,
        ...t.tasks.map((row, i) => ({ id: ids[i], phase: row.phase, text: row.text, done: false, who: undefined, due: '' }))
      ]);
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Phases                                                          */
  /* ---------------------------------------------------------------- */
  const addPhase = (name: string): void => {
    if (phases.filter((p) => p.title === name).length) return;
    write('Phase added', async () => {
      const created = await service.addPhase(name, phases.length + 1);
      setPhases((prev) => [...prev, created]);
    });
  };

  const renamePhase = (from: string, to: string): void => {
    const phase = phases.filter((p) => p.title === from)[0];
    if (!phase) return;
    setPhases((prev) => prev.map((p) => (p.id === phase.id ? { ...p, title: to } : p)));
    setEvents((prev) => prev.map((e) => ({ ...e, tasks: e.tasks.map((t) => (t.phase === from ? { ...t, phase: to } : t)) })));
    write('Phase renamed', () => service.renamePhase(phase.id, to));
  };

  const removePhase = (name: string): void => {
    if (phases.length <= 1) return;
    const phase = phases.filter((p) => p.title === name)[0];
    if (!phase) return;
    const rest = phases.filter((p) => p.id !== phase.id);
    const fallback = rest[0];
    const affected: number[] = [];
    events.forEach((e) => e.tasks.forEach((t) => { if (t.phase === name) affected.push(t.id); }));
    setPhases(rest);
    setEvents((prev) => prev.map((e) => ({ ...e, tasks: e.tasks.map((t) => (t.phase === name ? { ...t, phase: fallback.title } : t)) })));
    write('Phase removed', async () => {
      if (affected.length) await service.reassignTasksToPhase(affected, fallback.id);
      await service.removePhase(phase.id);
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Categories and subcategories                                    */
  /* ---------------------------------------------------------------- */
  const addCategory = (section: string, name: string): void => {
    if (categories.filter((c) => c.section === section && c.title === name).length) return;
    write('Category added', async () => {
      const created = await service.addCategory(section, name, categories.filter((c) => c.section === section).length + 1);
      setCategories((prev) => [...prev, created]);
    });
  };

  const renameCategory = (section: string, from: string, to: string): void => {
    const cat = categories.filter((c) => c.section === section && c.title === from)[0];
    if (!cat) return;
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, title: to } : c)));
    setEvents((prev) => prev.map((e) => (e.catId === cat.id ? { ...e, cat: to } : e)));
    write('Category renamed', () => service.renameCategory(cat.id, to));
  };

  const removeCategory = (section: string, name: string): void => {
    const cat = categories.filter((c) => c.section === section && c.title === name)[0];
    if (!cat) return;
    const subs = subcategories.filter((s) => s.categoryId === cat.id);
    const affected = events.filter((e) => e.catId === cat.id).map((e) => e.id);
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    setSubcategories((prev) => prev.filter((s) => s.categoryId !== cat.id));
    setEvents((prev) => prev.map((e) => (e.catId === cat.id ? { ...e, cat: '', sub: '', catId: 0, subId: 0 } : e)));
    write('Category removed', async () => {
      if (affected.length) await service.clearCategoryReferences(affected, false);
      for (const s of subs) await service.removeSubcategory(s.id);
      await service.removeCategory(cat.id);
    });
  };

  const addSub = (section: string, catName: string, name: string): void => {
    const cat = categories.filter((c) => c.section === section && c.title === catName)[0];
    if (!cat) return;
    if (subcategories.filter((s) => s.categoryId === cat.id && s.title === name).length) return;
    write('Subcategory added', async () => {
      const created = await service.addSubcategory(cat.id, name, subcategories.filter((s) => s.categoryId === cat.id).length + 1);
      setSubcategories((prev) => [...prev, created]);
    });
  };

  const renameSub = (section: string, catName: string, from: string, to: string): void => {
    const cat = categories.filter((c) => c.section === section && c.title === catName)[0];
    if (!cat) return;
    const sub = subcategories.filter((s) => s.categoryId === cat.id && s.title === from)[0];
    if (!sub) return;
    setSubcategories((prev) => prev.map((s) => (s.id === sub.id ? { ...s, title: to } : s)));
    setEvents((prev) => prev.map((e) => (e.subId === sub.id ? { ...e, sub: to } : e)));
    write('Subcategory renamed', () => service.renameSubcategory(sub.id, to));
  };

  const removeSub = (section: string, catName: string, name: string): void => {
    const cat = categories.filter((c) => c.section === section && c.title === catName)[0];
    if (!cat) return;
    const sub = subcategories.filter((s) => s.categoryId === cat.id && s.title === name)[0];
    if (!sub) return;
    const affected = events.filter((e) => e.subId === sub.id).map((e) => e.id);
    setSubcategories((prev) => prev.filter((s) => s.id !== sub.id));
    setEvents((prev) => prev.map((e) => (e.subId === sub.id ? { ...e, sub: '', subId: 0 } : e)));
    write('Subcategory removed', async () => {
      if (affected.length) await service.clearCategoryReferences(affected, true);
      await service.removeSubcategory(sub.id);
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Templates                                                       */
  /* ---------------------------------------------------------------- */
  const saveTemplate = (name: string, tasks: ITask[]): void => {
    write('Template saved', async () => {
      const created = await service.saveTemplate(name, tasks.map((t) => ({ phase: t.phase, text: t.text })));
      setTemplates((prev) => [...prev, created]);
    });
  };

  const renameTemplate = (id: number, name: string): void => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
    write('Template renamed', () => service.renameTemplate(id, name));
  };

  const deleteTemplate = (id: number): void => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    write('Template deleted', () => service.deleteTemplate(id));
  };

  /* ---------------------------------------------------------------- */
  /*  Keyboard                                                        */
  /* ---------------------------------------------------------------- */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdk((v) => !v); }
      else if (e.key === 'Escape') {
        if (cmdk) setCmdk(false);
        else if (adding) setAdding(false);
        else if (open) setOpen(0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdk, adding, open]);

  const goOpen = (e: IEventItem): void => setOpen(e.id);
  const showUncat = (): void => { setView('manage'); setManageTab('libraries'); };
  const filterBar = view === 'events' || view === 'calendar';

  const shell = (children: React.ReactNode): JSX.Element => (
    <div
      className={styles.hub}
      style={{ background: T.canvas, minHeight: 680, height: '90vh', borderRadius: 16, overflow: 'hidden', position: 'relative', fontFamily: "-apple-system,'Segoe UI',Roboto,Arial,sans-serif", color: T.ink, display: 'flex', border: `1px solid ${T.line}` }}
    >{children}</div>
  );

  if (stage !== 'ready') {
    const message = stage === 'setup'
      ? 'Setting up the events hub lists'
      : stage === 'loading' ? 'Loading events' : 'The events hub could not load. Refresh the page to try again.';
    return shell(
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: T.brand, color: '#fff', display: 'grid', placeItems: 'center', ...serifRaw, fontWeight: 700, fontSize: 15, margin: '0 auto 14px' }}>J</div>
          <div style={{ ...serif(17) }}>{message}</div>
          {stage !== 'failed' && <div style={{ fontSize: 12.5, color: T.faint, marginTop: 6 }}>This takes a moment the first time.</div>}
        </div>
      </div>
    );
  }

  return shell(
    <>
      {/* Rail */}
      <nav className="jes-rail" style={{ width: 68, background: T.surface, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', flexShrink: 0, gap: 6 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.brand, color: '#fff', display: 'grid', placeItems: 'center', ...serifRaw, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>J</div>
        {NAV.map(([id, label, Icon]) => (
          <button
            key={id} onClick={() => setView(id)} className={`jes-navbtn${view === id ? ' active' : ''}`} title={label} aria-label={label}
            style={{ position: 'relative', width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', background: view === id ? T.brand : 'transparent', color: view === id ? '#fff' : T.faint, display: 'grid', placeItems: 'center' }}
          >
            <Icon size={19} strokeWidth={view === id ? 2.2 : 1.9} />
            {id === 'tasks' && myOpen > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 99, background: view === id ? '#fff' : T.brand, color: view === id ? T.brand : '#fff', fontSize: 9.5, fontWeight: 800, display: 'grid', placeItems: 'center', boxSizing: 'border-box' }}>{myOpen}</span>
            )}
            {id === 'manage' && uncat > 0 && (
              <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 99, background: '#B0843B' }} />
            )}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className="jes-navbtn" onClick={() => setCmdk(true)} title="Command (⌘K)" aria-label="Open the command palette"
          style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', color: T.faint, display: 'grid', placeItems: 'center' }}
        ><CommandIcon size={18} /></button>
        <div title={me.title} style={{ width: 34, height: 34, borderRadius: 99, background: T.hair, border: `1px solid ${T.line}`, color: T.muted, display: 'grid', placeItems: 'center', fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>{initials(me.title)}</div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="jes-head" style={{ background: T.surface, borderBottom: `1px solid ${T.line}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <h1 style={{ ...serif(19), margin: 0 }}>{VIEW_TITLE[view]}</h1>
          {view === 'events' && (
            <span style={{ fontSize: 12.5, color: T.faint, background: T.hair, padding: '2px 9px', borderRadius: 99 }}>{events.filter((e) => e.entity).length}</span>
          )}
          <div style={{ flex: 1 }} />
          <button
            className="jes-search" onClick={() => setCmdk(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 10, padding: '8px 12px', cursor: 'pointer', color: T.faint, minWidth: 220 }}
          >
            <Search size={15} /><span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>Search or jump to…</span><span style={kbd}>⌘K</span>
          </button>
          <button className="jes-primary" onClick={() => setAdding(true)} style={btnPrimary}><Plus size={16} strokeWidth={2.6} /> Add event</button>
        </header>

        {/* Contextual filter bar */}
        {filterBar && (
          <div className="jes-filterbar" style={{ background: T.surface, borderBottom: `1px solid ${T.line}`, padding: '11px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            <select value={filters.section} onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))} style={{ ...input, padding: '7px 10px', cursor: 'pointer' }}>
              <option value="All">All sections</option>
              {ENTITY_NAMES.map((n) => <option key={n}>{n}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} style={{ ...input, padding: '7px 10px', cursor: 'pointer' }}>
              <option value="All">Any status</option>
              {STATUS_NAMES.map((n) => <option key={n}>{n}</option>)}
            </select>
            {view === 'events' && (
              <>
                <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} style={{ ...input, padding: '7px 10px', cursor: 'pointer' }}>
                  <option value="soonest">Soonest</option>
                  <option value="name">Name</option>
                  <option value="readiness">Readiness</option>
                </select>
                <button
                  className="jes-ghost" onClick={() => setFilters((f) => ({ ...f, attention: !f.attention }))}
                  style={{ ...btnGhost, borderColor: filters.attention ? T.brand : T.line, color: filters.attention ? T.ink : T.muted }}
                ><AlertCircle size={14} /> Needs attention</button>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'inline-flex', background: T.hair, borderRadius: 9, padding: 3 }}>
                  <button
                    onClick={() => setFilters((f) => ({ ...f, layout: 'grid' }))} aria-label="Card layout"
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 9px', borderRadius: 7, background: filters.layout === 'grid' ? T.surface : 'transparent', color: filters.layout === 'grid' ? T.ink : T.faint }}
                  ><LayoutGrid size={15} /></button>
                  <button
                    onClick={() => setFilters((f) => ({ ...f, layout: 'list' }))} aria-label="List layout"
                    style={{ border: 'none', cursor: 'pointer', padding: '6px 9px', borderRadius: 7, background: filters.layout === 'list' ? T.surface : 'transparent', color: filters.layout === 'list' ? T.ink : T.faint }}
                  ><ListIcon size={15} /></button>
                </div>
              </>
            )}
          </div>
        )}

        {view === 'manage' && (
          <div style={{ background: T.surface, borderBottom: `1px solid ${T.line}`, padding: '0 24px', display: 'flex', gap: 22, flexShrink: 0 }}>
            {([['libraries', 'Libraries', LayoutGrid], ['categories', 'Categories & subcategories', Tags]] as [string, string, IconType][]).map(([id, label, Icon]) => (
              <button
                key={id} onClick={() => setManageTab(id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', cursor: 'pointer', padding: '11px 2px', fontSize: 13, fontWeight: 600, color: manageTab === id ? T.ink : T.faint, borderBottom: `2px solid ${manageTab === id ? T.brand : 'transparent'}`, marginBottom: -1 }}
              ><Icon size={14} />{label}</button>
            ))}
          </div>
        )}

        {uncat > 0 && view !== 'manage' && view !== 'overview' && (
          <div style={{ background: STATUS.Planning.bg, borderBottom: '1px solid #EAD9B4', padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <AlertCircle size={15} style={{ color: STATUS.Planning.color }} />
            <span style={{ fontSize: 12.5, color: '#7A5A1E' }}>{uncat} {uncat === 1 ? 'event needs' : 'events need'} a section assigned.</span>
            <button onClick={showUncat} className="jes-link" style={{ ...linkBtn, color: '#7A5A1E', textDecoration: 'underline' }}>Categorize now</button>
          </div>
        )}

        <div key={view + manageTab} className="jes-view" style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {view === 'overview' && (
            <Overview events={events} me={me} onOpen={goOpen} go={setView} showUncat={showUncat} toggleTask={toggleTask} />
          )}
          {view === 'events' && <EventsView events={events} onOpen={goOpen} filters={filters} />}
          {view === 'calendar' && <CalendarView events={events} onOpen={goOpen} filters={filters} />}
          {view === 'tasks' && <TasksView context={context} events={events} me={me} onOpen={goOpen} toggleTask={toggleTask} />}
          {view === 'manage' && manageTab === 'libraries' && (
            <ManageLibraries
              siteUrl={service.siteUrl} events={events} unregistered={libraries} taxonomy={taxonomy}
              onOpen={goOpen} onAdd={() => setAdding(true)}
              setCategorization={setCategorization} setStatus={setStatus} bulkSetSection={bulkSetSection}
            />
          )}
          {view === 'manage' && manageTab === 'categories' && (
            <TaxonomyView
              taxonomy={taxonomy}
              addCategory={addCategory} renameCategory={renameCategory} removeCategory={removeCategory}
              addSub={addSub} renameSub={renameSub} removeSub={removeSub}
            />
          )}
        </div>
      </div>

      {openEv && (
        <Drawer
          context={context} siteUrl={service.siteUrl} ev={openEv} phases={phaseNames} templates={templates}
          onClose={() => setOpen(0)}
          onSchedule={(patch) => onSchedule(openEv.id, patch)}
          onAddTask={(phase, text, who, due) => addTask(openEv.id, phase, text, who, due)}
          onEditTask={(taskId, patch) => editTask(openEv.id, taskId, patch)}
          onToggleTask={(taskId) => toggleTask(openEv.id, taskId)}
          onDeleteTask={(taskId) => deleteTask(openEv.id, taskId)}
          onUseTemplate={(t) => useTemplate(openEv.id, t)}
          addPhase={addPhase} renamePhase={renamePhase} removePhase={removePhase}
          saveTemplate={saveTemplate} renameTemplate={renameTemplate} deleteTemplate={deleteTemplate}
        />
      )}
      {adding && <AddModal libraries={libraries} taxonomy={taxonomy} onClose={() => setAdding(false)} onAdd={addEvents} />}
      {cmdk && (
        <CommandPalette
          onClose={() => setCmdk(false)} events={events} go={setView} openEvent={goOpen}
          addEvent={() => setAdding(true)} showUncat={showUncat}
        />
      )}
      <Toasts items={toasts} />
    </>
  );
};

export default EventsHub;
