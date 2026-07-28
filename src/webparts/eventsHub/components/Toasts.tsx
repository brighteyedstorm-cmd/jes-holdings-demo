import * as React from 'react';
import { AlertCircle, CircleCheck } from 'lucide-react';

import { ALERT, T } from '../model/constants';

export interface IToast {
  id: number;
  msg: string;
  error?: boolean;
}

/** One toast per write. Failures keep the same shape in the alert color. */
export const Toasts = ({ items }: { items: IToast[] }): JSX.Element => (
  <div style={{ position: 'absolute', right: 18, bottom: 18, zIndex: 120, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
    {items.map((t) => (
      <div
        key={t.id} className="jes-toast" role="status"
        style={{ display: 'flex', alignItems: 'center', gap: 9, background: t.error ? ALERT : T.brand, color: '#fff', padding: '10px 15px', borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: '0 12px 32px rgba(26,33,31,.28)', maxWidth: 320 }}
      >
        {t.error
          ? <AlertCircle size={15} style={{ flexShrink: 0, opacity: 0.9 }} />
          : <CircleCheck size={15} style={{ flexShrink: 0, opacity: 0.9 }} />}
        {t.msg}
      </div>
    ))}
  </div>
);
