import { CSSProperties } from 'react';
import { T } from '../model/constants';

/* The prototype's shared style objects, value for value. */

export const serifRaw: CSSProperties = { fontFamily: "'Lora',Georgia,serif" };

export const serif = (size: number): CSSProperties => ({
  fontFamily: "'Lora',Georgia,serif", fontSize: size, fontWeight: 600, color: T.ink, margin: 0
});

export const lblStyle: CSSProperties = {
  fontSize: 10.5, color: T.faint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.55
};

export const input: CSSProperties = {
  padding: '9px 11px', borderRadius: 9, border: `1px solid ${T.line}`, fontSize: 13.5,
  color: T.ink, background: T.surface, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit'
};

export const btnPrimary: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 7, background: T.brand, color: '#fff', border: 'none',
  borderRadius: 10, padding: '9px 16px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', whiteSpace: 'nowrap'
};

export const btnGhost: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: T.surface, color: T.muted,
  border: `1px solid ${T.line}`, borderRadius: 10, padding: '8px 13px', fontWeight: 600, fontSize: 12.5,
  cursor: 'pointer', whiteSpace: 'nowrap'
};

export const btnIcon: CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer', color: T.faint, padding: 5,
  borderRadius: 8, display: 'grid', placeItems: 'center', textDecoration: 'none'
};

export const miniBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5, background: T.canvas, color: T.muted,
  border: `1px solid ${T.line}`, borderRadius: 8, padding: '5px 10px', fontWeight: 600, fontSize: 11.5, cursor: 'pointer'
};

export const rowAction: CSSProperties = {
  opacity: 0.35, background: 'none', border: 'none', cursor: 'pointer', color: T.faint, padding: 3
};

export const linkBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
  cursor: 'pointer', color: T.muted, fontWeight: 600, fontSize: 12.5, padding: 0
};

export const panel: CSSProperties = {
  background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, overflow: 'hidden'
};

export const panelHead: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px'
};

export const chip: CSSProperties = {
  fontSize: 12, color: T.ink, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 8,
  padding: '5px 10px', cursor: 'pointer', fontWeight: 500
};

export const kbd: CSSProperties = {
  fontSize: 10.5, fontWeight: 700, color: T.faint, background: T.surface, border: `1px solid ${T.line}`,
  borderRadius: 6, padding: '2px 6px', fontFamily: 'ui-monospace,Menlo,monospace'
};

export const scrim: CSSProperties = {
  position: 'absolute', top: 0, right: 0, bottom: 0, left: 0
};
