# JES Events and Engagement hub

A tenant scoped SharePoint Framework web part that turns the document libraries
on the Events and Engagement site into a managed events portal. One document
library equals one event. The hub discovers those libraries, lets a person adopt
one as a tracked event, set its section, category, schedule, and status, and
manage a per event checklist with assignees and due dates.

Site: `https://jesholdings.sharepoint.com/sites/Events-Engagement`

`jes-events-hub-v9.jsx` in this folder is the prototype the interface was ported
from. It stays in the repo as the visual and functional source of truth.

## Build

```
npm install
gulp clean
gulp bundle --ship
gulp package-solution --ship
```

The package lands at `sharepoint/solution/jes-events-hub.sppkg`. It is committed
so it can be uploaded without a build. See `DEPLOY.md` for the upload steps and
for what the first load provisions.

Requires Node 22 LTS. Built with SPFx 1.22.2 and React 17, the versions the SPFx
1.22 generator ships.

## Layout

```
src/webparts/eventsHub/
  EventsHubWebPart.ts           web part shell, loads Lora, renders the hub
  model/
    constants.ts                design tokens, section colors, statuses, list names, seeds
    types.ts                    the shapes the views read
    helpers.ts                  dates, countdowns, readiness, taxonomy shaping
  services/
    HubService.ts               provisioning, discovery, reads, and every write
  components/
    EventsHub.tsx               shell, rail, header, filter bar, state, write orchestration
    EventsHub.module.scss       the prototype's stylesheet, scoped to the hub
    styles.ts                   the prototype's shared style objects
    primitives.tsx              rings, badges, avatars, tiles, empty states
    Overview.tsx EventsView.tsx CalendarView.tsx TasksView.tsx
    ManageLibraries.tsx TaxonomyView.tsx
    Drawer.tsx PhaseEditor.tsx TemplateModal.tsx
    AddModal.tsx CommandPalette.tsx Toasts.tsx
    PeoplePickerField.tsx       the compact assignee control, tenant directory
```

## How data flows

`HubService` owns SharePoint. On first load it creates any missing list, field,
or seed row, then reads everything into one shape that mirrors the prototype's
in memory model, so the views stayed close to the original.

Writes are optimistic. The view updates immediately, the write follows, and the
toast appears only once the write resolves. A failure shows "Could not save. Try
again." and reloads from the server so what is on screen matches what is stored.
Typed edits in the drawer's schedule editor are debounced, so a write happens
once the typing settles rather than on every keystroke.

Category and Subcategory are lookups on purpose. Renaming a category in Manage
propagates to every event pointing at it without touching the event rows.

## Notes on the port

Everything in the prototype is reproduced, with these exceptions, all forced by
the SPFx toolchain or by the acceptance criteria:

- **Lora** is loaded with `SPComponentLoader.loadCss` in `onInit` rather than a
  CSS `@import` in the stylesheet. SPFx's css-loader crashes on an `@import`.
- **The greeting** follows the clock, so it reads Good morning, Good afternoon,
  or Good evening. The prototype hard coded Good afternoon.
- **The assignee control** wraps the `@pnp/spfx-controls-react` PeoplePicker in
  the prototype's compact trigger and popover. The list inside the popover is
  the tenant control, so it looks like a Fluent picker rather than the mock list.
- **The viewing as switcher** is gone, as specified. Assigned to me, the rail
  badge, and your open tasks key off the signed in user.
- **Phone layout** needed three fixes the prototype does not have, all required
  by the responsive acceptance criteria: grid tracks are `minmax(0, 1fr)` so a
  column can shrink below its content instead of being clipped, the four stat
  tiles take a half width basis under 640px so they wrap two by two, and the
  calendar's month header wraps.
- **Categories are not seeded.** The build spec seeds the phases and the three
  built-in templates only, so Manage starts with no categories and events sit
  directly under their section until someone adds them.

## Limits worth knowing

- Reads take the first 5,000 rows of each list in a single request. Past that,
  paging would be needed.
- Dates are calendar dates, stored anchored at midday UTC so the day survives a
  round trip through any US time zone.
- The web part never creates or deletes a document library. Adoption only writes
  an Event Registry row that points at a library that already exists.
