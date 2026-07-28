/**
 * Shapes shared by the hub views. These mirror the prototype's in memory model
 * so the views stay close to jes-events-hub-v9.jsx, with SharePoint identity
 * (item ids and lookup ids) carried alongside the display values.
 */

export interface IPerson {
  /** Site user id, used to write the AssignedTo person field. */
  id: number;
  loginName: string;
  title: string;
  email: string;
}

export interface ITask {
  id: number;
  phase: string;
  text: string;
  done: boolean;
  who: IPerson | undefined;
  due: string;
}

export interface IEventItem {
  id: number;
  name: string;
  libraryId: string;
  libraryUrl: string;
  entity: string;
  cat: string;
  sub: string;
  catId: number;
  subId: number;
  status: string;
  date: string;
  time: string;
  venue: string;
  tasks: ITask[];
}

/** A document library on the site that is not tracked as an event yet. */
export interface ILibrary {
  id: string;
  name: string;
  url: string;
  entity: string;
  cat: string;
  sub: string;
}

export interface IPhase {
  id: number;
  title: string;
  sortOrder: number;
}

export interface ICategory {
  id: number;
  title: string;
  section: string;
  sortOrder: number;
}

export interface ISubcategory {
  id: number;
  title: string;
  categoryId: number;
  sortOrder: number;
}

export interface ITemplateTask {
  phase: string;
  text: string;
}

export interface ITemplate {
  id: number;
  name: string;
  builtin: boolean;
  tasks: ITemplateTask[];
}

/** section -> category -> subcategories, derived from the two taxonomy lists. */
export interface ITaxonomy {
  [section: string]: { [category: string]: string[] };
}

export interface IHubData {
  events: IEventItem[];
  libraries: ILibrary[];
  phases: IPhase[];
  categories: ICategory[];
  subcategories: ISubcategory[];
  templates: ITemplate[];
}

/** What the add flow writes for each chosen library. */
export interface INewEvent {
  name: string;
  libraryId: string;
  libraryUrl: string;
  entity: string;
  cat: string;
  sub: string;
  status: string;
  date: string;
  time: string;
  venue: string;
}

export interface IFilters {
  section: string;
  status: string;
  q: string;
  attention: boolean;
  sort: string;
  layout: string;
}
