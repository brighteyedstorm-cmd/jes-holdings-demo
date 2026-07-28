import * as React from 'react';
import { Check, ChevronLeft, ChevronRight, Library, Search, X } from 'lucide-react';

import { ENTITY_NAMES, STATUS_NAMES, T } from '../model/constants';
import { ILibrary, INewEvent, ITaxonomy } from '../model/types';
import { btnGhost, btnIcon, btnPrimary, input, serif } from './styles';
import { Dot, Field } from './primitives';

const StepDot = ({ n, active, done, label }: { n: number; active?: boolean; done?: boolean; label: string }): JSX.Element => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
    <span style={{ width: 20, height: 20, borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, background: active || done ? T.brand : T.hair, color: active || done ? '#fff' : T.faint }}>
      {done ? <Check size={12} strokeWidth={3} /> : n}
    </span>
    <span style={{ fontSize: 12, fontWeight: 600, color: active ? T.ink : T.faint }}>{label}</span>
  </span>
);

interface IDetail {
  entity: string;
  cat: string;
  sub: string;
  status: string;
  date: string;
  time: string;
  venue: string;
}

export interface IAddModalProps {
  libraries: ILibrary[];
  taxonomy: ITaxonomy;
  onClose: () => void;
  onAdd: (items: INewEvent[]) => void;
}

