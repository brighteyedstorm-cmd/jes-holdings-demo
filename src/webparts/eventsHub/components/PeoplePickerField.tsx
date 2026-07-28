import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { IPeoplePickerContext } from '@pnp/spfx-controls-react/lib/PeoplePicker';
import { WebPartContext } from '@microsoft/sp-webpart-base';

import { T } from '../model/constants';
import { IPerson } from '../model/types';
import { input } from './styles';
import { Avatar } from './primitives';
import { ITenantPickerProps } from './TenantPicker';

export interface IPeoplePickerFieldProps {
  context: WebPartContext;
  value: IPerson | undefined;
  onChange: (person: IPerson | undefined) => void;
  direction?: 'up' | 'down';
  small?: boolean;
  /** Kept for the "by person" scope in Tasks, where nothing is assigned yet. */
  placeholder?: string;
}

type PickerComponent = React.ComponentType<ITenantPickerProps>;

let loadedPicker: PickerComponent | undefined;

/**
 * The prototype's compact assignee control, driven by the tenant directory.
 * Selection is single, the whole organization is searched, and clearing the
 * field leaves the task unassigned. The current user is never the default.
 *
 * The directory control itself arrives in its own chunk the first time a field
 * is opened, so it stays out of the hub's initial download.
 */
export const PeoplePickerField = (props: IPeoplePickerFieldProps): JSX.Element => {
  const { context, value, onChange, direction = 'down', small, placeholder = 'Assign to…' } = props;
  const [open, setOpen] = React.useState(false);
  const [Picker, setPicker] = React.useState<PickerComponent | undefined>(() => loadedPicker);
  const [pickerFailed, setPickerFailed] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const handler = (e: MouseEvent): void => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  React.useEffect(() => {
    if (!open || Picker) return undefined;
    let cancelled = false;
    import(/* webpackChunkName: 'tenant-picker' */ './TenantPicker')
      .then((mod) => {
        loadedPicker = mod.default;
        // Wrapped, because React would otherwise call the component as an updater.
        if (!cancelled) setPicker(() => mod.default);
      })
      .catch(() => { if (!cancelled) setPickerFailed(true); });
    return () => { cancelled = true; };
  }, [open, Picker]);

  const pad = small ? '6px 9px' : '9px 11px';

  const pickerContext: IPeoplePickerContext = {
    absoluteUrl: context.pageContext.web.absoluteUrl,
    msGraphClientFactory: context.msGraphClientFactory,
    spHttpClient: context.spHttpClient
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button" onClick={() => setOpen((o) => !o)}
        style={{ ...input, padding: pad, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
          {value
            ? <><Avatar name={value.title} size={small ? 18 : 20} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: small ? 12.5 : 13 }}>{value.title}</span></>
            : <span style={{ color: T.ghost, fontSize: small ? 12.5 : 13 }}>{placeholder}</span>}
        </span>
        <ChevronDown size={14} style={{ color: T.ghost, flexShrink: 0 }} />
      </button>
      {open && (
        <div
          className="jes-pop"
          style={{
            position: 'absolute', left: 0, right: 0, minWidth: 240,
            [direction === 'up' ? 'bottom' : 'top']: 'calc(100% + 5px)',
            background: T.surface, border: `1px solid ${T.line}`, borderRadius: 11,
            boxShadow: '0 16px 40px rgba(26,33,31,.16)', zIndex: 95, overflow: 'visible'
          }}
        >
          <div className="jes-pp" style={{ padding: 8, borderBottom: `1px solid ${T.lineSoft}` }}>
            {Picker && <Picker pickerContext={pickerContext} onPick={(person) => { onChange(person); setOpen(false); }} />}
            {!Picker && !pickerFailed && <div style={{ padding: '7px 4px', fontSize: 12.5, color: T.faint }}>Loading the directory…</div>}
            {!Picker && pickerFailed && (
              <button
                type="button" onClick={() => { setPickerFailed(false); }}
                style={{ padding: '7px 4px', fontSize: 12.5, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >Could not load the directory. Try again.</button>
            )}
          </div>
          <div style={{ padding: 6 }}>
            <button
              className="jes-opt" type="button"
              onClick={() => { onChange(undefined); setOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: T.muted }}
            >Unassigned</button>
          </div>
        </div>
      )}
    </div>
  );
};
