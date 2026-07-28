import * as React from 'react';
import { IPeoplePickerContext, PeoplePicker, PrincipalType } from '@pnp/spfx-controls-react/lib/PeoplePicker';

import { IPerson } from '../model/types';

/**
 * The tenant directory control on its own, so it can be split into its own
 * chunk. It brings Fluent with it, which is most of the download, and nothing
 * needs it until someone actually opens an assignee field.
 */

export interface ITenantPickerProps {
  pickerContext: IPeoplePickerContext;
  onPick: (person: IPerson) => void;
}

interface IPickedUser {
  id?: string;
  loginName?: string;
  text?: string;
  secondaryText?: string;
}

const TenantPicker = (props: ITenantPickerProps): JSX.Element => {
  const { pickerContext, onPick } = props;

  const handleChange = (items: IPickedUser[]): void => {
    if (!items || !items.length) return;
    const picked = items[0];
    const id = Number(picked.id);
    if (!id || isNaN(id)) return;
    onPick({
      id,
      title: picked.text || '',
      email: picked.secondaryText || '',
      loginName: picked.loginName || ''
    });
  };

  return (
    <PeoplePicker
      context={pickerContext}
      personSelectionLimit={1}
      principalTypes={[PrincipalType.User]}
      resolveDelay={300}
      searchTextLimit={2}
      ensureUser={true}
      showtooltip={false}
      showHiddenInUI={false}
      placeholder="Search people…"
      defaultSelectedUsers={[]}
      onChange={handleChange as (items: unknown[]) => void}
    />
  );
};

export default TenantPicker;
