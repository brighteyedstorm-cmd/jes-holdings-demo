import * as React from 'react';
import { Plus, Trash2, X } from 'lucide-react';

import { ENTITY_NAMES, T, entMeta } from '../model/constants';
import { ITaxonomy } from '../model/types';
import { btnGhost, btnIcon, input, serif } from './styles';

export interface ITaxonomyViewProps {
  taxonomy: ITaxonomy;
  addCategory: (section: string, name: string) => void;
  renameCategory: (section: string, from: string, to: string) => void;
  removeCategory: (section: string, name: string) => void;
  addSub: (section: string, cat: string, name: string) => void;
  renameSub: (section: string, cat: string, from: string, to: string) => void;
  removeSub: (section: string, cat: string, name: string) => void;
}

const CatAdd = ({ onAdd }: { onAdd: (v: string) => void }): JSX.Element => {
  const [v, setV] = React.useState('');
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
      <input
        value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onAdd(v.trim()); setV(''); } }}
        placeholder="Add category" style={{ ...input, flex: 1, padding: '7px 9px', fontSize: 12.5 }}
      />
      <button className="jes-ghost" style={{ ...btnGhost, padding: '7px 11px' }} onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(''); } }}><Plus size={14} /></button>
    </div>
  );
};

const SubAdd = ({ onAdd }: { onAdd: (v: string) => void }): JSX.Element => {
  const [v, setV] = React.useState('');
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <input
        value={v} onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onAdd(v.trim()); setV(''); } }}
        placeholder="+ subcategory"
        style={{ border: `1px dashed ${T.line}`, background: 'transparent', borderRadius: 8, padding: '3px 9px', fontSize: 12, color: T.ink, width: 108, outline: 'none' }}
      />
    </span>
  );
};

export const TaxonomyView = (props: ITaxonomyViewProps): JSX.Element => {
  const { taxonomy, addCategory, renameCategory, removeCategory, addSub, renameSub, removeSub } = props;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,320px),1fr))', gap: 16, alignItems: 'start' }}>
      {ENTITY_NAMES.map((section) => {
        const cats = taxonomy[section] || {};
        const catNames = Object.keys(cats);
        return (
          <div key={section} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '13px 16px', borderBottom: `1px solid ${T.lineSoft}` }}>
              <span style={{ width: 11, height: 11, borderRadius: 3, background: entMeta(section).color }} />
              <span style={{ ...serif(15.5) }}>{section}</span>
            </div>
            <div style={{ padding: '11px 15px 15px' }}>
              {!catNames.length && <p style={{ fontSize: 12, color: T.faint, margin: '4px 0 11px' }}>No categories. Events sit directly under this section.</p>}
              {catNames.map((cat) => (
                <div key={cat} style={{ marginBottom: 13, paddingBottom: 11, borderBottom: `1px solid ${T.lineSoft}` }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      defaultValue={cat}
                      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== cat) renameCategory(section, cat, v); else e.target.value = cat; }}
                      style={{ ...input, flex: 1, padding: '7px 9px', fontWeight: 600 }}
                    />
                    <button className="jes-icon" onClick={() => removeCategory(section, cat)} aria-label="Remove category" style={btnIcon}><Trash2 size={15} /></button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9, paddingLeft: 4 }}>
                    {cats[cat].map((s) => (
                      <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 8, padding: '3px 4px 3px 9px', fontSize: 12 }}>
                        <input
                          defaultValue={s}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s) renameSub(section, cat, s, v); else e.target.value = s; }}
                          style={{ border: 'none', background: 'transparent', fontSize: 12, color: T.ink, width: Math.max(46, s.length * 7), outline: 'none' }}
                        />
                        <button className="jes-icon" onClick={() => removeSub(section, cat, s)} aria-label="Remove subcategory" style={{ ...btnIcon, padding: 2 }}><X size={12} /></button>
                      </span>
                    ))}
                    <SubAdd onAdd={(v) => addSub(section, cat, v)} />
                  </div>
                </div>
              ))}
              <CatAdd onAdd={(v) => addCategory(section, v)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
