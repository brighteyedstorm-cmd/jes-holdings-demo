# Deploying the JES Events and Engagement hub

The shippable package is `sharepoint/solution/jes-events-hub.sppkg`.

To rebuild it from a clean clone:

```
npm install
gulp clean
gulp bundle --ship
gulp package-solution --ship
```

Node 22 LTS is required. Confirm with `node --version` before you start.

## Upload and deploy

1. Go to the SharePoint admin center, More features, Apps, then open the App
   Catalog. If there is no tenant App Catalog yet, create one first.
2. Upload `jes-events-hub.sppkg` to Apps for SharePoint.
3. When prompted, enable "Make this solution available to all sites in the
   organization," then choose Deploy.
4. On the Events and Engagement site, go to Site contents, Add an app, and add
   JES Events and Engagement hub.
5. Edit a modern page, add the Events hub web part, and publish.
6. The first load provisions the six lists and seeds the phases and the three
   built-in templates. Confirm they appear in Site contents.

## What the first load creates

Six lists on the site the web part sits on:

| List | What it holds |
| --- | --- |
| Event Registry | One row per adopted document library, with section, category, subcategory, status, date, time, and venue |
| Event Tasks | Checklist items, each pointing at an event and a phase, with an assignee and a due date |
| Checklist Phases | Planning, Logistics, Day-of, Wrap-up, seeded on first load |
| Checklist Templates | Conference, Groundbreaking, and General event, seeded on first load, plus anything saved from a checklist |
| Event Categories | Categories within a section |
| Event Subcategories | Subcategories within a category |

Provisioning is idempotent. Every load checks for missing lists, missing fields,
and missing seed rows, and adds only what is absent, so reloading never
duplicates anything.

The person who first loads the web part needs permission to create lists on the
site, which means site owner or better. After provisioning, members can use the
hub with contribute rights.

## Permissions

The hub reads and writes only through the signed in user's own context. There is
no app-only permission, no Graph scope to approve in the API access page, and no
tenant admin consent step beyond deploying the package.

The tenant people picker searches the whole directory through the SharePoint
client people picker service, which every authenticated user can call.

## Adoption inheritance, optional

When a document library's root folder carries these property bag keys, the add
flow prefills the matching fields on step two:

- `EventSection`, one of AEP, FWM, FWC, Corporate & Industry, Philanthropy,
  Employee Engagement
- `EventCategory`
- `EventSubcategory`

Libraries without those keys come in uncategorized, which the hub flags in
Manage until a section is assigned. The web part never creates or deletes a
document library.

## Local checks

`gulp serve` runs the hosted workbench. Live SharePoint data does not load in
the local workbench, so validate data behavior on a real modern page on the
Events and Engagement site, not in the local workbench.
