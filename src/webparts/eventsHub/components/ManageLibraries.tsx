import * as React from 'react';
import { AlertCircle, ExternalLink, Filter, Library, Search } from 'lucide-react';

import { ENTITY_NAMES, STATUS, STATUS_NAMES, T } from '../model/constants';
import { IEventItem, ILibrary, ITaxonomy } from '../model/types';
import { fmtShort, libUrl } from '../model/helpers';
import { btnGhost, btnIcon, input, linkBtn } from './styles';
import { Dot } from './primitives';

export interface IManageLibrariesProps {
  siteUrl: string;
  events: IEventItem[];
  unregistered: ILibrary[];
  taxonomy: ITaxonomy;
  onOpen: (e: IEventItem) => void;
  onAdd: () => void;
  setCategorization: (e: IEventItem, entity: string, cat: string, sub: string) => void;
  setStatus: (e: IEventItem, status: string) => void;
  bulkSetSection: (ids: number[], entity: string) => void;
}

export const ManageLibraries = (props: IManageLibrariesProps): JSX.Element => {
  const { siteUrl, events, unregistered, taxonomy, onOpen, onAdd, setCategorization, setStatus, bulkSetSection } = props;
  const [onlyUncat, setOnlyUncat] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [sel, setSel] = React.useState<number[]>([]);

  const rows = events.filter((e) => (!onlyUncat || !e.entity) && (!q || e.name.toLowerCase().indexOf(q.toLowerCase()) > -1));
  const uncat = events.filter((e) => !e.entity).length;
  const total = events.length + unregistered.length;

  const cell: React.CSSProperties = { padding: '10px 13px', verticalAlign: 'middle', fontSize: 13 };
  const seln: React.CSSProperties = {
    border: `1px solid ${T.line}`, borderRadius: 7, padding: '6px 8px', fontSize: 12.5, color: T.ink,
    background: T.surface, cursor: 'pointer', maxWidth: 170, width: '100%'
  };

  const toggle = (id: number): void => setSel((s) => (s.indexOf(id) > -1 ? s.filter((x) => x !== id) : [...s, id]));
  const allSel = rows.length > 0 && rows.every((r) => sel.indexOf(r.id) > -1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: T.muted }}>
          <Library size={16} style={{ color: T.brand }} /> {total} libraries · {events.length} tracked · {unregistered.length} not added
          {unregistered.length ? <> (<button className="jes-link" onClick={onAdd} style={{ ...linkBtn, display: 'inline' }}>add</button>)</> : undefined}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.ghost }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" style={{ ...input, padding: '8px 10px 8px 30px', width: 160, background: T.canvas }} />
          </div>
          <button
            className="jes-ghost"
            style={{ ...btnGhost, borderColor: onlyUncat ? T.brand : T.line, color: onlyUncat ? T.ink : T.muted }}
            onClick={() => setOnlyUncat((v) => !v)}
          ><Filter size={14} /> Uncategorized</button>
        </div>
      </div>

      {sel.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '10px 15px', background: T.brand, borderRadius: 11, color: '#fff', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{sel.length} selected</span>
          <span style={{ fontSize: 12.5, opacity: 0.85 }}>Set section</span>
          <select
            onChange={(e) => { if (e.target.value) { bulkSetSection(sel, e.target.value); setSel([]); } }}
            defaultValue="" style={{ ...seln, maxWidth: 190, color: T.ink }}
          >
            <option value="" disabled>Choose…</option>
            {ENTITY_NAMES.map((n) => <option key={n}>{n}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button className="jes-link" onClick={() => setSel([])} style={{ ...linkBtn, color: '#fff' }}>Clear</button>
        </div>
      )}

      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
            <thead>
              <tr style={{ background: T.canvas, color: T.faint }}>
                <th style={{ ...cell, width: 38 }}>
                  <input
                    type="checkbox" checked={allSel} aria-label="Select all"
                    onChange={() => setSel(allSel ? [] : rows.map((r) => r.id))}
                  />
                </th>
                {['Event', 'Section', 'Category', 'Subcategory', 'Date', 'Status', ''].map((h, i) => (
                  <th key={i} style={{ ...cell, textAlign: 'left', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const un = !e.entity;
                const cats = e.entity && taxonomy[e.entity] ? Object.keys(taxonomy[e.entity]) : [];
                const subs = e.entity && e.cat && taxonomy[e.entity] && taxonomy[e.entity][e.cat] ? taxonomy[e.entity][e.cat] : [];
                return (
                  <tr key={e.id} style={{ borderTop: `1px solid ${T.lineSoft}`, background: sel.indexOf(e.id) > -1 ? T.hair : un ? '#FCF8EF' : T.surface }}>
                    <td style={cell}>
                      <input type="checkbox" checked={sel.indexOf(e.id) > -1} onChange={() => toggle(e.id)} aria-label={`Select ${e.name}`} />
                    </td>
                    <td style={cell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {un ? <AlertCircle size={14} style={{ color: STATUS.Planning.color, flexShrink: 0 }} /> : <Dot e={e.entity} />}
                        <button onClick={() => onOpen(e)} className="jes-link" style={{ ...linkBtn, fontWeight: 600, color: T.ink }}>{e.name}</button>
                      </div>
                    </td>
                    <td style={cell}>
                      <select
                        value={e.entity} onChange={(ev) => setCategorization(e, ev.target.value, '', '')}
                        style={{ ...seln, borderColor: un ? STATUS.Planning.color : T.line }}
                      >
                        <option value="">— assign —</option>
                        {ENTITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td style={cell}>
                      {cats.length
                        ? (
                          <select value={e.cat} onChange={(ev) => setCategorization(e, e.entity, ev.target.value, '')} style={seln}>
                            <option value="">— none —</option>
                            {cats.map((c) => <option key={c}>{c}</option>)}
                          </select>
                        )
                        : <span style={{ color: T.ghost, fontSize: 12 }}>{e.entity ? 'direct' : '—'}</span>}
                    </td>
                    <td style={cell}>
                      {subs.length
                        ? (
                          <select value={e.sub} onChange={(ev) => setCategorization(e, e.entity, e.cat, ev.target.value)} style={seln}>
                            <option value="">— none —</option>
                            {subs.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        )
                        : <span style={{ color: T.ghost, fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ ...cell, color: T.muted, whiteSpace: 'nowrap' }}>{fmtShort(e.date) || '—'}</td>
                    <td style={cell}>
                      <select value={e.status} onChange={(ev) => setStatus(e, ev.target.value)} style={{ ...seln, maxWidth: 130 }}>
                        {STATUS_NAMES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={cell}>
                      <a
                        href={libUrl(siteUrl, e.libraryUrl, e.name)} target="_blank" rel="noreferrer" className="jes-icon"
                        title="Open library" style={{ ...btnIcon, display: 'inline-grid' }}
                      ><ExternalLink size={15} /></a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {uncat > 0 && !onlyUncat && (
        <p style={{ fontSize: 12.5, color: T.muted, marginTop: 12 }}>Rows shaded amber are events with no section assigned yet. Assign a section and they appear in Browse.</p>
      )}
    </div>
  );
};
