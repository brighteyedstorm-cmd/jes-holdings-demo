import { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPFI, spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import '@pnp/sp/folders';
import '@pnp/sp/views';
import '@pnp/sp/site-users/web';
import { IList } from '@pnp/sp/lists';
import { DateTimeFieldFormatType, FieldUserSelectionMode } from '@pnp/sp/fields';

import {
  ENTITY_NAMES, LISTS, PROPERTY_BAG_KEYS, SEED_PHASES, SEED_TEMPLATES, STATUS_NAMES, SYSTEM_LIBRARIES
} from '../model/constants';
import {
  ICategory, IEventItem, IHubData, ILibrary, INewEvent, IPerson, IPhase, ISubcategory, ITask, ITemplate, ITemplateTask
} from '../model/types';

/** Dates are calendar dates. They are stored anchored at midday UTC so the
 *  calendar day survives a round trip through any US time zone. */
const toSpDate = (iso: string): string | undefined => (iso ? `${iso}T12:00:00Z` : undefined);
const fromSpDate = (value: string | undefined): string => (value ? value.substring(0, 10) : '');

interface IRawPerson { Id: number; Title?: string; EMail?: string; Name?: string; }

const toPerson = (raw: IRawPerson | undefined): IPerson | undefined => {
  if (!raw || !raw.Id) return undefined;
  return { id: raw.Id, title: raw.Title || '', email: raw.EMail || '', loginName: raw.Name || '' };
};

export class HubService {
  private sp: SPFI;
  public readonly siteUrl: string;

  constructor(context: WebPartContext) {
    this.sp = spfi().using(SPFx(context));
    this.siteUrl = context.pageContext.web.absoluteUrl;
  }

  /* ================================================================ */
  /*  Provisioning                                                    */
  /* ================================================================ */

  /** Creates any missing list, field, or seed row. Safe to run on every load. */
  public async ensureLists(): Promise<void> {
    const registry = await this.ensureList(LISTS.registry, 'Events tracked by the JES Events and Engagement hub. One row per adopted document library.');
    const phases = await this.ensureList(LISTS.phases, 'The phases a checklist is grouped by.');
    const templates = await this.ensureList(LISTS.templates, 'Reusable checklists.');
    const categories = await this.ensureList(LISTS.categories, 'Categories within a section.');
    const subcategories = await this.ensureList(LISTS.subcategories, 'Subcategories within a category.');
    await this.ensureList(LISTS.tasks, 'Checklist items for the tracked events.');

    await this.ensureFields(LISTS.phases, [
      { name: 'SortOrder', add: (l) => l.fields.addNumber('SortOrder', { MinimumValue: 0 }) }
    ]);

    await this.ensureFields(LISTS.categories, [
      { name: 'Section', add: (l) => l.fields.addChoice('Section', { Choices: ENTITY_NAMES, FillInChoice: false }) },
      { name: 'SortOrder', add: (l) => l.fields.addNumber('SortOrder', { MinimumValue: 0 }) }
    ]);

    await this.ensureFields(LISTS.subcategories, [
      { name: 'Category', add: (l) => l.fields.addLookup('Category', { LookupListId: categories.id, LookupFieldName: 'Title' }) },
      { name: 'SortOrder', add: (l) => l.fields.addNumber('SortOrder', { MinimumValue: 0 }) }
    ]);

    await this.ensureFields(LISTS.templates, [
      { name: 'IsBuiltin', add: (l) => l.fields.addBoolean('IsBuiltin') },
      { name: 'TasksJson', add: (l) => l.fields.addMultilineText('TasksJson', { NumberOfLines: 10, RichText: false, RestrictedMode: true, AppendOnly: false }) }
    ]);

    await this.ensureFields(LISTS.registry, [
      { name: 'LibraryId', add: (l) => l.fields.addText('LibraryId', { MaxLength: 255 }) },
      { name: 'LibraryServerRelativeUrl', add: (l) => l.fields.addText('LibraryServerRelativeUrl', { MaxLength: 255 }) },
      { name: 'Section', add: (l) => l.fields.addChoice('Section', { Choices: ENTITY_NAMES, FillInChoice: false }) },
      { name: 'Category', add: (l) => l.fields.addLookup('Category', { LookupListId: categories.id, LookupFieldName: 'Title' }) },
      { name: 'Subcategory', add: (l) => l.fields.addLookup('Subcategory', { LookupListId: subcategories.id, LookupFieldName: 'Title' }) },
      { name: 'Status', add: (l) => l.fields.addChoice('Status', { Choices: STATUS_NAMES, FillInChoice: false }) },
      { name: 'EventDate', add: (l) => l.fields.addDateTime('EventDate', { DisplayFormat: DateTimeFieldFormatType.DateOnly }) },
      { name: 'EventTime', add: (l) => l.fields.addText('EventTime', { MaxLength: 64 }) },
      { name: 'Venue', add: (l) => l.fields.addText('Venue', { MaxLength: 255 }) }
    ]);

    await this.ensureFields(LISTS.tasks, [
      { name: 'Event', add: (l) => l.fields.addLookup('Event', { LookupListId: registry.id, LookupFieldName: 'Title' }) },
      { name: 'Phase', add: (l) => l.fields.addLookup('Phase', { LookupListId: phases.id, LookupFieldName: 'Title' }) },
      { name: 'AssignedTo', add: (l) => l.fields.addUser('AssignedTo', { SelectionMode: FieldUserSelectionMode.PeopleOnly }) },
      { name: 'DueDate', add: (l) => l.fields.addDateTime('DueDate', { DisplayFormat: DateTimeFieldFormatType.DateOnly }) },
      { name: 'Completed', add: (l) => l.fields.addBoolean('Completed') }
    ]);

    await this.seedPhases();
    await this.seedTemplates(templates.title);
  }

  /** Reads the list, creating it only when it is not there yet.
   *  lists.ensure would answer a MERGE response for a list that already
   *  exists, which carries no Id, and the lookup fields need real ids. */
  private async ensureList(title: string, description: string): Promise<{ id: string; title: string }> {
    try {
      const info: { Id: string; Title: string } = await this.sp.web.lists.getByTitle(title).select('Id', 'Title')();
      if (info && info.Id) return { id: info.Id, title: info.Title };
    } catch {
      // Not there yet, so fall through and create it.
    }
    const created = await this.sp.web.lists.add(title, description, 100, false, { EnableAttachments: false });
    const data = (created as unknown as { Id?: string; Title?: string; data?: { Id: string; Title: string } });
    if (data.Id) return { id: data.Id, title: data.Title as string };
    if (data.data) return { id: data.data.Id, title: data.data.Title };
    const info: { Id: string; Title: string } = await this.sp.web.lists.getByTitle(title).select('Id', 'Title')();
    return { id: info.Id, title: info.Title };
  }

  private async ensureFields(
    listTitle: string,
    specs: { name: string; add: (list: IList) => Promise<unknown> }[]
  ): Promise<void> {
    const list = this.sp.web.lists.getByTitle(listTitle);
    const existing: { InternalName: string }[] = await list.fields.select('InternalName')();
    const have: { [name: string]: boolean } = {};
    existing.forEach((f) => { have[f.InternalName] = true; });

    for (const spec of specs) {
      if (have[spec.name]) continue;
      await spec.add(list);
      try {
        await list.defaultView.fields.add(spec.name);
      } catch {
        // A field that will not sit on the default view is not worth failing over.
      }
    }
  }

  private async seedPhases(): Promise<void> {
    const list = this.sp.web.lists.getByTitle(LISTS.phases);
    const items: { Title: string }[] = await list.items.select('Title').top(500)();
    const have: { [title: string]: boolean } = {};
    items.forEach((i) => { have[i.Title] = true; });
    for (let i = 0; i < SEED_PHASES.length; i++) {
      if (have[SEED_PHASES[i]]) continue;
      await list.items.add({ Title: SEED_PHASES[i], SortOrder: i + 1 });
    }
  }

  private async seedTemplates(listTitle: string): Promise<void> {
    const list = this.sp.web.lists.getByTitle(listTitle);
    const items: { Title: string }[] = await list.items.select('Title').top(500)();
    const have: { [title: string]: boolean } = {};
    items.forEach((i) => { have[i.Title] = true; });
    for (const seed of SEED_TEMPLATES) {
      if (have[seed.name]) continue;
      await list.items.add({ Title: seed.name, IsBuiltin: true, TasksJson: JSON.stringify(seed.tasks) });
    }
  }

  /* ================================================================ */
  /*  Reading                                                         */
  /* ================================================================ */

  public async load(): Promise<IHubData> {
    const [phases, categories, subcategories, templates, rawEvents, rawTasks] = await Promise.all([
      this.loadPhases(),
      this.loadCategories(),
      this.loadSubcategories(),
      this.loadTemplates(),
      this.loadRegistry(),
      this.loadTasks()
    ]);

    const byEvent: { [eventId: number]: ITask[] } = {};
    rawTasks.forEach((row) => {
      if (!row.eventId) return;
      if (!byEvent[row.eventId]) byEvent[row.eventId] = [];
      byEvent[row.eventId].push(row.task);
    });

    const events: IEventItem[] = rawEvents.map((e) => ({ ...e, tasks: byEvent[e.id] || [] }));
    const libraries = await this.discoverLibraries(events);

    return { events, libraries, phases, categories, subcategories, templates };
  }

  private async loadPhases(): Promise<IPhase[]> {
    const items: { Id: number; Title: string; SortOrder?: number }[] =
      await this.sp.web.lists.getByTitle(LISTS.phases).items.select('Id', 'Title', 'SortOrder').top(500)();
    return items
      .map((i) => ({ id: i.Id, title: i.Title, sortOrder: i.SortOrder || 0 }))
      .sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id));
  }

  private async loadCategories(): Promise<ICategory[]> {
    const items: { Id: number; Title: string; Section?: string; SortOrder?: number }[] =
      await this.sp.web.lists.getByTitle(LISTS.categories).items.select('Id', 'Title', 'Section', 'SortOrder').top(2000)();
    return items.map((i) => ({ id: i.Id, title: i.Title, section: i.Section || '', sortOrder: i.SortOrder || 0 }));
  }

  private async loadSubcategories(): Promise<ISubcategory[]> {
    const items: { Id: number; Title: string; CategoryId?: number; SortOrder?: number }[] =
      await this.sp.web.lists.getByTitle(LISTS.subcategories).items.select('Id', 'Title', 'CategoryId', 'SortOrder').top(4000)();
    return items.map((i) => ({ id: i.Id, title: i.Title, categoryId: i.CategoryId || 0, sortOrder: i.SortOrder || 0 }));
  }

  private async loadTemplates(): Promise<ITemplate[]> {
    const items: { Id: number; Title: string; IsBuiltin?: boolean; TasksJson?: string }[] =
      await this.sp.web.lists.getByTitle(LISTS.templates).items.select('Id', 'Title', 'IsBuiltin', 'TasksJson').top(500)();
    return items.map((i) => {
      let tasks: ITemplateTask[] = [];
      try {
        const parsed = JSON.parse(i.TasksJson || '[]');
        if (Array.isArray(parsed)) tasks = parsed as ITemplateTask[];
      } catch {
        tasks = [];
      }
      return { id: i.Id, name: i.Title, builtin: !!i.IsBuiltin, tasks };
    }).sort((a, b) => (a.builtin === b.builtin ? a.name.localeCompare(b.name) : (a.builtin ? -1 : 1)));
  }

  private async loadRegistry(): Promise<IEventItem[]> {
    interface IRow {
      Id: number; Title: string; LibraryId?: string; LibraryServerRelativeUrl?: string;
      Section?: string; Status?: string; EventDate?: string; EventTime?: string; Venue?: string;
      Category?: { Id: number; Title: string }; Subcategory?: { Id: number; Title: string };
    }
    const items: IRow[] = await this.sp.web.lists.getByTitle(LISTS.registry).items
      .select('Id', 'Title', 'LibraryId', 'LibraryServerRelativeUrl', 'Section', 'Status', 'EventDate', 'EventTime', 'Venue',
        'Category/Id', 'Category/Title', 'Subcategory/Id', 'Subcategory/Title')
      .expand('Category', 'Subcategory')
      .top(5000)();

    return items.map((i) => ({
      id: i.Id,
      name: i.Title,
      libraryId: (i.LibraryId || '').toLowerCase(),
      libraryUrl: i.LibraryServerRelativeUrl || '',
      entity: i.Section || '',
      cat: i.Category && i.Category.Title ? i.Category.Title : '',
      sub: i.Subcategory && i.Subcategory.Title ? i.Subcategory.Title : '',
      catId: i.Category && i.Category.Id ? i.Category.Id : 0,
      subId: i.Subcategory && i.Subcategory.Id ? i.Subcategory.Id : 0,
      status: i.Status || 'Planning',
      date: fromSpDate(i.EventDate),
      time: i.EventTime || '',
      venue: i.Venue || '',
      tasks: []
    }));
  }

  private async loadTasks(): Promise<{ eventId: number; task: ITask }[]> {
    interface IRow {
      Id: number; Title: string; Completed?: boolean; DueDate?: string;
      Event?: { Id: number }; Phase?: { Id: number; Title: string }; AssignedTo?: IRawPerson;
    }
    const items: IRow[] = await this.sp.web.lists.getByTitle(LISTS.tasks).items
      .select('Id', 'Title', 'Completed', 'DueDate', 'Event/Id', 'Phase/Id', 'Phase/Title',
        'AssignedTo/Id', 'AssignedTo/Title', 'AssignedTo/EMail', 'AssignedTo/Name')
      .expand('Event', 'Phase', 'AssignedTo')
      .top(5000)();

    return items.map((i) => ({
      eventId: i.Event && i.Event.Id ? i.Event.Id : 0,
      task: {
        id: i.Id,
        text: i.Title,
        phase: i.Phase && i.Phase.Title ? i.Phase.Title : '',
        done: !!i.Completed,
        due: fromSpDate(i.DueDate),
        who: toPerson(i.AssignedTo)
      }
    }));
  }

  /* ================================================================ */
  /*  Library discovery                                               */
  /* ================================================================ */

  /** Every document library on the site that is not already a tracked event. */
  private async discoverLibraries(events: IEventItem[]): Promise<ILibrary[]> {
    interface IRow { Id: string; Title: string; RootFolder?: { ServerRelativeUrl: string }; }
    const lists: IRow[] = await this.sp.web.lists
      .filter('BaseTemplate eq 101 and Hidden eq false')
      .select('Id', 'Title', 'RootFolder/ServerRelativeUrl')
      .expand('RootFolder')
      .top(500)();

    const tracked: { [libraryId: string]: boolean } = {};
    const trackedNames: { [name: string]: boolean } = {};
    events.forEach((e) => {
      if (e.libraryId) tracked[e.libraryId] = true;
      trackedNames[e.name.toLowerCase()] = true;
    });

    const candidates = lists.filter((l) => {
      const title = (l.Title || '').toLowerCase();
      if (!title || title.charAt(0) === '_') return false;
      if (SYSTEM_LIBRARIES.indexOf(title) > -1) return false;
      if (tracked[(l.Id || '').toLowerCase()]) return false;
      if (trackedNames[title]) return false;
      return true;
    });

    const libraries: ILibrary[] = [];
    for (const c of candidates) {
      const url = c.RootFolder ? c.RootFolder.ServerRelativeUrl : '';
      const inherited = await this.readPropertyBag(url);
      libraries.push({
        id: (c.Id || '').toLowerCase(),
        name: c.Title,
        url,
        entity: inherited.entity,
        cat: inherited.cat,
        sub: inherited.sub
      });
    }
    return libraries.sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Adoption inheritance: EventSection, EventCategory, EventSubcategory on the root folder. */
  private async readPropertyBag(serverRelativeUrl: string): Promise<{ entity: string; cat: string; sub: string }> {
    const empty = { entity: '', cat: '', sub: '' };
    if (!serverRelativeUrl) return empty;
    try {
      const folder: { Properties?: { [key: string]: unknown } } = await this.sp.web
        .getFolderByServerRelativePath(serverRelativeUrl)
        .select('Properties')
        .expand('Properties')();
      const props = folder.Properties || {};
      const read = (key: string): string => {
        const direct = props[key];
        if (typeof direct === 'string') return direct;
        // SharePoint encodes some property bag keys, so fall back to a loose match.
        const match = Object.keys(props).filter((k) => k.replace(/_x[0-9a-f]{4}_/gi, '').toLowerCase() === key.toLowerCase())[0];
        const value = match ? props[match] : undefined;
        return typeof value === 'string' ? value : '';
      };
      const entity = read(PROPERTY_BAG_KEYS.section);
      return {
        entity: ENTITY_NAMES.indexOf(entity) > -1 ? entity : '',
        cat: read(PROPERTY_BAG_KEYS.category),
        sub: read(PROPERTY_BAG_KEYS.subcategory)
      };
    } catch {
      return empty;
    }
  }

  /* ================================================================ */
  /*  Writing, events                                                 */
  /* ================================================================ */

  public async addEvents(items: INewEvent[], categories: ICategory[], subcategories: ISubcategory[]): Promise<IEventItem[]> {
    const list = this.sp.web.lists.getByTitle(LISTS.registry);
    const created: IEventItem[] = [];
    for (const item of items) {
      const catId = this.findCategoryId(categories, item.entity, item.cat);
      const subId = this.findSubcategoryId(subcategories, catId, item.sub);
      const result = await list.items.add({
        Title: item.name,
        LibraryId: item.libraryId,
        LibraryServerRelativeUrl: item.libraryUrl,
        Section: item.entity || undefined,
        CategoryId: catId || undefined,
        SubcategoryId: subId || undefined,
        Status: item.status || 'Planning',
        EventDate: toSpDate(item.date),
        EventTime: item.time,
        Venue: item.venue
      });
      const data = result as unknown as { Id?: number; data?: { Id: number } };
      const id = data.Id || (data.data ? data.data.Id : 0);
      created.push({
        id,
        name: item.name,
        libraryId: item.libraryId,
        libraryUrl: item.libraryUrl,
        entity: item.entity,
        cat: catId ? item.cat : '',
        sub: subId ? item.sub : '',
        catId,
        subId,
        status: item.status || 'Planning',
        date: item.date,
        time: item.time,
        venue: item.venue,
        tasks: []
      });
    }
    return created;
  }

  public async updateEventSchedule(id: number, patch: { date?: string; time?: string; venue?: string; status?: string }): Promise<void> {
    const body: { [key: string]: unknown } = {};
    if (patch.date !== undefined) body.EventDate = toSpDate(patch.date) || null;
    if (patch.time !== undefined) body.EventTime = patch.time;
    if (patch.venue !== undefined) body.Venue = patch.venue;
    if (patch.status !== undefined) body.Status = patch.status;
    await this.sp.web.lists.getByTitle(LISTS.registry).items.getById(id).update(body);
  }

  public async updateEventCategorization(id: number, entity: string, catId: number, subId: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.registry).items.getById(id).update({
      Section: entity || null,
      CategoryId: catId || null,
      SubcategoryId: subId || null
    });
  }

  public async bulkSetSection(ids: number[], entity: string): Promise<void> {
    for (const id of ids) {
      await this.updateEventCategorization(id, entity, 0, 0);
    }
  }

  public findCategoryId(categories: ICategory[], section: string, title: string): number {
    if (!section || !title) return 0;
    const hit = categories.filter((c) => c.section === section && c.title === title)[0];
    return hit ? hit.id : 0;
  }

  public findSubcategoryId(subcategories: ISubcategory[], categoryId: number, title: string): number {
    if (!categoryId || !title) return 0;
    const hit = subcategories.filter((s) => s.categoryId === categoryId && s.title === title)[0];
    return hit ? hit.id : 0;
  }

  /* ================================================================ */
  /*  Writing, tasks                                                  */
  /* ================================================================ */

  public async addTask(eventId: number, phaseId: number, text: string, who: IPerson | undefined, due: string): Promise<number> {
    const result = await this.sp.web.lists.getByTitle(LISTS.tasks).items.add({
      Title: text,
      EventId: eventId,
      PhaseId: phaseId || undefined,
      AssignedToId: who ? who.id : undefined,
      DueDate: toSpDate(due),
      Completed: false
    });
    const data = result as unknown as { Id?: number; data?: { Id: number } };
    return data.Id || (data.data ? data.data.Id : 0);
  }

  public async addTasks(eventId: number, rows: { phaseId: number; text: string }[]): Promise<number[]> {
    const ids: number[] = [];
    for (const row of rows) {
      ids.push(await this.addTask(eventId, row.phaseId, row.text, undefined, ''));
    }
    return ids;
  }

  public async updateTask(
    taskId: number,
    patch: { text?: string; phaseId?: number; who?: IPerson | undefined; clearWho?: boolean; due?: string; done?: boolean }
  ): Promise<void> {
    const body: { [key: string]: unknown } = {};
    if (patch.text !== undefined) body.Title = patch.text;
    if (patch.phaseId !== undefined) body.PhaseId = patch.phaseId || null;
    if (patch.due !== undefined) body.DueDate = toSpDate(patch.due) || null;
    if (patch.done !== undefined) body.Completed = patch.done;
    if (patch.clearWho) body.AssignedToId = null;
    else if (patch.who) body.AssignedToId = patch.who.id;
    await this.sp.web.lists.getByTitle(LISTS.tasks).items.getById(taskId).update(body);
  }

  public async deleteTask(taskId: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.tasks).items.getById(taskId).recycle();
  }

  public async reassignTasksToPhase(taskIds: number[], phaseId: number): Promise<void> {
    for (const id of taskIds) {
      await this.updateTask(id, { phaseId });
    }
  }

  /* ================================================================ */
  /*  Writing, phases                                                 */
  /* ================================================================ */

  public async addPhase(title: string, sortOrder: number): Promise<IPhase> {
    const result = await this.sp.web.lists.getByTitle(LISTS.phases).items.add({ Title: title, SortOrder: sortOrder });
    const data = result as unknown as { Id?: number; data?: { Id: number } };
    return { id: data.Id || (data.data ? data.data.Id : 0), title, sortOrder };
  }

  public async renamePhase(id: number, title: string): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.phases).items.getById(id).update({ Title: title });
  }

  public async removePhase(id: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.phases).items.getById(id).recycle();
  }

  /* ================================================================ */
  /*  Writing, taxonomy                                               */
  /* ================================================================ */

  public async addCategory(section: string, title: string, sortOrder: number): Promise<ICategory> {
    const result = await this.sp.web.lists.getByTitle(LISTS.categories).items.add({ Title: title, Section: section, SortOrder: sortOrder });
    const data = result as unknown as { Id?: number; data?: { Id: number } };
    return { id: data.Id || (data.data ? data.data.Id : 0), title, section, sortOrder };
  }

  public async renameCategory(id: number, title: string): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.categories).items.getById(id).update({ Title: title });
  }

  public async removeCategory(id: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.categories).items.getById(id).recycle();
  }

  public async addSubcategory(categoryId: number, title: string, sortOrder: number): Promise<ISubcategory> {
    const result = await this.sp.web.lists.getByTitle(LISTS.subcategories).items.add({ Title: title, CategoryId: categoryId, SortOrder: sortOrder });
    const data = result as unknown as { Id?: number; data?: { Id: number } };
    return { id: data.Id || (data.data ? data.data.Id : 0), title, categoryId, sortOrder };
  }

  public async renameSubcategory(id: number, title: string): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.subcategories).items.getById(id).update({ Title: title });
  }

  public async removeSubcategory(id: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.subcategories).items.getById(id).recycle();
  }

  /** Events that pointed at a removed category or subcategory lose the reference. */
  public async clearCategoryReferences(eventIds: number[], clearSubOnly: boolean): Promise<void> {
    for (const id of eventIds) {
      const body: { [key: string]: unknown } = clearSubOnly ? { SubcategoryId: null } : { CategoryId: null, SubcategoryId: null };
      await this.sp.web.lists.getByTitle(LISTS.registry).items.getById(id).update(body);
    }
  }

  /* ================================================================ */
  /*  Writing, templates                                              */
  /* ================================================================ */

  public async saveTemplate(name: string, tasks: ITemplateTask[]): Promise<ITemplate> {
    const result = await this.sp.web.lists.getByTitle(LISTS.templates).items.add({
      Title: name, IsBuiltin: false, TasksJson: JSON.stringify(tasks)
    });
    const data = result as unknown as { Id?: number; data?: { Id: number } };
    return { id: data.Id || (data.data ? data.data.Id : 0), name, builtin: false, tasks };
  }

  public async renameTemplate(id: number, name: string): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.templates).items.getById(id).update({ Title: name });
  }

  public async deleteTemplate(id: number): Promise<void> {
    await this.sp.web.lists.getByTitle(LISTS.templates).items.getById(id).recycle();
  }
}
