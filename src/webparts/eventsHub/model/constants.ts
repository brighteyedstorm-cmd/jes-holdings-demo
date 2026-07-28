import { ITemplateTask } from './types';

/* ================================================================== */
/*  Design tokens, graphite on white, native to SharePoint            */
/* ================================================================== */
export const T = {
  ink: '#1A211F', muted: '#57615C', faint: '#8B948F', ghost: '#AAB2AD',
  line: '#E4E8E6', lineSoft: '#EEF1EF', hair: '#F4F6F5',
  surface: '#FFFFFF', canvas: '#F7F8F8', raise: '#FCFDFD',
  brand: '#2E3A37', brandDeep: '#1E2825'
};

export const ALERT = '#A6473F';

export interface ISectionMeta { color: string; short: string; }

export const ENTITIES: { [name: string]: ISectionMeta } = {
  'AEP': { color: '#6B4A78', short: 'AEP' },
  'FWM': { color: '#B0833B', short: 'FWM' },
  'FWC': { color: '#A65A3E', short: 'FWC' },
  'Corporate & Industry': { color: '#3E6591', short: 'Corporate' },
  'Philanthropy': { color: '#5E7355', short: 'Philanthropy' },
  'Employee Engagement': { color: '#9C5A6C', short: 'Engagement' }
};
export const ENTITY_NAMES: string[] = Object.keys(ENTITIES);
export const UNCAT: ISectionMeta = { color: '#AAB2AD', short: 'Uncategorized' };
export const entMeta = (e: string): ISectionMeta => ENTITIES[e] || UNCAT;

export interface IStatusMeta { color: string; bg: string; }
export const STATUS: { [name: string]: IStatusMeta } = {
  Planning: { color: '#8A6A2E', bg: '#F6EEDD' },
  Active: { color: '#3E5573', bg: '#E8EDF3' },
  Complete: { color: '#55605C', bg: '#ECEFEE' },
  Recurring: { color: '#6E645B', bg: '#F0ECE7' }
};
export const STATUS_NAMES: string[] = Object.keys(STATUS);

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ================================================================== */
/*  Lists and provisioning seeds                                      */
/* ================================================================== */
export const LISTS = {
  registry: 'Event Registry',
  tasks: 'Event Tasks',
  phases: 'Checklist Phases',
  templates: 'Checklist Templates',
  categories: 'Event Categories',
  subcategories: 'Event Subcategories'
};

export const SEED_PHASES = ['Planning', 'Logistics', 'Day-of', 'Wrap-up'];

const mk = (rows: string[][]): ITemplateTask[] => rows.map((r) => ({ phase: r[0], text: r[1] }));

export interface ISeedTemplate { name: string; tasks: ITemplateTask[]; }

export const SEED_TEMPLATES: ISeedTemplate[] = [
  {
    name: 'Conference',
    tasks: mk([
      ['Planning', 'Confirm dates and register the team'],
      ['Planning', 'Book travel and lodging'],
      ['Logistics', 'Order booth materials and signage'],
      ['Logistics', 'Ship materials to the venue'],
      ['Day-of', 'Set up booth and brief staff'],
      ['Day-of', 'Log leads and contacts'],
      ['Wrap-up', 'Submit expenses'],
      ['Wrap-up', 'Upload photos and recap to the library']
    ])
  },
  {
    name: 'Groundbreaking',
    tasks: mk([
      ['Planning', 'Confirm date with the site team'],
      ['Planning', 'Invite officials and press'],
      ['Logistics', 'Order shovels, hard hats, and tent'],
      ['Logistics', 'Arrange catering'],
      ['Day-of', 'Brief speakers on the run of show'],
      ['Day-of', 'Capture photos and video'],
      ['Wrap-up', 'Send thank-you notes'],
      ['Wrap-up', 'File press coverage in the library']
    ])
  },
  {
    name: 'General event',
    tasks: mk([
      ['Planning', 'Set the budget and get approval'],
      ['Planning', 'Book the venue and lock the date'],
      ['Logistics', 'Finalize the guest list'],
      ['Logistics', 'Confirm vendors'],
      ['Day-of', 'Run the event'],
      ['Wrap-up', 'Reconcile invoices'],
      ['Wrap-up', 'Save recap and photos to the library']
    ])
  }
];

/** Libraries that are part of the site plumbing, never offered as events. */
export const SYSTEM_LIBRARIES = ['site assets', 'site pages', 'style library', 'form templates'];

/** Root folder property bag keys an event library can carry. */
export const PROPERTY_BAG_KEYS = {
  section: 'EventSection',
  category: 'EventCategory',
  subcategory: 'EventSubcategory'
};
