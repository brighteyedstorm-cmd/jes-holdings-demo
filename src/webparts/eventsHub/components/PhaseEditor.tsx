import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { T } from '../model/constants';
import { btnGhost, btnIcon, input, lblStyle } from './styles';

export interface IPhaseEditorProps {
  phases: string[];
  addPhase: (name: string) => void;
  renamePhase: (from: string, to: string) => void;
  removePhase: (name: string) => void;
}

export const PhaseEditor = (props: IPhaseEditorProps): JSX.Element => {
  const { phases, addPhase, renamePhase, removePhase } = props;
  const [val, setVal] = React.useState('');
  return (
    <div style={{ marginTop: 10, padding: '12px 14px', background: T.canvas, borderRadius: 12, border: `1px solid ${T.line}` }}>
      <div style={{ ...lblStyle, marginBottom: 9 }}>Checklist phases</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {phases.map((p) => (
          <div key={p} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              defaultValue={p}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== p) renamePhase(p, v); else e.target.value = p; }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              style={{ ...input, flex: 1, padding: '6px 9px', fontSize: 12.5 }}
            />
            <button
              className="jes-icon" onClick={() => removePhase(p)} aria-label="Remove phase"
              style={{ ...btnIcon, opacity: phases.length > 1 ? 1 : 0.4, pointerEvents: phases.length > 1 ? 'auto' : 'none' }}
            ><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
        <input
          value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && val.trim()) { addPhase(val.trim()); setVal(''); } }}
          placeholder="Add a phase" style={{ ...input, flex: 1, padding: '6px 9px', fontSize: 12.5 }}
        />
        <button className="jes-ghost" style={{ ...btnGhost, padding: '6px 11px' }} onClick={() => { if (val.trim()) { addPhase(val.trim()); setVal(''); } }}><Plus size={14} /></button>
      </div>
    </div>
  );
};