/** Step one picks libraries, step two sets the details that get written on create. */
export const AddModal = (props: IAddModalProps): JSX.Element => {
  const { libraries, taxonomy, onClose, onAdd } = props;
  const [step, setStep] = React.useState(1);
  const [q, setQ] = React.useState('');
  const [picked, setPicked] = React.useState<string[]>([]);
  const [details, setDetails] = React.useState<{ [name: string]: IDetail }>({});

  const list = libraries.filter((l) => l.name.toLowerCase().indexOf(q.toLowerCase()) > -1);
  const chosen = libraries.filter((l) => picked.indexOf(l.name) > -1);

  const toggle = (n: string): void => setPicked((p) => (p.indexOf(n) > -1 ? p.filter((x) => x !== n) : [...p, n]));

  const goDetails = (): void => {
    const d: { [name: string]: IDetail } = {};
    chosen.forEach((l) => {
      d[l.name] = details[l.name] || {
        entity: l.entity || '', cat: l.cat || '', sub: l.sub || '',
        status: 'Planning', date: '', time: '9:00 AM', venue: ''
      };
    });
    setDetails(d);
    setStep(2);
  };

  const setD = (name: string, patch: Partial<IDetail>): void =>
    setDetails((all) => ({ ...all, [name]: { ...all[name], ...patch } }));

  const submit = (): void => {
    const items: INewEvent[] = chosen.map((l) => {
      const d = details[l.name];
      return {
        name: l.name, libraryId: l.id, libraryUrl: l.url,
        entity: d.entity, cat: d.cat, sub: d.sub, status: d.status, date: d.date, time: d.time, venue: d.venue
      };
    });
    onAdd(items);
  };

  const fieldGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 };

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(26,33,31,.4)', backdropFilter: 'blur(2px)' }} />
      <div className="jes-modal" style={{ position: 'relative', width: 'min(580px,100%)', height: 'min(624px,94%)', background: T.surface, borderRadius: 18, boxShadow: '0 30px 70px rgba(26,33,31,.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 24px 15px', borderBottom: `1px solid ${T.lineSoft}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {step === 2 && <button className="jes-icon" onClick={() => setStep(1)} aria-label="Back" style={btnIcon}><ChevronLeft size={18} /></button>}
              <h2 style={serif(21)}>{step === 1 ? 'Add an event' : 'Set the details'}</h2>
            </div>
            <button className="jes-icon" onClick={onClose} aria-label="Close" style={btnIcon}><X size={18} /></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12 }}>
            <StepDot n={1} active={step === 1} done={step > 1} label="Choose libraries" />
            <span style={{ width: 26, height: 1, background: T.line }} />
            <StepDot n={2} active={step === 2} label="Date, time, place" />
          </div>
        </div>

        {step === 1 && (
          <>
            <div style={{ padding: '13px 24px 0' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.ghost }} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search libraries…" style={{ ...input, width: '100%', padding: '9px 12px 9px 34px', background: T.canvas }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '13px 16px' }}>
              {!list.length && <div style={{ textAlign: 'center', color: T.faint, fontSize: 13, padding: '44px 20px' }}>Every library on the site is already tracked as an event.</div>}
              {list.map((l) => {
                const on = picked.indexOf(l.name) > -1;
                return (
                  <button
                    key={l.name} onClick={() => toggle(l.name)} className="jes-opt"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '11px 12px', borderRadius: 11, border: `1px solid ${on ? T.brand : 'transparent'}`, cursor: 'pointer', background: on ? T.canvas : 'transparent', marginBottom: 3 }}
                  >
                    <span style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, display: 'grid', placeItems: 'center', background: on ? T.brand : T.surface, border: on ? 'none' : `1.5px solid ${T.line}`, color: '#fff' }}>{on && <Check size={12} strokeWidth={3} />}</span>
                    <Library size={16} style={{ color: T.ghost, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{l.name}</div>
                      {l.entity
                        ? <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}><Dot e={l.entity} size={7} />Inherits {l.entity}{l.cat ? ` · ${l.cat}` : ''}</div>
                        : <div style={{ fontSize: 11.5, color: T.ghost, marginTop: 2 }}>No section tagged yet</div>}
                    </div>
                    <span style={{ fontSize: 10.5, color: T.ghost, fontFamily: 'ui-monospace,Menlo,monospace', whiteSpace: 'nowrap' }}>/{l.name}/</span>
                  </button>
                );
              })}
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: T.muted }}>{picked.length} selected</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="jes-ghost" style={btnGhost} onClick={onClose}>Cancel</button>
                <button
                  className="jes-primary"
                  style={{ ...btnPrimary, opacity: picked.length ? 1 : 0.45, cursor: picked.length ? 'pointer' : 'not-allowed' }}
                  onClick={() => { if (picked.length) goDetails(); }}
                >Continue <ChevronRight size={15} /></button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px 22px' }}>
              <p style={{ fontSize: 12.5, color: T.muted, margin: '0 0 14px', lineHeight: 1.5 }}>Fill in what you know now. Anything you leave blank you can set later from the event, and you can build the checklist once it&#39;s created.</p>
              {chosen.map((l) => {
                const d = details[l.name];
                if (!d) return undefined;
                const cats = d.entity && taxonomy[d.entity] ? Object.keys(taxonomy[d.entity]) : [];
                const subs = d.entity && d.cat && taxonomy[d.entity] && taxonomy[d.entity][d.cat] ? taxonomy[d.entity][d.cat] : [];
                return (
                  <div key={l.name} style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 12, background: T.raise }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><Dot e={d.entity} /><span style={{ ...serif(16) }}>{l.name}</span></div>
                    <div style={fieldGrid}>
                      <Field label="Section">
                        <select value={d.entity} onChange={(e) => setD(l.name, { entity: e.target.value, cat: '', sub: '' })} style={{ ...input, width: '100%' }}>
                          <option value="">Uncategorized</option>
                          {ENTITY_NAMES.map((n) => <option key={n}>{n}</option>)}
                        </select>
                      </Field>
                      <Field label="Category">
                        <select value={d.cat} onChange={(e) => setD(l.name, { cat: e.target.value, sub: '' })} disabled={!cats.length} style={{ ...input, width: '100%', opacity: cats.length ? 1 : 0.5 }}>
                          <option value="">{cats.length ? 'None' : '—'}</option>
                          {cats.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                      {subs.length > 0 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <Field label="Subcategory">
                            <select value={d.sub} onChange={(e) => setD(l.name, { sub: e.target.value })} style={{ ...input, width: '100%' }}>
                              <option value="">None</option>
                              {subs.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </Field>
                        </div>
                      )}
                      <Field label="Date"><input type="date" value={d.date} onChange={(e) => setD(l.name, { date: e.target.value })} style={{ ...input, width: '100%' }} /></Field>
                      <Field label="Time"><input value={d.time} onChange={(e) => setD(l.name, { time: e.target.value })} placeholder="9:00 AM" style={{ ...input, width: '100%' }} /></Field>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <Field label="Venue"><input value={d.venue} onChange={(e) => setD(l.name, { venue: e.target.value })} placeholder="Where is it?" style={{ ...input, width: '100%' }} /></Field>
                      </div>
                      <Field label="Status">
                        <select value={d.status} onChange={(e) => setD(l.name, { status: e.target.value })} style={{ ...input, width: '100%' }}>
                          {STATUS_NAMES.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${T.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="jes-ghost" style={btnGhost} onClick={() => setStep(1)}><ChevronLeft size={15} /> Back</button>
              <button className="jes-primary" style={btnPrimary} onClick={submit}><Check size={15} strokeWidth={2.4} /> Add {picked.length} {picked.length === 1 ? 'event' : 'events'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
