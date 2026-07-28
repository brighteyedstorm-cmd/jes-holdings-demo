import { ICategory, IEventItem, IPerson, ISubcategory, ITask, ITaxonomy } from './types';

const MS = 86400000;

/** Today as an ISO calendar date in the browser's time zone. */
export const todayIso = (): string => {
  const d = new Date();
  const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const daysUntil = (iso: string): number | undefined =>
  iso ? Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) / MS) : undefined;

export const fmtDate = (iso: string): string =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD';

export const fmtShort = (iso: string): string =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

export const countdown = (iso: string): string => {
  const d = daysUntil(iso);
  if (d === undefined) return 'Date TBD';
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  return d > 0 ? `In ${d} days` : `${-d} days ago`;
};

export const initials = (n: string): string =>
  n ? n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '?';

export const readiness = (tasks: ITask[]): number | undefined =>
  tasks.length ? Math.round(tasks.filter((t) => t.done).length / tasks.length * 100) : undefined;

export const isOverdue = (t: ITask): boolean => !t.done && !!t.due && t.due < todayIso();

export const eventOverdue = (e: IEventItem): number => e.tasks.filter(isOverdue).length;

export const assignees = (e: IEventItem): IPerson[] => {
  const seen: { [key: string]: boolean } = {};
  const out: IPerson[] = [];
  e.tasks.forEach((t) => {
    if (t.who && !seen[t.who.loginName]) { seen[t.who.loginName] = true; out.push(t.who); }
  });
  return out;
};

export const samePerson = (a: IPerson | undefined, b: IPerson | undefined): boolean => {
  if (!a || !b) return false;
  if (a.email && b.email) return a.email.toLowerCase() === b.email.toLowerCase();
  return a.loginName.toLowerCase() === b.loginName.toLowerCase();
};

/** The library root, opened in a new tab from cards, rows, and the drawer.
 *  SharePoint hands back a decoded server relative path, so each segment is
 *  encoded again here. Library names carry spaces and hyphens often enough. */
export const libUrl = (siteUrl: string, serverRelativeUrl: string, name: string): string => {
  const encodePath = (p: string): string => p.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  const origin = siteUrl.indexOf('://') > -1 ? siteUrl.substring(0, siteUrl.indexOf('/', siteUrl.indexOf('://') + 3)) : '';
  const root = serverRelativeUrl
    ? `${origin}${encodePath(serverRelativeUrl)}`
    : `${siteUrl}/${encodeURIComponent(name)}`;
  return `${root}/Forms/AllItems.aspx`;
};

/** section -> category -> subcategories, the shape the views read. */
export const buildTaxonomy = (categories: ICategory[], subcategories: ISubcategory[], sections: string[]): ITaxonomy => {
  const tax: ITaxonomy = {};
  sections.forEach((s) => { tax[s] = {}; });
  const sorted = [...categories].sort((a, b) => (a.sortOrder - b.sortOrder) || a.title.localeCompare(b.title));
  sorted.forEach((c) => {
    if (!tax[c.section]) tax[c.section] = {};
    tax[c.section][c.title] = subcategories
      .filter((s) => s.categoryId === c.id)
      .sort((a, b) => (a.sortOrder - b.sortOrder) || a.title.localeCompare(b.title))
      .map((s) => s.title);
  });
  return tax;
};

export const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};
