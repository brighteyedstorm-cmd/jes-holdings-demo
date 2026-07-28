import * as React from 'react';
import { Check, Circle, Eye, Pencil, Save, Trash2, X } from 'lucide-react';

import { T } from '../model/constants';
import { ITask, ITemplate } from '../model/types';
import { btnGhost, btnIcon, btnPrimary, input, lblStyle, serif } from './styles';

export interface ITemplateModalProps {
  templates: ITemplate[];
  phases: string[];
  current: ITask[];
  onClose: () => void;
  onUse: (t: ITemplate) => void;
  onSaveCurrent: (name: string) => void;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export const TemplateModal = (props: ITemplateModalProps): JSX.Element => {
  const { templates, phases, current, onClose, onUse, onSaveCurrent, onRename, onDelete } = props;
  const [selId, setSelId] = React.useState<number>(templates.length ? templates[0].id : 0);
  const [saving, setSaving] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [renameId, setRenameId] = React.useState<number>(0);
  const [renameVal, setRenameVal] = React.useState('');

  const sel = templates.filter((t) => t.id === selId)[0] || templates[0];

  const orderedPhases = (): string[] => {
    if (!sel) return [];
    const inPhases = phases.filter((ph) => sel.tasks.filter((t) => t.phase === ph).length > 0);
    const extra: string[] = [];
    sel.tasks.forEach((t) => {
      if (phases.indexOf(t.phase) === -1 && extra.indexOf(t.phase) === -1) extra.push(t.phase);
    });
    return [...inPhases, ...extra];
  };

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(26,33,31,.4)', backdropFilter: 'blur(2px)' }} />
      <div className="jes-modal" style={{ position: 'relative', width: 'min(760px,100%)', height: 'min(540px,92%)', background: T.surface, borderRadius: 18, boxShadow: '0 30px 70px rgba(26,33,31,.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '17px 22px', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={serif(19)}>Checklist templates</h2>
          <button className="jes-icon" onClick={onClose} aria-label="Close" style={btnIcon}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ width: 244, borderRight: `1px solid ${T.lineSoft}`, overflowY: 'auto', padding: 10, flexShrink: 0 }}>
            {templates.map((t) => (
              <div
                key={t.id} onClick={() => setSelId(t.id)} className="jes-opt"
                style={{ padding: '10px 11px', borderRadius: 10, cursor: 'pointer', marginBottom: 4, background: t.id === selId ? T.canvas : 'transparent' }}
              >
                {renameId === t.id
                  ? (
                    <input
                      autoFocus value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { onRename(t.id, renameVal.trim() || t.name); setRenameId(0); }
                        if (e.key === 'Escape') setRenameId(0);
                      }}
                      onBlur={() => { onRename(t.id, renameVal.trim() || t.name); setRenameId(0); }}
                      style={{ ...input, padding: '4px 6px', fontSize: 13, width: '100%' }}
                    />
                  )
                  : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                        <span style={{ fontSize: 10, color: T.faint, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.4 }}>{t.builtin ? 'preset' : 'custom'}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}>{t.tasks.length} tasks</div>
                    </>
                  )}
              </div>
            ))}
            <button
              className="jes-ghost" onClick={() => { setSaving(true); setSaveName(''); }} disabled={!current.length}
              style={{ ...btnGhost, width: '100%', justifyContent: 'center', marginTop: 8, opacity: current.length ? 1 : 0.5, cursor: current.length ? 'pointer' : 'not-allowed' }}
            ><Save size={14} /> Save current as template</button>
            {saving && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <input
                  autoFocus value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Template name"
                  onKeyDown={(e) => { if (e.key === 'Enter' && saveName.trim()) { onSaveCurrent(saveName.trim()); setSaving(false); } }}
                  style={{ ...input, flex: 1, padding: '6px 8px', fontSize: 12.5 }}
                />
                <button className="jes-primary" style={{ ...btnPrimary, padding: '6px 10px' }} onClick={() => { if (saveName.trim()) { onSaveCurrent(saveName.trim()); setSaving(false); } }}><Check size={14} /></button>
              </div>
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ padding: '15px 20px', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Eye size={15} style={{ color: T.faint }} />
                <span style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{sel ? sel.name : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {sel && !sel.builtin && (
                  <>
                    <button className="jes-icon" title="Rename" onClick={() => { setRenameId(sel.id); setRenameVal(sel.name); }} style={btnIcon}><Pencil size={15} /></button>
                    <button className="jes-icon" title="Delete" onClick={() => onDelete(sel.id)} style={btnIcon}><Trash2 size={15} /></button>
                  </>
                )}
                <button className="jes-primary" style={{ ...btnPrimary, padding: '8px 14px' }} onClick={() => { if (sel) onUse(sel); }}>Add to checklist</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
              {orderedPhases().map((ph) => (
                <div key={ph} style={{ marginBottom: 14 }}>
                  <div style={{ ...lblStyle, marginBottom: 7 }}>{ph}</div>
                  {sel.tasks.filter((t) => t.phase === ph).map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 13.5, color: T.ink }}>
                      <Circle size={14} style={{ color: T.line }} />{t.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
