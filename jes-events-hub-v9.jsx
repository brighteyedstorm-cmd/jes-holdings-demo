import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search, Plus, X, Check, ChevronRight, ChevronLeft, ChevronDown, ExternalLink, MapPin,
  CalendarDays, ListChecks, LayoutGrid, List as ListIcon, Filter, Pencil, Trash2, Sparkles,
  Tags, Save, Eye, Library, Info, AlertCircle, Command as CommandIcon, CornerDownLeft, ArrowRight,
  Users, Clock, LayoutDashboard, CalendarRange, CheckSquare, SlidersHorizontal, Building2,
  Layers, ArrowUpRight, Inbox, CircleCheck, Circle
} from "lucide-react";

/* ================================================================== */
/*  Design tokens — graphite on white, native to SharePoint          */
/* ================================================================== */
const T = {
  ink: "#1A211F", muted: "#57615C", faint: "#8B948F", ghost: "#AAB2AD",
  line: "#E4E8E6", lineSoft: "#EEF1EF", hair: "#F4F6F5",
  surface: "#FFFFFF", canvas: "#F7F8F8", raise: "#FCFDFD",
  brand: "#2E3A37", brandDeep: "#1E2825",
};
const SITE = "https://jesholdings.sharepoint.com/sites/Events-Engagement";
const TODAY = "2026-07-27";

const ENTITIES = {
  "AEP":                  { color: "#6B4A78", short: "AEP" },
  "FWM":                  { color: "#B0833B", short: "FWM" },
  "FWC":                  { color: "#A65A3E", short: "FWC" },
  "Corporate & Industry": { color: "#3E6591", short: "Corporate" },
  "Philanthropy":         { color: "#5E7355", short: "Philanthropy" },
  "Employee Engagement":  { color: "#9C5A6C", short: "Engagement" },
};
const ENTITY_NAMES = Object.keys(ENTITIES);
const UNCAT = { color: "#AAB2AD", short: "Uncategorized" };
const entMeta = (e) => ENTITIES[e] || UNCAT;

const STATUS = {
  Planning:  { color: "#8A6A2E", bg: "#F6EEDD" },
  Active:    { color: "#3E5573", bg: "#E8EDF3" },
  Complete:  { color: "#55605C", bg: "#ECEFEE" },
  Recurring: { color: "#6E645B", bg: "#F0ECE7" },
};
const STATUS_NAMES = Object.keys(STATUS);

const DIRECTORY = [
  "Sonya Lawrence", "Angela Kates", "Kijuana Williams", "Sam Steelman", "Robert Mitchell", "Walker Reed", "Dana Price", "Chris Long",
  "Robert Wilson", "Maria Gonzalez", "James Carter", "Priya Patel", "Tomás Rivera", "Ashley Nguyen", "Brandon Cole", "Elena Duarte",
  "Marcus Bell", "Hannah Schmidt", "Devon Parker", "Rachel Kim", "Omar Haddad", "Grace O'Brien", "Tyler Brooks", "Nina Petrova",
];
const ME = "Sonya Lawrence";
const initials = (n) => n ? n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() : "?";

const SEED_TAXONOMY = {
  "AEP": { "General Events": [], "Conferences": [], "Investor Events": [], "Political Events": [] },
  "FWM": {}, "FWC": {}, "Corporate & Industry": {},
  "Philanthropy": { "Animals": [], "Food & Nutrition": [], "Housing & Shelter": [], "Walks & Runs": [], "Health & Wellness": ["Wear Red", "Wear Pink"], "Other": [] },
  "Employee Engagement": { "Activities": [], "Happy Hours": [], "Holidays": [], "Sports & Games": [] },
};
const SEED_PHASES = ["Planning", "Logistics", "Day-of", "Wrap-up"];

let _tpl = 0;
const tpl = (name, builtin, tasks) => ({ id: ++_tpl, name, builtin, tasks });
const SEED_TEMPLATES = [
  tpl("Conference", true, [["Planning","Confirm dates and register the team"],["Planning","Book travel and lodging"],["Logistics","Order booth materials and signage"],["Logistics","Ship materials to the venue"],["Day-of","Set up booth and brief staff"],["Day-of","Log leads and contacts"],["Wrap-up","Submit expenses"],["Wrap-up","Upload photos and recap to the library"]].map(([phase,text])=>({phase,text}))),
  tpl("Groundbreaking", true, [["Planning","Confirm date with the site team"],["Planning","Invite officials and press"],["Logistics","Order shovels, hard hats, and tent"],["Logistics","Arrange catering"],["Day-of","Brief speakers on the run of show"],["Day-of","Capture photos and video"],["Wrap-up","Send thank-you notes"],["Wrap-up","File press coverage in the library"]].map(([phase,text])=>({phase,text}))),
  tpl("General event", true, [["Planning","Set the budget and get approval"],["Planning","Book the venue and lock the date"],["Logistics","Finalize the guest list"],["Logistics","Confirm vendors"],["Day-of","Run the event"],["Wrap-up","Reconcile invoices"],["Wrap-up","Save recap and photos to the library"]].map(([phase,text])=>({phase,text}))),
];

let _tid = 5000;
const mkTasks = (which, doneCount = 0, overdue = 0) => {
  const t = SEED_TEMPLATES.find((x) => x.name === which) || SEED_TEMPLATES[2];
  return t.tasks.map((x, i) => {
    const done = i < doneCount;
    const who = i % 3 === 0 ? ME : DIRECTORY[(_tid + i) % DIRECTORY.length];
    let due = null;
    if (!done) { if (i < overdue) due = `2026-07-${String(18 + i).padStart(2, "0")}`; else if (i % 2 === 0) due = `2026-08-${String(9 + i).padStart(2, "0")}`; }
    return { id: ++_tid, phase: x.phase, text: x.text, done, who, due };
  });
};
let _id = 0;
const ev = (name, entity, cat, sub, status, date, time, venue, tasks = []) => ({ id: ++_id, name, entity, cat, sub, status, date, time, venue, tasks });

const seed = [
  ev("ADOH","AEP","Conferences","","Planning","2026-09-10","9:00 AM","Sheraton Downtown", mkTasks("Conference",2,1)),
  ev("APCIA","AEP","Conferences","","Recurring","2026-10-14","8:30 AM","Boston Convention Center", mkTasks("Conference",1)),
  ev("Fed Bar","AEP","Conferences","","Complete","2026-03-05","9:00 AM","Marriott Marquis", mkTasks("Conference",8)),
  ev("HOSA","AEP","Conferences","","Recurring","2026-06-22","10:00 AM","Gaylord Opryland"),
  ev("ITC","AEP","Conferences","","Active","2026-08-04","9:00 AM","Mandalay Bay", mkTasks("Conference",4,1)),
  ev("Big Cedar","AEP","Investor Events","","Planning","2026-11-06","5:00 PM","Big Cedar Lodge"),
  ev("Cincinnati Site Visits","AEP","Investor Events","","Active","2026-07-30","1:00 PM","Cincinnati portfolio", mkTasks("General event",1)),
  ev("Sturge Weber (Falmouth)","AEP","Investor Events","","Planning","2026-10-01","11:00 AM","Falmouth property"),
  ev("Kohler","AEP","General Events","","Recurring","2026-05-15","6:00 PM","Kohler, WI"),
  ev("Masters","AEP","General Events","","Complete","2026-04-11","8:00 AM","Augusta, GA"),
  ev("Napa","AEP","General Events","","Planning","2026-09-25","4:00 PM","Napa Valley"),
  ev("FWM Days","FWM","","","Recurring","2026-08-11","10:00 AM","Portfolio-wide", mkTasks("General event",2)),
  ev("Groundbreakings","FWM","","","Active","2026-08-01","10:00 AM","Highlands, Lot 4", mkTasks("Groundbreaking",5,1)),
  ev("Construction Meetings","FWC","","","Recurring","2026-07-29","7:30 AM","Field office"),
  ev("OSHA Safety Stand-Down","FWC","","","Planning","2026-09-15","7:00 AM","All job sites", mkTasks("General event",1)),
  ev("Women in Construction","FWC","","","Active","2026-08-08","9:00 AM","FWC HQ", mkTasks("General event",2)),
  ev("Corporate Year End","Corporate & Industry","","","Planning","2026-12-12","6:30 PM","Riverfront Center", mkTasks("General event",2)),
  ev("Mayors Ball","Corporate & Industry","","","Complete","2026-02-20","7:00 PM","City Hall"),
  ev("Affiliated University","Corporate & Industry","","","Recurring","2026-09-05","12:00 PM","Campus center"),
  ev("WAH Networking","Corporate & Industry","","","Active","2026-08-18","5:30 PM","Rooftop venue", mkTasks("General event",1)),
  ev("Habitat for Humanity","Philanthropy","Housing & Shelter","","Active","2026-08-28","8:00 AM","Build site 12", mkTasks("General event",3)),
  ev("Meals on Wheels","Philanthropy","Food & Nutrition","","Recurring","2026-11-01","9:00 AM","Community kitchen"),
  ev("Lizzy's Walk of Faith","Philanthropy","Walks & Runs","","Planning","2026-10-03","8:00 AM","Riverside Park", mkTasks("General event",1)),
  ev("Second Chance","Philanthropy","Animals","","Complete","2026-04-27","10:00 AM","County shelter"),
  ev("Holidays","Employee Engagement","Holidays","","Planning","2026-12-05","5:00 PM","Main office"),
  ev("Happy Hours","Employee Engagement","Happy Hours","","Recurring","2026-07-31","5:00 PM","The Tavern", mkTasks("General event",1)),
  ev("Regional Broker Summit",null,"","","Planning","2026-09-19","9:00 AM","TBD"),
  ev("Sponsor Appreciation",null,"","","Planning","2026-08-22","6:00 PM","TBD"),
];

const SEED_UNREGISTERED = [
  { name: "Extreme Home Makeover", entity: "Philanthropy", cat: "Housing & Shelter", sub: "" },
  { name: "Food Drive", entity: "Philanthropy", cat: "Food & Nutrition", sub: "" },
  { name: "Sports & Games", entity: "Employee Engagement", cat: "Sports & Games", sub: "" },
  { name: "Event Templates" },
  { name: "2024 Media Archive" },
  { name: "Vendor W-9s" },
];

/* ================================================================== */
/*  Helpers                                                          */
/* ================================================================== */
const MS = 86400000;
const daysUntil = (iso) => iso ? Math.round((new Date(iso + "T00:00:00") - new Date(TODAY + "T00:00:00")) / MS) : null;
const fmtDate = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBD";
const fmtLong = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";
const fmtShort = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
const countdown = (iso) => { const d = daysUntil(iso); if (d === null) return "Date TBD"; if (d === 0) return "Today"; if (d === 1) return "Tomorrow"; if (d === -1) return "Yesterday"; return d > 0 ? `In ${d} days` : `${-d} days ago`; };
const enc = (s) => encodeURIComponent(s);
const libUrl = (n) => `${SITE}/${enc(n)}/Forms/AllItems.aspx`;
const readiness = (tasks) => tasks.length ? Math.round(tasks.filter((t) => t.done).length / tasks.length * 100) : null;
const isOverdue = (t) => !t.done && t.due && t.due < TODAY;
const eventOverdue = (e) => e.tasks.filter(isOverdue).length;
const assignees = (e) => [...new Set(e.tasks.map((t) => t.who).filter(Boolean))];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ================================================================== */
/*  Primitives                                                       */
/* ================================================================== */
const Dot = ({ e, size = 8 }) => <span style={{ width: size, height: size, borderRadius: 99, background: entMeta(e).color, display: "inline-block", flexShrink: 0 }} />;
const Badge = ({ s }) => { const x = STATUS[s] || { color: T.faint, bg: T.hair }; return <span style={{ fontSize: 11, fontWeight: 600, color: x.color, background: x.bg, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap", letterSpacing: 0.1 }}>{s}</span>; };
const Avatar = ({ name, size = 22 }) => name
  ? <span title={name} style={{ width: size, height: size, borderRadius: 99, background: T.hair, color: T.muted, display: "grid", placeItems: "center", fontSize: size * 0.4, fontWeight: 700, flexShrink: 0, border: `1px solid ${T.line}` }}>{initials(name)}</span>
  : <span title="Unassigned" style={{ width: size, height: size, borderRadius: 99, border: `1px dashed ${T.line}`, color: T.ghost, display: "grid", placeItems: "center", flexShrink: 0 }}><Plus size={size * 0.5} /></span>;
function AvatarStack({ names, size = 22, max = 4 }) {
  if (!names.length) return <span style={{ fontSize: 11.5, color: T.ghost }}>No one assigned</span>;
  const shown = names.slice(0, max); const extra = names.length - shown.length;
  return <div style={{ display: "flex", alignItems: "center" }}>{shown.map((n, i) => <span key={n} style={{ marginLeft: i ? -8 : 0, borderRadius: 99, boxShadow: `0 0 0 2px ${T.surface}`, zIndex: max - i }}><Avatar name={n} size={size} /></span>)}{extra > 0 && <span style={{ marginLeft: -8, width: size, height: size, borderRadius: 99, background: T.surface, color: T.muted, border: `1px solid ${T.line}`, display: "grid", placeItems: "center", fontSize: size * 0.36, fontWeight: 700, boxShadow: `0 0 0 2px ${T.surface}` }}>+{extra}</span>}</div>;
}
function Ring({ value, size = 46, stroke = 3.5, center, title }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const off = circ * (1 - v / 100);
  return (
    <div title={title} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.lineSoft} strokeWidth={stroke} />
        {value != null && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={v >= 100 ? T.brand : T.brand} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .7s cubic-bezier(.22,1,.36,1)" }} />}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: size * 0.26, fontWeight: 700, color: value == null ? T.ghost : T.ink, fontVariantNumeric: "tabular-nums" }}>{center}</div>
    </div>
  );
}
const ringCenter = (e) => e.status === "Complete" ? <Check size={16} strokeWidth={2.6} style={{ color: T.brand }} /> : (readiness(e.tasks) == null ? "–" : readiness(e.tasks));
const Field = ({ label, children }) => <label style={{ display: "block" }}><div style={lblStyle}>{label}</div>{children}</label>;
const SectionHead = ({ children }) => <div style={{ fontSize: 10.5, color: T.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{children}</div>;

/* ================================================================== */
/*  Tenant people picker                                             */
/* ================================================================== */
function PeoplePicker({ value, onChange, direction = "down", small }) {
  const [open, setOpen] = useState(false); const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => { if (!open) return; const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [open]);
  const results = DIRECTORY.filter((n) => n.toLowerCase().includes(q.toLowerCase())).slice(0, 24);
  const pad = small ? "6px 9px" : "9px 11px";
  const row = { display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "7px 9px", border: "none", background: "transparent", borderRadius: 8, cursor: "pointer", fontSize: 13, color: T.ink };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => { setOpen((o) => !o); setQ(""); }} style={{ ...input, padding: pad, width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, cursor: "pointer" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>{value ? <><Avatar name={value} size={small ? 18 : 20} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: small ? 12.5 : 13 }}>{value}</span></> : <span style={{ color: T.ghost, fontSize: small ? 12.5 : 13 }}>Assign to…</span>}</span>
        <ChevronDown size={14} style={{ color: T.ghost, flexShrink: 0 }} />
      </button>
      {open && (
        <div className="jes-pop" style={{ position: "absolute", left: 0, right: 0, [direction === "up" ? "bottom" : "top"]: "calc(100% + 5px)", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 11, boxShadow: "0 16px 40px rgba(26,33,31,.16)", zIndex: 95, overflow: "hidden" }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${T.lineSoft}` }}><div style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.ghost }} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" style={{ ...input, width: "100%", padding: "7px 10px 7px 30px", fontSize: 12.5, background: T.canvas }} /></div></div>
          <div style={{ maxHeight: 210, overflowY: "auto", padding: 6 }}>
            <button className="jes-opt" style={{ ...row, color: T.muted }} onClick={() => { onChange(null); setOpen(false); }}>Unassigned</button>
            {results.map((n) => <button key={n} className="jes-opt" style={{ ...row, fontWeight: n === value ? 700 : 500 }} onClick={() => { onChange(n); setOpen(false); }}><Avatar name={n} size={20} /><span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</span>{n === value && <Check size={14} style={{ color: T.brand }} />}</button>)}
            {!results.length && <div style={{ padding: "12px 10px", fontSize: 12.5, color: T.faint }}>No matches in the directory</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Toasts                                                           */
/* ================================================================== */
function Toasts({ items }) {
  return (
    <div style={{ position: "absolute", right: 18, bottom: 18, zIndex: 120, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {items.map((t) => (
        <div key={t.id} className="jes-toast" style={{ display: "flex", alignItems: "center", gap: 9, background: T.brand, color: "#fff", padding: "10px 15px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 12px 32px rgba(26,33,31,.28)", maxWidth: 320 }}>
          <CircleCheck size={15} style={{ flexShrink: 0, opacity: 0.9 }} />{t.msg}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Command palette                                                  */
/* ================================================================== */
function CommandPalette({ onClose, events, go, openEvent, addEvent, showUncat }) {
  const [q, setQ] = useState(""); const [i, setI] = useState(0);
  const cmds = [
    { group: "Actions", icon: Plus, label: "Add event", run: addEvent, kw: "new adopt library" },
    { group: "Actions", icon: AlertCircle, label: "Review uncategorized events", run: showUncat, kw: "attention section" },
    { group: "Go to", icon: LayoutDashboard, label: "Overview", run: () => go("overview") },
    { group: "Go to", icon: LayoutGrid, label: "Events", run: () => go("events") },
    { group: "Go to", icon: CalendarRange, label: "Calendar", run: () => go("calendar") },
    { group: "Go to", icon: CheckSquare, label: "Tasks", run: () => go("tasks") },
    { group: "Go to", icon: SlidersHorizontal, label: "Manage", run: () => go("manage") },
  ];
  const ql = q.toLowerCase();
  const cmdMatches = cmds.filter((c) => !q || (c.label + " " + (c.kw || "")).toLowerCase().includes(ql));
  const evMatches = (q ? events.filter((e) => e.name.toLowerCase().includes(ql)) : events.slice(0, 6)).slice(0, 8)
    .map((e) => ({ group: "Events", icon: null, event: e, label: e.name, run: () => openEvent(e) }));
  const items = [...cmdMatches, ...evMatches];
  useEffect(() => { setI(0); }, [q]);
  const groups = []; let last = null;
  items.forEach((it, idx) => { if (it.group !== last) { groups.push({ header: it.group, items: [] }); last = it.group; } groups[groups.length - 1].items.push({ ...it, idx }); });
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setI((v) => (v + 1) % Math.max(1, items.length)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setI((v) => (v - 1 + items.length) % Math.max(1, items.length)); }
    else if (e.key === "Enter") { e.preventDefault(); items[i]?.run(); onClose(); }
    else if (e.key === "Escape") { onClose(); }
  };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 110, display: "grid", placeItems: "start center", paddingTop: "9vh" }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,33,31,.34)", backdropFilter: "blur(2px)" }} />
      <div className="jes-cmdk" style={{ position: "relative", width: "min(600px,92%)", background: T.surface, borderRadius: 16, boxShadow: "0 30px 70px rgba(26,33,31,.34)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 18px", borderBottom: `1px solid ${T.lineSoft}` }}>
          <Search size={18} style={{ color: T.faint }} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search events or run a command…" style={{ flex: 1, border: "none", outline: "none", fontSize: 15.5, color: T.ink, background: "transparent", fontFamily: "inherit" }} />
          <span style={kbd}>Esc</span>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "8px 8px 10px" }}>
          {!items.length && <div style={{ padding: "30px 16px", textAlign: "center", color: T.faint, fontSize: 13.5 }}>Nothing matches “{q}”.</div>}
          {groups.map((g) => (
            <div key={g.header} style={{ marginBottom: 4 }}>
              <div style={{ padding: "8px 12px 4px", fontSize: 10.5, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: 0.5 }}>{g.header}</div>
              {g.items.map((it) => {
                const active = it.idx === i; const Icon = it.icon;
                return (
                  <button key={it.idx} onMouseEnter={() => setI(it.idx)} onClick={() => { it.run(); onClose(); }} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderRadius: 9, cursor: "pointer", background: active ? T.canvas : "transparent" }}>
                    {it.event ? <Dot e={it.event.entity} size={9} /> : <Icon size={16} style={{ color: T.muted }} />}
                    <span style={{ flex: 1, fontSize: 13.5, color: T.ink, fontWeight: it.event ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>
                    {it.event && <span style={{ fontSize: 11.5, color: T.faint }}>{countdown(it.event.date)}</span>}
                    {active && <CornerDownLeft size={14} style={{ color: T.ghost }} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Add event modal                                                  */
/* ================================================================== */
function StepDot({ n, active, done, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 20, height: 20, borderRadius: 99, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, background: active || done ? T.brand : T.hair, color: active || done ? "#fff" : T.faint }}>{done ? <Check size={12} strokeWidth={3} /> : n}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: active ? T.ink : T.faint }}>{label}</span>
    </span>
  );
}
function AddModal({ libraries, taxonomy, onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [q, setQ] = useState(""); const [picked, setPicked] = useState(() => new Set());
  const [details, setDetails] = useState({});
  const list = libraries.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()));
  const chosen = libraries.filter((l) => picked.has(l.name));
  const toggle = (n) => setPicked((p) => { const s = new Set(p); s.has(n) ? s.delete(n) : s.add(n); return s; });
  const goDetails = () => { const d = {}; chosen.forEach((l) => { d[l.name] = details[l.name] || { entity: l.entity || "", cat: l.cat || "", sub: l.sub || "", status: "Planning", date: "", time: "9:00 AM", venue: "" }; }); setDetails(d); setStep(2); };
  const setD = (name, patch) => setDetails((all) => ({ ...all, [name]: { ...all[name], ...patch } }));
  const submit = () => onAdd([...picked].map((name) => ({ name, ...details[name], entity: details[name].entity || null })));
  const fieldGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,33,31,.4)", backdropFilter: "blur(2px)" }} />
      <div className="jes-modal" style={{ position: "relative", width: "min(580px,100%)", height: "min(624px,94%)", background: T.surface, borderRadius: 18, boxShadow: "0 30px 70px rgba(26,33,31,.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 24px 15px", borderBottom: `1px solid ${T.lineSoft}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{step === 2 && <button className="jes-icon" onClick={() => setStep(1)} aria-label="Back" style={btnIcon}><ChevronLeft size={18} /></button>}<h2 style={serif(21)}>{step === 1 ? "Add an event" : "Set the details"}</h2></div>
            <button className="jes-icon" onClick={onClose} aria-label="Close" style={btnIcon}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12 }}>
            <StepDot n={1} active={step === 1} done={step > 1} label="Choose libraries" />
            <span style={{ width: 26, height: 1, background: T.line }} />
            <StepDot n={2} active={step === 2} label="Date, time, place" />
          </div>
        </div>

        {step === 1 && <>
          <div style={{ padding: "13px 24px 0" }}><div style={{ position: "relative" }}><Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.ghost }} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search libraries…" style={{ ...input, width: "100%", padding: "9px 12px 9px 34px", background: T.canvas }} /></div></div>
          <div style={{ flex: 1, overflowY: "auto", padding: "13px 16px" }}>
            {!list.length && <div style={{ textAlign: "center", color: T.faint, fontSize: 13, padding: "44px 20px" }}>Every library on the site is already tracked as an event.</div>}
            {list.map((l) => { const on = picked.has(l.name); return (
              <button key={l.name} onClick={() => toggle(l.name)} className="jes-opt" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "11px 12px", borderRadius: 11, border: `1px solid ${on ? T.brand : "transparent"}`, cursor: "pointer", background: on ? T.canvas : "transparent", marginBottom: 3 }}>
                <span style={{ width: 19, height: 19, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center", background: on ? T.brand : T.surface, border: on ? "none" : `1.5px solid ${T.line}`, color: "#fff" }}>{on && <Check size={12} strokeWidth={3} />}</span>
                <Library size={16} style={{ color: T.ghost, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{l.name}</div>
                  {l.entity ? <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}><Dot e={l.entity} size={7} />Inherits {l.entity}{l.cat ? ` · ${l.cat}` : ""}</div> : <div style={{ fontSize: 11.5, color: T.ghost, marginTop: 2 }}>No section tagged yet</div>}
                </div>
                <span style={{ fontSize: 10.5, color: T.ghost, fontFamily: "ui-monospace,Menlo,monospace", whiteSpace: "nowrap" }}>/{l.name}/</span>
              </button>
            ); })}
          </div>
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.lineSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: T.muted }}>{picked.size} selected</span>
            <div style={{ display: "flex", gap: 10 }}><button className="jes-ghost" style={btnGhost} onClick={onClose}>Cancel</button><button className="jes-primary" style={{ ...btnPrimary, opacity: picked.size ? 1 : 0.45, cursor: picked.size ? "pointer" : "not-allowed" }} onClick={() => picked.size && goDetails()}>Continue <ChevronRight size={15} /></button></div>
          </div>
        </>}

        {step === 2 && <>
          <div style={{ flex: 1, overflowY: "auto", padding: "15px 22px" }}>
            <p style={{ fontSize: 12.5, color: T.muted, margin: "0 0 14px", lineHeight: 1.5 }}>Fill in what you know now. Anything you leave blank you can set later from the event, and you can build the checklist once it's created.</p>
            {chosen.map((l) => { const d = details[l.name]; if (!d) return null;
              const cats = d.entity && taxonomy[d.entity] ? Object.keys(taxonomy[d.entity]) : [];
              const subs = d.entity && d.cat && taxonomy[d.entity] && taxonomy[d.entity][d.cat] ? taxonomy[d.entity][d.cat] : [];
              return (
                <div key={l.name} style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: "14px 16px", marginBottom: 12, background: T.raise }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Dot e={d.entity || null} /><span style={{ ...serif(16) }}>{l.name}</span></div>
                  <div style={fieldGrid}>
                    <Field label="Section"><select value={d.entity} onChange={(e) => setD(l.name, { entity: e.target.value, cat: "", sub: "" })} style={{ ...input, width: "100%" }}><option value="">Uncategorized</option>{ENTITY_NAMES.map((n) => <option key={n}>{n}</option>)}</select></Field>
                    <Field label="Category"><select value={d.cat} onChange={(e) => setD(l.name, { cat: e.target.value, sub: "" })} disabled={!cats.length} style={{ ...input, width: "100%", opacity: cats.length ? 1 : 0.5 }}><option value="">{cats.length ? "None" : "—"}</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
                    {subs.length > 0 && <div style={{ gridColumn: "1 / -1" }}><Field label="Subcategory"><select value={d.sub} onChange={(e) => setD(l.name, { sub: e.target.value })} style={{ ...input, width: "100%" }}><option value="">None</option>{subs.map((s) => <option key={s}>{s}</option>)}</select></Field></div>}
                    <Field label="Date"><input type="date" value={d.date} onChange={(e) => setD(l.name, { date: e.target.value })} style={{ ...input, width: "100%" }} /></Field>
                    <Field label="Time"><input value={d.time} onChange={(e) => setD(l.name, { time: e.target.value })} placeholder="9:00 AM" style={{ ...input, width: "100%" }} /></Field>
                    <div style={{ gridColumn: "1 / -1" }}><Field label="Venue"><input value={d.venue} onChange={(e) => setD(l.name, { venue: e.target.value })} placeholder="Where is it?" style={{ ...input, width: "100%" }} /></Field></div>
                    <Field label="Status"><select value={d.status} onChange={(e) => setD(l.name, { status: e.target.value })} style={{ ...input, width: "100%" }}>{STATUS_NAMES.map((s) => <option key={s}>{s}</option>)}</select></Field>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.lineSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="jes-ghost" style={btnGhost} onClick={() => setStep(1)}><ChevronLeft size={15} /> Back</button>
            <button className="jes-primary" style={btnPrimary} onClick={submit}><Check size={15} strokeWidth={2.4} /> Add {picked.size} {picked.size === 1 ? "event" : "events"}</button>
          </div>
        </>}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Template modal                                                   */
/* ================================================================== */
function TemplateModal({ templates, phases, current, onClose, onUse, onSaveCurrent, onRename, onDelete }) {
  const [selId, setSelId] = useState(templates[0]?.id);
  const [saving, setSaving] = useState(false); const [saveName, setSaveName] = useState("");
  const [renameId, setRenameId] = useState(null); const [renameVal, setRenameVal] = useState("");
  const sel = templates.find((t) => t.id === selId) || templates[0];
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 100, display: "grid", placeItems: "center", padding: 16 }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,33,31,.4)", backdropFilter: "blur(2px)" }} />
      <div className="jes-modal" style={{ position: "relative", width: "min(760px,100%)", height: "min(540px,92%)", background: T.surface, borderRadius: 18, boxShadow: "0 30px 70px rgba(26,33,31,.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "17px 22px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={serif(19)}>Checklist templates</h2><button className="jes-icon" onClick={onClose} aria-label="Close" style={btnIcon}><X size={18} /></button></div>
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ width: 244, borderRight: `1px solid ${T.lineSoft}`, overflowY: "auto", padding: 10, flexShrink: 0 }}>
            {templates.map((t) => (<div key={t.id} onClick={() => setSelId(t.id)} className="jes-opt" style={{ padding: "10px 11px", borderRadius: 10, cursor: "pointer", marginBottom: 4, background: t.id === selId ? T.canvas : "transparent" }}>{renameId === t.id ? <input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Enter") { onRename(t.id, renameVal.trim() || t.name); setRenameId(null); } if (e.key === "Escape") setRenameId(null); }} onBlur={() => { onRename(t.id, renameVal.trim() || t.name); setRenameId(null); }} style={{ ...input, padding: "4px 6px", fontSize: 13, width: "100%" }} /> : <><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}><span style={{ fontSize: 13.5, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span><span style={{ fontSize: 10, color: T.faint, flexShrink: 0, textTransform: "uppercase", letterSpacing: 0.4 }}>{t.builtin ? "preset" : "custom"}</span></div><div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}>{t.tasks.length} tasks</div></>}</div>))}
            <button className="jes-ghost" onClick={() => { setSaving(true); setSaveName(""); }} disabled={!current.length} style={{ ...btnGhost, width: "100%", justifyContent: "center", marginTop: 8, opacity: current.length ? 1 : 0.5, cursor: current.length ? "pointer" : "not-allowed" }}><Save size={14} /> Save current as template</button>
            {saving && <div style={{ marginTop: 8, display: "flex", gap: 6 }}><input autoFocus value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Template name" onKeyDown={(e) => { if (e.key === "Enter" && saveName.trim()) { onSaveCurrent(saveName.trim()); setSaving(false); } }} style={{ ...input, flex: 1, padding: "6px 8px", fontSize: 12.5 }} /><button className="jes-primary" style={{ ...btnPrimary, padding: "6px 10px" }} onClick={() => { if (saveName.trim()) { onSaveCurrent(saveName.trim()); setSaving(false); } }}><Check size={14} /></button></div>}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ padding: "15px 20px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}><Eye size={15} style={{ color: T.faint }} /><span style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{sel?.name}</span></div><div style={{ display: "flex", gap: 7 }}>{sel && !sel.builtin && <><button className="jes-icon" title="Rename" onClick={() => { setRenameId(sel.id); setRenameVal(sel.name); }} style={btnIcon}><Pencil size={15} /></button><button className="jes-icon" title="Delete" onClick={() => onDelete(sel.id)} style={btnIcon}><Trash2 size={15} /></button></>}<button className="jes-primary" style={{ ...btnPrimary, padding: "8px 14px" }} onClick={() => onUse(sel)}>Add to checklist</button></div></div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>{[...phases.filter((ph) => sel?.tasks.some((t) => t.phase === ph)), ...[...new Set(sel?.tasks.map((t) => t.phase))].filter((ph) => !phases.includes(ph))].map((ph) => (<div key={ph} style={{ marginBottom: 14 }}><div style={{ ...lblStyle, marginBottom: 7 }}>{ph}</div>{sel.tasks.filter((t) => t.phase === ph).map((t, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 13.5, color: T.ink }}><Circle size={14} style={{ color: T.line }} />{t.text}</div>)}</div>))}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Phase editor                                                     */
/* ================================================================== */
function PhaseEditor({ phases, addPhase, renamePhase, removePhase }) {
  const [val, setVal] = useState("");
  return (<div style={{ marginTop: 10, padding: "12px 14px", background: T.canvas, borderRadius: 12, border: `1px solid ${T.line}` }}><div style={{ ...lblStyle, marginBottom: 9 }}>Checklist phases</div><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{phases.map((p) => (<div key={p} style={{ display: "flex", gap: 6, alignItems: "center" }}><input defaultValue={p} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== p) renamePhase(p, v); else e.target.value = p; }} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} style={{ ...input, flex: 1, padding: "6px 9px", fontSize: 12.5 }} /><button className="jes-icon" onClick={() => removePhase(p)} aria-label="Remove phase" style={{ ...btnIcon, opacity: phases.length > 1 ? 1 : 0.4, pointerEvents: phases.length > 1 ? "auto" : "none" }}><Trash2 size={14} /></button></div>))}</div><div style={{ display: "flex", gap: 6, marginTop: 9 }}><input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { addPhase(val.trim()); setVal(""); } }} placeholder="Add a phase" style={{ ...input, flex: 1, padding: "6px 9px", fontSize: 12.5 }} /><button className="jes-ghost" style={{ ...btnGhost, padding: "6px 11px" }} onClick={() => { if (val.trim()) { addPhase(val.trim()); setVal(""); } }}><Plus size={14} /></button></div></div>);
}

/* ================================================================== */
/*  Detail drawer                                                    */
/* ================================================================== */
function Drawer({ ev, onClose, update, phases, addPhase, renamePhase, removePhase, templates, saveTemplate, renameTemplate, deleteTemplate, notify }) {
  const [tab, setTab] = useState("overview");
  const [text, setText] = useState(""); const [phase, setPhase] = useState(phases[0]); const [addWho, setAddWho] = useState(""); const [addDue, setAddDue] = useState("");
  const [editId, setEditId] = useState(null); const [ed, setEd] = useState({ text: "", phase: "", who: "", due: "" });
  const [showPhases, setShowPhases] = useState(false); const [picker, setPicker] = useState(false);
  const c = entMeta(ev.entity).color;
  const setEvent = (patch) => update({ ...ev, ...patch });
  const setTasks = (tasks) => update({ ...ev, tasks });
  const toggle = (id) => { const t = ev.tasks.find((x) => x.id === id); setTasks(ev.tasks.map((x) => x.id === id ? { ...x, done: !x.done } : x)); notify(t.done ? "Task reopened" : "Task completed"); };
  const del = (id) => { setTasks(ev.tasks.filter((t) => t.id !== id)); notify("Task deleted"); };
  const add = () => { if (!text.trim()) return; setTasks([...ev.tasks, { id: ++_tid, phase, text: text.trim(), done: false, who: addWho || null, due: addDue || null }]); setText(""); setAddDue(""); setAddWho(""); notify("Task added"); };
  const startEdit = (t) => { setEditId(t.id); setEd({ text: t.text, phase: t.phase, who: t.who || "", due: t.due || "" }); };
  const saveEdit = () => { setTasks(ev.tasks.map((t) => t.id === editId ? { ...t, text: ed.text.trim() || t.text, phase: ed.phase, who: ed.who || null, due: ed.due || null } : t)); setEditId(null); notify("Task updated"); };
  const useTemplate = (t) => { t.tasks.forEach((x) => { if (!phases.includes(x.phase)) addPhase(x.phase); }); setTasks([...ev.tasks, ...t.tasks.map((x) => ({ id: ++_tid, phase: x.phase, text: x.text, done: false, who: null, due: null }))]); setPicker(false); notify(`Added ${t.tasks.length} tasks`); };
  const activePhases = phases.filter((ph) => ev.tasks.some((t) => t.phase === ph));
  const doneBox = (on) => ({ width: 19, height: 19, flexShrink: 0, borderRadius: 6, cursor: "pointer", display: "grid", placeItems: "center", background: on ? T.brand : T.surface, color: "#fff", border: on ? "none" : `1.5px solid ${T.line}`, transition: "all .15s ease" });
  const r = readiness(ev.tasks); const over = eventOverdue(ev);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      <div className="jes-scrim" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(26,33,31,.32)" }} />
      <aside className="jes-drawer" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(480px,96%)", background: T.surface, boxShadow: "-20px 0 54px rgba(26,33,31,.16)", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 4, background: c }} />
        <div style={{ padding: "18px 24px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}><Dot e={ev.entity} /><span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{ev.entity ? `${ev.entity}${ev.cat ? ` · ${ev.cat}` : ""}${ev.sub ? ` · ${ev.sub}` : ""}` : "Not categorized"}</span></div>
              <h2 style={{ ...serif(23), lineHeight: 1.12, margin: 0 }}>{ev.name}</h2>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}><Badge s={ev.status} /><span style={{ fontSize: 12.5, color: over ? "#A6473F" : T.muted, fontWeight: over ? 600 : 500 }}>{over ? `${over} overdue` : countdown(ev.date)}</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Ring value={r} size={52} stroke={4} center={ringCenter(ev)} title={r == null ? "No checklist" : `Checklist ${r}% complete`} />
              <button className="jes-icon" onClick={onClose} aria-label="Close" style={btnIcon}><X size={19} /></button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 16, borderBottom: `1px solid ${T.lineSoft}` }}>
            {[["overview", "Overview"], ["checklist", `Checklist${ev.tasks.length ? ` · ${ev.tasks.filter(t=>t.done).length}/${ev.tasks.length}` : ""}`]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "9px 4px", marginRight: 14, fontSize: 13, fontWeight: 600, color: tab === id ? T.ink : T.faint, borderBottom: `2px solid ${tab === id ? T.brand : "transparent"}`, marginBottom: -1 }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: "18px 24px 28px", flex: 1 }}>
          {tab === "overview" && <>
            <a href={libUrl(ev.name)} target="_blank" rel="noreferrer" className="jes-primary" style={{ ...btnPrimary, textDecoration: "none", width: "100%", justifyContent: "center", boxSizing: "border-box" }}><ExternalLink size={15} strokeWidth={2.2} /> Open {ev.name} library</a>
            <div style={{ marginTop: 22 }}>
              <SectionHead>Schedule</SectionHead>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                <Field label="Date"><input type="date" value={ev.date} onChange={(e) => setEvent({ date: e.target.value })} style={{ ...input, width: "100%" }} /></Field>
                <Field label="Time"><input value={ev.time} onChange={(e) => setEvent({ time: e.target.value })} style={{ ...input, width: "100%" }} /></Field>
                <div style={{ gridColumn: "1 / -1" }}><Field label="Venue"><input value={ev.venue} onChange={(e) => setEvent({ venue: e.target.value })} style={{ ...input, width: "100%" }} /></Field></div>
                <Field label="Status"><select value={ev.status} onChange={(e) => setEvent({ status: e.target.value })} style={{ ...input, width: "100%" }}>{STATUS_NAMES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              </div>
            </div>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 9, background: ev.entity ? T.canvas : STATUS.Planning.bg, border: `1px solid ${ev.entity ? T.line : "#EAD9B4"}`, borderRadius: 11, padding: "11px 13px" }}>
              <Info size={15} style={{ color: ev.entity ? T.faint : STATUS.Planning.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: ev.entity ? T.muted : "#7A5A1E", lineHeight: 1.45 }}>{ev.entity ? <>Filed under <strong style={{ color: T.ink }}>{ev.entity}{ev.cat ? ` · ${ev.cat}` : ""}{ev.sub ? ` · ${ev.sub}` : ""}</strong>. Change this in Manage.</> : <>Not categorized yet. Assign a section in Manage to see it in Browse and the calendar.</>}</span>
            </div>
            <div style={{ marginTop: 22 }}>
              <SectionHead>People on this event</SectionHead>
              <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 11 }}><AvatarStack names={assignees(ev)} size={28} max={6} /></div>
            </div>
          </>}

          {tab === "checklist" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><SectionHead>Checklist</SectionHead><div style={{ display: "flex", gap: 6 }}><button className="jes-mini" onClick={() => setShowPhases((v) => !v)} style={miniBtn} title="Edit phases"><Layers size={12} /> Phases</button><button className="jes-mini" onClick={() => setPicker(true)} style={miniBtn}><Sparkles size={12} /> Templates</button></div></div>
            {showPhases && <PhaseEditor phases={phases} addPhase={addPhase} renamePhase={renamePhase} removePhase={removePhase} />}
            {ev.tasks.length > 0 && <div style={{ marginTop: 12 }}>
              {activePhases.map((ph) => (
                <div key={ph} style={{ marginBottom: 14 }}>
                  <div style={{ ...lblStyle, margin: "8px 0" }}>{ph}</div>
                  {ev.tasks.filter((t) => t.phase === ph).map((t) => editId === t.id ? (
                    <div key={t.id} style={{ padding: 9, background: T.canvas, borderRadius: 11, marginBottom: 5 }}>
                      <input autoFocus value={ed.text} onChange={(e) => setEd({ ...ed, text: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditId(null); }} style={{ ...input, width: "100%", padding: "7px 10px" }} />
                      <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "start" }}>
                        <select value={ed.phase} onChange={(e) => setEd({ ...ed, phase: e.target.value })} style={{ ...input, flex: 1, padding: "7px 6px", fontSize: 12 }}>{phases.map((p) => <option key={p}>{p}</option>)}</select>
                        <div style={{ flex: 1.4 }}><PeoplePicker value={ed.who || null} onChange={(v) => setEd({ ...ed, who: v || "" })} small /></div>
                        <input type="date" value={ed.due} onChange={(e) => setEd({ ...ed, due: e.target.value })} style={{ ...input, flex: 1, padding: "7px 6px", fontSize: 12 }} />
                        <button className="jes-primary" style={{ ...btnPrimary, padding: "7px 9px" }} onClick={saveEdit} title="Save"><Check size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <div key={t.id} className="jes-task" style={{ display: "flex", alignItems: "start", gap: 11, padding: "8px", borderRadius: 9 }}>
                      <button onClick={() => toggle(t.id)} aria-label="Toggle" style={{ marginTop: 1, ...doneBox(t.done) }}>{t.done && <Check size={12} strokeWidth={3} />}</button>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, color: t.done ? T.ghost : T.ink, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</div>{(t.who || t.due) && <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 5, fontSize: 11.5 }}>{t.who && <span style={{ display: "flex", alignItems: "center", gap: 5, color: T.muted }}><Avatar name={t.who} size={17} />{t.who}</span>}{t.due && <span style={{ color: isOverdue(t) ? "#A6473F" : T.faint, fontWeight: isOverdue(t) ? 600 : 400 }}>{isOverdue(t) ? "overdue " : "due "}{fmtShort(t.due)}</span>}</div>}</div>
                      <button className="jes-rowx" onClick={() => startEdit(t)} aria-label="Edit task" style={rowAction} title="Edit"><Pencil size={13} /></button>
                      <button className="jes-rowx" onClick={() => del(t.id)} aria-label="Delete task" style={rowAction} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              ))}
            </div>}
            {!ev.tasks.length && <div style={{ marginTop: 14, textAlign: "center", padding: "26px 18px", border: `1px dashed ${T.line}`, borderRadius: 13, background: T.canvas }}><ListChecks size={22} style={{ color: T.ghost, margin: "0 auto 8px" }} /><p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px" }}>No checklist yet. Start from a template, or add tasks below.</p><button className="jes-ghost" style={{ ...btnGhost, margin: "0 auto" }} onClick={() => setPicker(true)}><Sparkles size={14} /> Browse templates</button></div>}
            <div style={{ marginTop: 13, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 12, padding: 11 }}>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a task" style={{ ...input, width: "100%", padding: "9px 11px" }} />
              <div style={{ display: "flex", gap: 6, marginTop: 7, alignItems: "start" }}>
                <select value={phase} onChange={(e) => setPhase(e.target.value)} style={{ ...input, flex: 1, padding: "7px 6px", fontSize: 12 }}>{phases.map((p) => <option key={p}>{p}</option>)}</select>
                <div style={{ flex: 1.4 }}><PeoplePicker value={addWho || null} onChange={(v) => setAddWho(v || "")} direction="up" small /></div>
                <input type="date" value={addDue} onChange={(e) => setAddDue(e.target.value)} style={{ ...input, flex: 1, padding: "7px 6px", fontSize: 12 }} />
                <button className="jes-primary" style={{ ...btnPrimary, padding: "7px 11px" }} onClick={add}><Plus size={15} strokeWidth={2.6} /></button>
              </div>
            </div>
          </>}
        </div>
      </aside>
      {picker && <TemplateModal templates={templates} phases={phases} current={ev.tasks} onClose={() => setPicker(false)} onUse={useTemplate} onSaveCurrent={(name) => { saveTemplate(name, ev.tasks); notify("Template saved"); }} onRename={renameTemplate} onDelete={(id) => { deleteTemplate(id); notify("Template deleted"); }} />}
    </div>
  );
}

/* ================================================================== */
/*  Event card + row                                                 */
/* ================================================================== */
function Card({ ev, onOpen }) {
  const c = entMeta(ev.entity).color; const r = readiness(ev.tasks); const over = eventOverdue(ev);
  return (
    <button className="jes-card" onClick={() => onOpen(ev)} style={{ textAlign: "left", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 15, padding: 0, cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
      <span style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: c }} />
      <div style={{ padding: "16px 17px 15px 20px", display: "flex", flexDirection: "column", gap: 13, flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, color: T.faint, marginBottom: 5, display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}><Dot e={ev.entity} size={7} />{entMeta(ev.entity).short}{ev.cat ? ` · ${ev.cat}` : ""}</div>
            <div style={{ ...serif(16.5), lineHeight: 1.18 }}>{ev.name}</div>
          </div>
          <Ring value={r} size={44} center={ringCenter(ev)} title={r == null ? "No checklist" : `Checklist ${r}% complete`} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5 }}>
          <span style={{ fontWeight: 600, color: over ? "#A6473F" : T.ink }}>{over ? `${over} overdue` : countdown(ev.date)}</span>
          <span style={{ color: T.ghost }}>·</span>
          <span style={{ color: T.muted }}>{fmtShort(ev.date) || "unscheduled"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          <AvatarStack names={assignees(ev)} size={22} max={4} />
          <Badge s={ev.status} />
        </div>
      </div>
    </button>
  );
}
function EventRow({ ev, onOpen }) {
  const r = readiness(ev.tasks); const over = eventOverdue(ev);
  return (
    <button className="jes-row" onClick={() => onOpen(ev)} style={{ display: "flex", alignItems: "center", gap: 15, width: "100%", textAlign: "left", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 13, padding: "12px 16px", cursor: "pointer", marginBottom: 8 }}>
      <Ring value={r} size={40} center={ringCenter(ev)} title={r == null ? "No checklist" : `Checklist ${r}% complete`} />
      <div style={{ minWidth: 0, flex: 1.4 }}>
        <div style={{ ...serif(15.5), lineHeight: 1.15 }}>{ev.name}</div>
        <div style={{ fontSize: 11.5, color: T.faint, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}><Dot e={ev.entity} size={7} />{entMeta(ev.entity).short}{ev.cat ? ` · ${ev.cat}` : ""}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: over ? "#A6473F" : T.ink }}>{over ? `${over} overdue` : countdown(ev.date)}</div><div style={{ fontSize: 11.5, color: T.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}><MapPin size={11} />{ev.venue || "TBD"}</div></div>
      <AvatarStack names={assignees(ev)} size={22} max={3} />
      <Badge s={ev.status} />
      <ChevronRight size={17} style={{ color: T.ghost, flexShrink: 0 }} />
    </button>
  );
}

/* ================================================================== */
/*  Overview                                                         */
/* ================================================================== */
function StatTile({ icon: Icon, value, label, tone, onClick }) {
  return (
    <button className="jes-tile" onClick={onClick} style={{ textAlign: "left", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 15, padding: "16px 18px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, flex: "1 1 150px", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Icon size={17} style={{ color: tone || T.faint }} /><ArrowUpRight size={15} className="jes-tile-arrow" style={{ color: T.ghost, opacity: 0, transition: "opacity .15s" }} /></div>
      <div><div style={{ ...serif(30), lineHeight: 1, color: tone && value ? tone : T.ink }}>{value}</div><div style={{ fontSize: 12, color: T.muted, marginTop: 5 }}>{label}</div></div>
    </button>
  );
}
function Overview({ events, me, onOpen, go, showUncat, notify, toggleTask }) {
  const categorized = events.filter((e) => e.entity);
  const upcoming = categorized.filter((e) => { const d = daysUntil(e.date); return d != null && d >= 0 && e.status !== "Complete"; }).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const uncats = events.filter((e) => !e.entity);
  const myTasks = []; events.forEach((e) => e.tasks.forEach((t) => { if (t.who === me && !t.done) myTasks.push({ e, t }); }));
  myTasks.sort((a, b) => (a.t.due ? new Date(a.t.due) : Infinity) - (b.t.due ? new Date(b.t.due) : Infinity));
  const overdueAll = []; events.forEach((e) => e.tasks.forEach((t) => { if (isOverdue(t)) overdueAll.push({ e, t }); }));
  const perSection = ENTITY_NAMES.map((n) => ({ n, c: entMeta(n).color, count: categorized.filter((e) => e.entity === n).length })).filter((x) => x.count);
  const totalSec = perSection.reduce((a, b) => a + b.count, 0) || 1;
  const now = new Date(TODAY + "T00:00:00");
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div><div style={{ fontSize: 12.5, color: T.faint, marginBottom: 5, fontWeight: 600 }}>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div><h1 style={{ ...serif(28), margin: 0 }}>Good afternoon, {me.split(" ")[0]}</h1></div>
        <button className="jes-primary" onClick={() => go("events")} style={{ ...btnPrimary }}><LayoutGrid size={15} /> Browse events</button>
      </div>

      <div style={{ display: "flex", gap: 13, marginBottom: 22, flexWrap: "wrap" }}>
        <StatTile icon={LayoutGrid} value={categorized.length} label="Events tracked" onClick={() => go("events")} />
        <StatTile icon={CalendarRange} value={upcoming.length} label="Upcoming" onClick={() => go("calendar")} />
        <StatTile icon={CheckSquare} value={myTasks.length} label="Your open tasks" onClick={() => go("tasks")} />
        <StatTile icon={AlertCircle} value={uncats.length + overdueAll.length} label="Need attention" tone={(uncats.length + overdueAll.length) ? "#A6473F" : undefined} onClick={() => (uncats.length ? showUncat() : go("tasks"))} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18, alignItems: "start" }} className="jes-ov-grid">
        {/* Up next */}
        <div style={panel}>
          <div style={panelHead}><span style={{ ...serif(17) }}>Up next</span><button className="jes-link" onClick={() => go("calendar")} style={linkBtn}>Calendar <ArrowRight size={13} /></button></div>
          <div style={{ padding: "6px 8px 10px" }}>
            {!upcoming.length && <Empty icon={CalendarRange} title="Nothing scheduled" body="Set a date on an event and it will appear here." />}
            {upcoming.slice(0, 6).map((e) => (
              <button key={e.id} className="jes-uprow" onClick={() => onOpen(e)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "10px 11px", borderRadius: 11, cursor: "pointer" }}>
                <Ring value={readiness(e.tasks)} size={42} center={ringCenter(e)} title={readiness(e.tasks) == null ? "No checklist" : `Checklist ${readiness(e.tasks)}% complete`} />
                <div style={{ minWidth: 0, flex: 1 }}><div style={{ ...serif(15), lineHeight: 1.15 }}>{e.name}</div><div style={{ fontSize: 11.5, color: T.muted, marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}><Dot e={e.entity} size={7} />{entMeta(e.entity).short}<span style={{ color: T.ghost }}>·</span><MapPin size={11} />{e.venue || "TBD"}</div></div>
                <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{countdown(e.date)}</div><div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}>{fmtShort(e.date)} · {e.time}</div></div>
              </button>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={panel}>
            <div style={panelHead}><span style={{ ...serif(16) }}>Needs attention</span></div>
            <div style={{ padding: "6px 14px 14px" }}>
              {!uncats.length && !overdueAll.length && <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 2px", color: T.muted, fontSize: 13 }}><CircleCheck size={17} style={{ color: T.brand }} /> All clear. Nothing needs attention.</div>}
              {uncats.length > 0 && <div style={{ marginBottom: overdueAll.length ? 14 : 0 }}>
                <div style={{ fontSize: 11.5, color: T.faint, fontWeight: 600, marginBottom: 7 }}>{uncats.length} uncategorized {uncats.length === 1 ? "event" : "events"}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{uncats.slice(0, 5).map((e) => <button key={e.id} className="jes-chip" onClick={() => onOpen(e)} style={chip}>{e.name}</button>)}</div>
                <button className="jes-link" onClick={showUncat} style={{ ...linkBtn, marginTop: 9 }}>Categorize in Manage <ArrowRight size={13} /></button>
              </div>}
              {overdueAll.length > 0 && <div>
                <div style={{ fontSize: 11.5, color: "#A6473F", fontWeight: 600, marginBottom: 7 }}>{overdueAll.length} overdue {overdueAll.length === 1 ? "task" : "tasks"}</div>
                {overdueAll.slice(0, 3).map(({ e, t }) => <button key={t.id} className="jes-uprow" onClick={() => onOpen(e)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "6px 4px", borderRadius: 8, cursor: "pointer" }}><span style={{ width: 6, height: 6, borderRadius: 99, background: "#A6473F", flexShrink: 0 }} /><span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.text}</span><span style={{ fontSize: 11, color: T.faint }}>{e.name}</span></button>)}
              </div>}
            </div>
          </div>

          <div style={panel}>
            <div style={panelHead}><span style={{ ...serif(16) }}>Your open tasks</span><button className="jes-link" onClick={() => go("tasks")} style={linkBtn}>All <ArrowRight size={13} /></button></div>
            <div style={{ padding: "4px 8px 10px" }}>
              {!myTasks.length && <Empty icon={CheckSquare} title="You're all caught up" body="Tasks assigned to you show up here." small />}
              {myTasks.slice(0, 4).map(({ e, t }) => (
                <div key={t.id} className="jes-task" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 9px", borderRadius: 9 }}>
                  <button onClick={() => toggleTask(e.id, t.id)} aria-label="Complete" style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 6, cursor: "pointer", border: `1.5px solid ${T.line}`, background: T.surface }} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.text}</div><button className="jes-link" onClick={() => onOpen(e)} style={{ ...linkBtn, fontSize: 11, marginTop: 2 }}>{e.name}</button></div>
                  {t.due && <span style={{ fontSize: 11.5, color: isOverdue(t) ? "#A6473F" : T.faint, fontWeight: isOverdue(t) ? 600 : 500, flexShrink: 0 }}>{fmtShort(t.due)}</span>}
                </div>
              ))}
            </div>
          </div>

          {perSection.length > 0 && <div style={panel}>
            <div style={panelHead}><span style={{ ...serif(16) }}>By section</span></div>
            <div style={{ padding: "6px 16px 16px" }}>
              <div style={{ display: "flex", height: 9, borderRadius: 99, overflow: "hidden", marginBottom: 13 }}>{perSection.map((s) => <div key={s.n} title={`${s.n}: ${s.count}`} style={{ width: `${s.count / totalSec * 100}%`, background: s.c }} />)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 14px" }}>{perSection.map((s) => <span key={s.n} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: T.muted }}><Dot e={s.n} size={8} />{entMeta(s.n).short}<span style={{ color: T.ink, fontWeight: 600 }}>{s.count}</span></span>)}</div>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}
function Empty({ icon: Icon, title, body, small }) {
  return <div style={{ textAlign: "center", padding: small ? "22px 16px" : "34px 20px", color: T.faint }}><Icon size={small ? 20 : 26} style={{ color: T.ghost, margin: "0 auto 9px" }} /><div style={{ fontSize: 13.5, fontWeight: 600, color: T.muted }}>{title}</div>{body && <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 260, margin: "4px auto 0", lineHeight: 1.5 }}>{body}</div>}</div>;
}

/* ================================================================== */
/*  Events (browse)                                                  */
/* ================================================================== */
function Events({ events, onOpen, filters, setFilters }) {
  const { section, status, q, attention, sort, layout } = filters;
  let visible = events.filter((e) => e.entity && (section === "All" || e.entity === section) && (status === "All" || e.status === status) && (!q || (e.name + (e.cat || "") + (e.entity || "")).toLowerCase().includes(q.toLowerCase())) && (!attention || eventOverdue(e) > 0));
  const sorter = { soonest: (a, b) => (daysUntil(a.date) ?? 9e9) - (daysUntil(b.date) ?? 9e9), name: (a, b) => a.name.localeCompare(b.name), readiness: (a, b) => (readiness(a.tasks) ?? -1) - (readiness(b.tasks) ?? -1) };
  if (layout === "list") { const rows = [...visible].sort(sorter[sort]); return rows.length ? <div style={{ maxWidth: 900 }}>{rows.map((e) => <EventRow key={e.id} ev={e} onOpen={onOpen} />)}</div> : <Empty icon={Inbox} title="No events match" body="Clear a filter, or check Manage for anything uncategorized." />; }
  const groups = {}; visible.forEach((e) => { const g = (groups[e.entity] ||= {}); (g[e.cat || "_direct"] ||= []).push(e); });
  Object.values(groups).forEach((g) => Object.values(g).forEach((arr) => arr.sort(sorter[sort])));
  const order = section === "All" ? ENTITY_NAMES : [section];
  if (!visible.length) return <Empty icon={Inbox} title="No events match" body="Clear a filter, or check Manage for anything uncategorized." />;
  return (
    <div>{order.filter((en) => groups[en]).map((en) => (
      <section key={en} style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: entMeta(en).color }} /><h3 style={{ ...serif(18), margin: 0 }}>{en}</h3><span style={{ fontSize: 12, color: T.faint, background: T.hair, padding: "2px 9px", borderRadius: 99 }}>{Object.values(groups[en]).flat().length}</span></div>
        {Object.keys(groups[en]).sort().map((catKey) => (<div key={catKey} style={{ marginBottom: 16 }}>{catKey !== "_direct" && <div style={{ ...lblStyle, margin: "0 0 10px 2px" }}>{catKey}</div>}<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))", gap: 14 }}>{groups[en][catKey].map((e) => <Card key={e.id} ev={e} onOpen={onOpen} />)}</div></div>))}
      </section>))}
    </div>
  );
}

/* ================================================================== */
/*  Calendar                                                         */
/* ================================================================== */
function Calendar({ events, onOpen, filters }) {
  const [cur, setCur] = useState({ y: 2026, m: 6 });
  const inScope = (e) => e.date && (filters.section === "All" || e.entity === filters.section) && (filters.status === "All" || e.status === filters.status);
  const byDay = {}; const monthList = [];
  events.forEach((e) => { if (!inScope(e)) return; const d = new Date(e.date + "T00:00:00"); if (d.getFullYear() === cur.y && d.getMonth() === cur.m) { (byDay[d.getDate()] ||= []).push(e); monthList.push(e); } });
  monthList.sort((a, b) => new Date(a.date) - new Date(b.date));
  const startDay = new Date(cur.y, cur.m, 1).getDay(); const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = []; for (let i = 0; i < startDay; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d); while (cells.length % 7) cells.push(null);
  const shift = (n) => setCur(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const isToday = (d) => cur.y === 2026 && cur.m === 6 && d === 27;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }} className="jes-cal-grid">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}><button className="jes-icon" onClick={() => shift(-1)} aria-label="Previous month" style={btnIcon}><ChevronLeft size={18} /></button><h3 style={{ ...serif(19), margin: 0, width: 172, textAlign: "center" }}>{MONTHS[cur.m]} {cur.y}</h3><button className="jes-icon" onClick={() => shift(1)} aria-label="Next month" style={btnIcon}><ChevronRight size={18} /></button><button className="jes-ghost" style={{ ...btnGhost, marginLeft: 8, padding: "7px 13px" }} onClick={() => setCur({ y: 2026, m: 6 })}>Today</button></div>
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="jes-dow" style={{ padding: "10px", fontSize: 10.5, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${T.lineSoft}`, background: T.canvas }}>{d}</div>)}
            {cells.map((d, i) => (<div key={i} className="jes-day" style={{ minHeight: 96, borderBottom: `1px solid ${T.lineSoft}`, borderRight: (i % 7 !== 6) ? `1px solid ${T.lineSoft}` : "none", padding: 6, background: d ? T.surface : T.raise, display: "flex", flexDirection: "column", gap: 3 }}>{d && <div style={{ fontSize: 11.5, fontWeight: 600, color: isToday(d) ? "#fff" : T.muted, alignSelf: "flex-start", width: 21, height: 21, borderRadius: 99, display: "grid", placeItems: "center", background: isToday(d) ? T.brand : "transparent" }}>{d}</div>}{(byDay[d] || []).slice(0, 3).map((e) => (<button key={e.id} onClick={() => onOpen(e)} className="jes-calev" title={`${e.name} · ${e.time}`} style={{ textAlign: "left", border: "none", cursor: "pointer", background: entMeta(e.entity).color + "18", color: entMeta(e.entity).color, borderLeft: `3px solid ${entMeta(e.entity).color}`, borderRadius: 5, padding: "2px 6px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</button>))}{(byDay[d] || []).length > 3 && <span style={{ fontSize: 10.5, color: T.faint, paddingLeft: 4 }}>+{byDay[d].length - 3} more</span>}</div>))}
          </div>
        </div>
      </div>
      <div style={panel}>
        <div style={panelHead}><span style={{ ...serif(16) }}>{MONTHS[cur.m]} agenda</span><span style={{ fontSize: 12, color: T.faint }}>{monthList.length}</span></div>
        <div style={{ padding: "6px 10px 12px", maxHeight: 460, overflowY: "auto" }}>
          {!monthList.length && <Empty icon={CalendarRange} title="No events this month" small />}
          {monthList.map((e) => (
            <button key={e.id} className="jes-uprow" onClick={() => onOpen(e)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "9px 10px", borderRadius: 10, cursor: "pointer" }}>
              <div style={{ textAlign: "center", width: 34, flexShrink: 0 }}><div style={{ fontSize: 16, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{new Date(e.date + "T00:00:00").getDate()}</div><div style={{ fontSize: 10, color: T.faint, textTransform: "uppercase", marginTop: 2 }}>{new Date(e.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</div></div>
              <div style={{ minWidth: 0, flex: 1, borderLeft: `2px solid ${entMeta(e.entity).color}`, paddingLeft: 10 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div><div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{e.time} · {e.venue}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tasks                                                            */
/* ================================================================== */
function Tasks({ events, me, onOpen, toggleTask, notify }) {
  const [scope, setScope] = useState("me"); const [person, setPerson] = useState(null); const [groupBy, setGroupBy] = useState("due");
  const all = []; events.forEach((e) => e.tasks.forEach((t) => { if (t.done) return; if (scope === "me" && t.who !== me) return; if (scope === "person" && person && t.who !== person) return; all.push({ e, t }); }));
  const overN = all.filter((x) => isOverdue(x.t)).length;
  let groups = [];
  if (groupBy === "due") {
    const b = { Overdue: [], Today: [], "This week": [], Later: [], "No date": [] };
    all.forEach((x) => { const d = daysUntil(x.t.due); if (x.t.due == null) b["No date"].push(x); else if (d < 0) b.Overdue.push(x); else if (d === 0) b.Today.push(x); else if (d <= 7) b["This week"].push(x); else b.Later.push(x); });
    groups = Object.entries(b).filter(([, v]) => v.length).map(([k, v]) => ({ key: k, items: v.sort((a, z) => (a.t.due ? new Date(a.t.due) : Infinity) - (z.t.due ? new Date(z.t.due) : Infinity)) }));
  } else {
    const m = {}; all.forEach((x) => { (m[x.e.id] ||= { key: x.e.name, e: x.e, items: [] }).items.push(x); }); groups = Object.values(m);
  }
  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <Seg options={[["me", "Assigned to me"], ["all", "Everyone"], ["person", "By person"]]} value={scope} onChange={setScope} />
        {scope === "person" && <div style={{ width: 210 }}><PeoplePicker value={person} onChange={setPerson} small /></div>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12.5, color: T.muted }}>{all.length} open{overN ? ` · ${overN} overdue` : ""}</span>
        <Seg options={[["due", "By due"], ["event", "By event"]]} value={groupBy} onChange={setGroupBy} />
      </div>
      {!all.length && <Empty icon={CheckSquare} title="Nothing open here" body={scope === "me" ? "Tasks assigned to you will appear here." : "No open tasks match this view."} />}
      {groups.map((g) => (
        <div key={g.key} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
            {groupBy === "event" && <Dot e={g.e.entity} />}
            <span style={{ fontSize: 13, fontWeight: 700, color: g.key === "Overdue" ? "#A6473F" : T.ink }}>{g.key}</span>
            <span style={{ fontSize: 11.5, color: T.faint, background: T.hair, padding: "1px 8px", borderRadius: 99 }}>{g.items.length}</span>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 13, overflow: "hidden" }}>
            {g.items.map(({ e, t }, i) => (
              <div key={t.id} className="jes-task" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 15px", borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
                <button onClick={() => toggleTask(e.id, t.id)} aria-label="Complete" style={{ width: 19, height: 19, flexShrink: 0, borderRadius: 6, cursor: "pointer", border: `1.5px solid ${T.line}`, background: T.surface }} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, color: T.ink }}>{t.text}</div><button className="jes-link" onClick={() => onOpen(e)} style={{ ...linkBtn, fontSize: 11.5, marginTop: 3 }}><Dot e={e.entity} size={6} /> {e.name}</button></div>
                <span className="jes-phasepill" style={{ fontSize: 10.5, fontWeight: 600, color: T.muted, background: T.hair, padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap" }}>{t.phase}</span>
                {t.who && <Avatar name={t.who} size={22} />}
                <span style={{ fontSize: 12, color: isOverdue(t) ? "#A6473F" : T.faint, fontWeight: isOverdue(t) ? 600 : 500, width: 74, textAlign: "right", whiteSpace: "nowrap" }}>{t.due ? fmtShort(t.due) : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function Seg({ options, value, onChange }) {
  return <div style={{ display: "inline-flex", background: T.hair, borderRadius: 9, padding: 3, gap: 2 }}>{options.map(([v, l]) => <button key={v} onClick={() => onChange(v)} style={{ border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 7, fontSize: 12.5, fontWeight: 600, background: value === v ? T.surface : "transparent", color: value === v ? T.ink : T.muted, boxShadow: value === v ? "0 1px 3px rgba(26,33,31,.1)" : "none" }}>{l}</button>)}</div>;
}

/* ================================================================== */
/*  Manage                                                           */
/* ================================================================== */
function ManageLibraries({ events, unregistered, update, onOpen, taxonomy, onAdd, notify, bulkUpdate }) {
  const [onlyUncat, setOnlyUncat] = useState(false); const [q, setQ] = useState(""); const [sel, setSel] = useState(() => new Set());
  let rows = events.filter((e) => (!onlyUncat || !e.entity) && (!q || e.name.toLowerCase().includes(q.toLowerCase())));
  const uncat = events.filter((e) => !e.entity).length; const total = events.length + unregistered.length;
  const cell = { padding: "10px 13px", verticalAlign: "middle", fontSize: 13 };
  const seln = { border: `1px solid ${T.line}`, borderRadius: 7, padding: "6px 8px", fontSize: 12.5, color: T.ink, background: T.surface, cursor: "pointer", maxWidth: 170, width: "100%" };
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSel = rows.length && rows.every((r) => sel.has(r.id));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: T.muted }}><Library size={16} style={{ color: T.brand }} /> {total} libraries · {events.length} tracked · {unregistered.length} not added{unregistered.length ? <> (<button className="jes-link" onClick={onAdd} style={{ ...linkBtn, display: "inline" }}>add</button>)</> : null}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.ghost }} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" style={{ ...input, padding: "8px 10px 8px 30px", width: 160, background: T.canvas }} /></div>
          <button className="jes-ghost" style={{ ...btnGhost, borderColor: onlyUncat ? T.brand : T.line, color: onlyUncat ? T.ink : T.muted }} onClick={() => setOnlyUncat((v) => !v)}><Filter size={14} /> Uncategorized</button>
        </div>
      </div>
      {sel.size > 0 && <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 15px", background: T.brand, borderRadius: 11, color: "#fff", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{sel.size} selected</span>
        <span style={{ fontSize: 12.5, opacity: 0.85 }}>Set section</span>
        <select onChange={(e) => { if (e.target.value) { bulkUpdate([...sel], { entity: e.target.value, cat: "", sub: "" }); notify(`Updated ${sel.size} events`); setSel(new Set()); } }} defaultValue="" style={{ ...seln, maxWidth: 190, color: T.ink }}><option value="" disabled>Choose…</option>{ENTITY_NAMES.map((n) => <option key={n}>{n}</option>)}</select>
        <div style={{ flex: 1 }} /><button className="jes-link" onClick={() => setSel(new Set())} style={{ ...linkBtn, color: "#fff" }}>Clear</button>
      </div>}
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead><tr style={{ background: T.canvas, color: T.faint }}>
              <th style={{ ...cell, width: 38 }}><input type="checkbox" checked={!!allSel} onChange={() => setSel(allSel ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
              {["Event","Section","Category","Subcategory","Date","Status",""].map((h, i) => <th key={i} style={{ ...cell, textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((e, i) => {
                const un = !e.entity; const cats = e.entity ? Object.keys(taxonomy[e.entity]) : []; const subs = e.entity && e.cat && taxonomy[e.entity][e.cat] ? taxonomy[e.entity][e.cat] : [];
                return (
                  <tr key={e.id} style={{ borderTop: `1px solid ${T.lineSoft}`, background: sel.has(e.id) ? T.hair : un ? "#FCF8EF" : T.surface }}>
                    <td style={cell}><input type="checkbox" checked={sel.has(e.id)} onChange={() => toggle(e.id)} /></td>
                    <td style={cell}><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{un ? <AlertCircle size={14} style={{ color: STATUS.Planning.color, flexShrink: 0 }} /> : <Dot e={e.entity} />}<button onClick={() => onOpen(e)} className="jes-link" style={{ ...linkBtn, fontWeight: 600, color: T.ink }}>{e.name}</button></div></td>
                    <td style={cell}><select value={e.entity || ""} onChange={(ev) => { update({ ...e, entity: ev.target.value || null, cat: "", sub: "" }); notify(ev.target.value ? "Section assigned" : "Section cleared"); }} style={{ ...seln, borderColor: un ? STATUS.Planning.color : T.line }}><option value="">— assign —</option>{ENTITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</select></td>
                    <td style={cell}>{cats.length ? <select value={e.cat || ""} onChange={(ev) => update({ ...e, cat: ev.target.value, sub: "" })} style={seln}><option value="">— none —</option>{cats.map((c) => <option key={c}>{c}</option>)}</select> : <span style={{ color: T.ghost, fontSize: 12 }}>{e.entity ? "direct" : "—"}</span>}</td>
                    <td style={cell}>{subs.length ? <select value={e.sub || ""} onChange={(ev) => update({ ...e, sub: ev.target.value })} style={seln}><option value="">— none —</option>{subs.map((s) => <option key={s}>{s}</option>)}</select> : <span style={{ color: T.ghost, fontSize: 12 }}>—</span>}</td>
                    <td style={{ ...cell, color: T.muted, whiteSpace: "nowrap" }}>{fmtShort(e.date) || "—"}</td>
                    <td style={cell}><select value={e.status} onChange={(ev) => update({ ...e, status: ev.target.value })} style={{ ...seln, maxWidth: 130 }}>{STATUS_NAMES.map((s) => <option key={s}>{s}</option>)}</select></td>
                    <td style={cell}><a href={libUrl(e.name)} target="_blank" rel="noreferrer" className="jes-icon" title="Open library" style={{ ...btnIcon, display: "inline-grid" }}><ExternalLink size={15} /></a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {uncat > 0 && !onlyUncat && <p style={{ fontSize: 12.5, color: T.muted, marginTop: 12 }}>Rows shaded amber are events with no section assigned yet. Assign a section and they appear in Browse.</p>}
    </div>
  );
}
function Taxonomy({ taxonomy, addCategory, renameCategory, removeCategory, addSub, renameSub, removeSub, notify }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,320px),1fr))", gap: 16, alignItems: "start" }}>
      {ENTITY_NAMES.map((section) => (
        <div key={section} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "13px 16px", borderBottom: `1px solid ${T.lineSoft}` }}><span style={{ width: 11, height: 11, borderRadius: 3, background: entMeta(section).color }} /><span style={{ ...serif(15.5) }}>{section}</span></div>
          <div style={{ padding: "11px 15px 15px" }}>
            {!Object.keys(taxonomy[section]).length && <p style={{ fontSize: 12, color: T.faint, margin: "4px 0 11px" }}>No categories. Events sit directly under this section.</p>}
            {Object.entries(taxonomy[section]).map(([cat, subs]) => (
              <div key={cat} style={{ marginBottom: 13, paddingBottom: 11, borderBottom: `1px solid ${T.lineSoft}` }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}><input defaultValue={cat} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== cat) { renameCategory(section, cat, v); notify("Category renamed"); } else e.target.value = cat; }} style={{ ...input, flex: 1, padding: "7px 9px", fontWeight: 600 }} /><button className="jes-icon" onClick={() => { removeCategory(section, cat); notify("Category removed"); }} aria-label="Remove category" style={btnIcon}><Trash2 size={15} /></button></div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9, paddingLeft: 4 }}>{subs.map((s) => (<span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 8, padding: "3px 4px 3px 9px", fontSize: 12 }}><input defaultValue={s} onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s) { renameSub(section, cat, s, v); } else e.target.value = s; }} style={{ border: "none", background: "transparent", fontSize: 12, color: T.ink, width: Math.max(46, s.length * 7), outline: "none" }} /><button className="jes-icon" onClick={() => removeSub(section, cat, s)} aria-label="Remove subcategory" style={{ ...btnIcon, padding: 2 }}><X size={12} /></button></span>))}<SubAdd onAdd={(v) => addSub(section, cat, v)} /></div>
              </div>
            ))}
            <CatAdd onAdd={(v) => { addCategory(section, v); notify("Category added"); }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function CatAdd({ onAdd }) { const [v, setV] = useState(""); return <div style={{ display: "flex", gap: 6, marginTop: 4 }}><input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} placeholder="Add category" style={{ ...input, flex: 1, padding: "7px 9px", fontSize: 12.5 }} /><button className="jes-ghost" style={{ ...btnGhost, padding: "7px 11px" }} onClick={() => { if (v.trim()) { onAdd(v.trim()); setV(""); } }}><Plus size={14} /></button></div>; }
function SubAdd({ onAdd }) { const [v, setV] = useState(""); return <span style={{ display: "inline-flex", alignItems: "center" }}><input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onAdd(v.trim()); setV(""); } }} placeholder="+ subcategory" style={{ border: `1px dashed ${T.line}`, background: "transparent", borderRadius: 8, padding: "3px 9px", fontSize: 12, color: T.ink, width: 108, outline: "none" }} /></span>; }

/* ================================================================== */
/*  App                                                              */
/* ================================================================== */
export default function App() {
  const [events, setEvents] = useState(seed);
  const [unregistered, setUnregistered] = useState(SEED_UNREGISTERED);
  const [taxonomy, setTaxonomy] = useState(SEED_TAXONOMY);
  const [phases, setPhases] = useState(SEED_PHASES);
  const [templates, setTemplates] = useState(SEED_TEMPLATES);
  const [me] = useState(ME);
  const [view, setView] = useState("overview");
  const [manageTab, setManageTab] = useState("libraries");
  const [filters, setFilters] = useState({ section: "All", status: "All", q: "", attention: false, sort: "soonest", layout: "grid" });
  const [open, setOpen] = useState(null); const [adding, setAdding] = useState(false); const [cmdk, setCmdk] = useState(false);
  const [toasts, setToasts] = useState([]);
  const notify = useCallback((msg) => { const id = Math.random(); setToasts((t) => [...t, { id, msg }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600); }, []);

  const update = (e) => setEvents((p) => p.map((x) => x.id === e.id ? e : x));
  const bulkUpdate = (ids, patch) => setEvents((p) => p.map((x) => ids.includes(x.id) ? { ...x, ...patch } : x));
  const toggleTask = (evId, taskId) => { let msg = ""; setEvents((p) => p.map((e) => e.id === evId ? { ...e, tasks: e.tasks.map((t) => { if (t.id === taskId) { msg = t.done ? "Task reopened" : "Task completed"; return { ...t, done: !t.done }; } return t; }) } : e)); if (msg) notify(msg); };
  const openEv = events.find((e) => open && e.id === open.id) || null;
  const uncat = events.filter((e) => !e.entity).length;
  const myOpen = useMemo(() => { let n = 0; events.forEach((e) => e.tasks.forEach((t) => { if (t.who === me && !t.done) n++; })); return n; }, [events, me]);

  const addEvents = (items) => {
    const names = items.map((i) => i.name);
    setEvents((p) => [...items.map((i) => ({ id: ++_id, name: i.name, entity: i.entity || null, cat: i.cat || "", sub: i.sub || "", status: i.status || "Planning", date: i.date || "", time: i.time || "9:00 AM", venue: i.venue || "", tasks: [] })), ...p]);
    setUnregistered((u) => u.filter((x) => !names.includes(x.name)));
    setAdding(false);
    const allTagged = items.every((i) => i.entity);
    setView(allTagged ? "events" : "manage"); setManageTab("libraries");
    notify(`Added ${names.length} ${names.length === 1 ? "event" : "events"}`);
  };

  const addCategory = (s, n) => setTaxonomy((t) => t[s][n] ? t : { ...t, [s]: { ...t[s], [n]: [] } });
  const renameCategory = (s, o, n) => { setTaxonomy((t) => { const c = { ...t[s] }; const subs = c[o]; delete c[o]; c[n] = subs; return { ...t, [s]: c }; }); setEvents((p) => p.map((e) => e.entity === s && e.cat === o ? { ...e, cat: n } : e)); };
  const removeCategory = (s, n) => { setTaxonomy((t) => { const c = { ...t[s] }; delete c[n]; return { ...t, [s]: c }; }); setEvents((p) => p.map((e) => e.entity === s && e.cat === n ? { ...e, cat: "", sub: "" } : e)); };
  const addSub = (s, c, n) => setTaxonomy((t) => t[s][c].includes(n) ? t : { ...t, [s]: { ...t[s], [c]: [...t[s][c], n] } });
  const renameSub = (s, c, o, n) => { setTaxonomy((t) => ({ ...t, [s]: { ...t[s], [c]: t[s][c].map((x) => x === o ? n : x) } })); setEvents((p) => p.map((e) => e.entity === s && e.cat === c && e.sub === o ? { ...e, sub: n } : e)); };
  const removeSub = (s, c, n) => { setTaxonomy((t) => ({ ...t, [s]: { ...t[s], [c]: t[s][c].filter((x) => x !== n) } })); setEvents((p) => p.map((e) => e.entity === s && e.cat === c && e.sub === n ? { ...e, sub: "" } : e)); };
  const addPhase = (n) => setPhases((p) => p.includes(n) ? p : [...p, n]);
  const renamePhase = (o, n) => { setPhases((p) => p.map((x) => x === o ? n : x)); setEvents((p) => p.map((e) => ({ ...e, tasks: e.tasks.map((t) => t.phase === o ? { ...t, phase: n } : t) }))); };
  const removePhase = (n) => setPhases((p) => { if (p.length <= 1) return p; const rest = p.filter((x) => x !== n); setEvents((ev) => ev.map((e) => ({ ...e, tasks: e.tasks.map((t) => t.phase === n ? { ...t, phase: rest[0] } : t) }))); return rest; });
  const saveTemplate = (name, tasks) => setTemplates((t) => [...t, tpl(name, false, tasks.map((x) => ({ phase: x.phase, text: x.text })))]);
  const renameTemplate = (id, name) => setTemplates((t) => t.map((x) => x.id === id ? { ...x, name } : x));
  const deleteTemplate = (id) => setTemplates((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdk((v) => !v); }
      else if (e.key === "Escape") { if (cmdk) setCmdk(false); else if (adding) setAdding(false); else if (open) setOpen(null); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [cmdk, adding, open]);

  const NAV = [["overview", "Overview", LayoutDashboard], ["events", "Events", LayoutGrid], ["calendar", "Calendar", CalendarRange], ["tasks", "Tasks", CheckSquare], ["manage", "Manage", SlidersHorizontal]];
  const viewTitle = { overview: "Overview", events: "Events", calendar: "Calendar", tasks: "Tasks", manage: "Manage" };
  const goOpen = (e) => { setOpen({ id: e.id }); };
  const showUncat = () => { setView("manage"); setManageTab("libraries"); };

  const filterBar = (view === "events" || view === "calendar");

  return (
    <div style={{ background: T.canvas, minHeight: 680, height: "90vh", borderRadius: 16, overflow: "hidden", position: "relative", fontFamily: "-apple-system,'Segoe UI',Roboto,Arial,sans-serif", color: T.ink, display: "flex", border: `1px solid ${T.line}` }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Rail */}
      <nav className="jes-rail" style={{ width: 68, background: T.surface, borderRight: `1px solid ${T.line}`, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", flexShrink: 0, gap: 6 }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: T.brand, color: "#fff", display: "grid", placeItems: "center", ...serifRaw, fontWeight: 700, fontSize: 15, marginBottom: 14 }}>J</div>
        {NAV.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)} className={"jes-navbtn" + (view === id ? " active" : "")} title={label} style={{ position: "relative", width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", background: view === id ? T.brand : "transparent", color: view === id ? "#fff" : T.faint, display: "grid", placeItems: "center" }}>
            <Icon size={19} strokeWidth={view === id ? 2.2 : 1.9} />
            {id === "tasks" && myOpen > 0 && <span style={{ position: "absolute", top: 6, right: 6, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 99, background: view === id ? "#fff" : T.brand, color: view === id ? T.brand : "#fff", fontSize: 9.5, fontWeight: 800, display: "grid", placeItems: "center", boxSizing: "border-box" }}>{myOpen}</span>}
            {id === "manage" && uncat > 0 && <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 99, background: "#B0843B" }} />}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="jes-navbtn" onClick={() => setCmdk(true)} title="Command (⌘K)" style={{ width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer", background: "transparent", color: T.faint, display: "grid", placeItems: "center" }}><CommandIcon size={18} /></button>
        <div title={me} style={{ width: 34, height: 34, borderRadius: 99, background: T.hair, border: `1px solid ${T.line}`, color: T.muted, display: "grid", placeItems: "center", fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>{initials(me)}</div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="jes-head" style={{ background: T.surface, borderBottom: `1px solid ${T.line}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
          <h1 style={{ ...serif(19), margin: 0 }}>{viewTitle[view]}</h1>
          {view === "events" && <span style={{ fontSize: 12.5, color: T.faint, background: T.hair, padding: "2px 9px", borderRadius: 99 }}>{events.filter((e) => e.entity).length}</span>}
          <div style={{ flex: 1 }} />
          <button className="jes-search" onClick={() => setCmdk(true)} style={{ display: "flex", alignItems: "center", gap: 9, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: T.faint, minWidth: 220 }}>
            <Search size={15} /><span style={{ flex: 1, textAlign: "left", fontSize: 13 }}>Search or jump to…</span><span style={kbd}>⌘K</span>
          </button>
          <button className="jes-primary" onClick={() => setAdding(true)} style={btnPrimary}><Plus size={16} strokeWidth={2.6} /> Add event</button>
        </header>

        {/* contextual filter bar */}
        {filterBar && <div className="jes-filterbar" style={{ background: T.surface, borderBottom: `1px solid ${T.line}`, padding: "11px 24px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <select value={filters.section} onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))} style={{ ...input, padding: "7px 10px", cursor: "pointer" }}><option value="All">All sections</option>{ENTITY_NAMES.map((n) => <option key={n}>{n}</option>)}</select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} style={{ ...input, padding: "7px 10px", cursor: "pointer" }}><option value="All">Any status</option>{STATUS_NAMES.map((n) => <option key={n}>{n}</option>)}</select>
          {view === "events" && <>
            <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))} style={{ ...input, padding: "7px 10px", cursor: "pointer" }}><option value="soonest">Soonest</option><option value="name">Name</option><option value="readiness">Readiness</option></select>
            <button className="jes-ghost" onClick={() => setFilters((f) => ({ ...f, attention: !f.attention }))} style={{ ...btnGhost, borderColor: filters.attention ? T.brand : T.line, color: filters.attention ? T.ink : T.muted }}><AlertCircle size={14} /> Needs attention</button>
            <div style={{ flex: 1 }} />
            <div style={{ display: "inline-flex", background: T.hair, borderRadius: 9, padding: 3 }}>
              <button onClick={() => setFilters((f) => ({ ...f, layout: "grid" }))} style={{ border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 7, background: filters.layout === "grid" ? T.surface : "transparent", color: filters.layout === "grid" ? T.ink : T.faint }}><LayoutGrid size={15} /></button>
              <button onClick={() => setFilters((f) => ({ ...f, layout: "list" }))} style={{ border: "none", cursor: "pointer", padding: "6px 9px", borderRadius: 7, background: filters.layout === "list" ? T.surface : "transparent", color: filters.layout === "list" ? T.ink : T.faint }}><ListIcon size={15} /></button>
            </div>
          </>}
        </div>}

        {view === "manage" && <div style={{ background: T.surface, borderBottom: `1px solid ${T.line}`, padding: "0 24px", display: "flex", gap: 22, flexShrink: 0 }}>
          {[["libraries", "Libraries", LayoutGrid], ["categories", "Categories & subcategories", Tags]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setManageTab(id)} style={{ display: "flex", alignItems: "center", gap: 7, border: "none", background: "transparent", cursor: "pointer", padding: "11px 2px", fontSize: 13, fontWeight: 600, color: manageTab === id ? T.ink : T.faint, borderBottom: `2px solid ${manageTab === id ? T.brand : "transparent"}`, marginBottom: -1 }}><Icon size={14} />{label}</button>
          ))}
        </div>}

        {uncat > 0 && view !== "manage" && view !== "overview" && <div style={{ background: STATUS.Planning.bg, borderBottom: "1px solid #EAD9B4", padding: "9px 24px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}><AlertCircle size={15} style={{ color: STATUS.Planning.color }} /><span style={{ fontSize: 12.5, color: "#7A5A1E" }}>{uncat} {uncat === 1 ? "event needs" : "events need"} a section assigned.</span><button onClick={showUncat} className="jes-link" style={{ ...linkBtn, color: "#7A5A1E", textDecoration: "underline" }}>Categorize now</button></div>}

        <div key={view + manageTab} className="jes-view" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {view === "overview" && <Overview events={events} me={me} onOpen={goOpen} go={setView} showUncat={showUncat} notify={notify} toggleTask={toggleTask} />}
          {view === "events" && <Events events={events} onOpen={goOpen} filters={filters} setFilters={setFilters} />}
          {view === "calendar" && <Calendar events={events} onOpen={goOpen} filters={filters} />}
          {view === "tasks" && <Tasks events={events} me={me} onOpen={goOpen} toggleTask={toggleTask} notify={notify} />}
          {view === "manage" && manageTab === "libraries" && <ManageLibraries events={events} unregistered={unregistered} update={update} onOpen={goOpen} taxonomy={taxonomy} onAdd={() => setAdding(true)} notify={notify} bulkUpdate={bulkUpdate} />}
          {view === "manage" && manageTab === "categories" && <Taxonomy taxonomy={taxonomy} addCategory={addCategory} renameCategory={renameCategory} removeCategory={removeCategory} addSub={addSub} renameSub={renameSub} removeSub={removeSub} notify={notify} />}
        </div>
      </div>

      {openEv && <Drawer ev={openEv} onClose={() => setOpen(null)} update={update} phases={phases} addPhase={addPhase} renamePhase={renamePhase} removePhase={removePhase} templates={templates} saveTemplate={saveTemplate} renameTemplate={renameTemplate} deleteTemplate={deleteTemplate} notify={notify} />}
      {adding && <AddModal libraries={unregistered} taxonomy={taxonomy} onClose={() => setAdding(false)} onAdd={addEvents} />}
      {cmdk && <CommandPalette onClose={() => setCmdk(false)} events={events} go={setView} openEvent={goOpen} addEvent={() => setAdding(true)} showUncat={showUncat} />}
      <Toasts items={toasts} />
    </div>
  );
}

/* ================================================================== */
/*  Shared style objects                                             */
/* ================================================================== */
const serifRaw = { fontFamily: "'Lora',Georgia,serif" };
const serif = (size) => ({ fontFamily: "'Lora',Georgia,serif", fontSize: size, fontWeight: 600, color: T.ink, margin: 0 });
const lblStyle = { fontSize: 10.5, color: T.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.55 };
const input = { padding: "9px 11px", borderRadius: 9, border: `1px solid ${T.line}`, fontSize: 13.5, color: T.ink, background: T.surface, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const btnPrimary = { display: "inline-flex", alignItems: "center", gap: 7, background: T.brand, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 600, fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" };
const btnGhost = { display: "inline-flex", alignItems: "center", gap: 6, background: T.surface, color: T.muted, border: `1px solid ${T.line}`, borderRadius: 10, padding: "8px 13px", fontWeight: 600, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" };
const btnIcon = { background: "transparent", border: "none", cursor: "pointer", color: T.faint, padding: 5, borderRadius: 8, display: "grid", placeItems: "center", textDecoration: "none" };
const miniBtn = { display: "inline-flex", alignItems: "center", gap: 5, background: T.canvas, color: T.muted, border: `1px solid ${T.line}`, borderRadius: 8, padding: "5px 10px", fontWeight: 600, fontSize: 11.5, cursor: "pointer" };
const rowAction = { opacity: 0.35, background: "none", border: "none", cursor: "pointer", color: T.faint, padding: 3 };
const linkBtn = { display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: T.muted, fontWeight: 600, fontSize: 12.5, padding: 0 };
const panel = { background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden" };
const panelHead = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" };
const chip = { fontSize: 12, color: T.ink, background: T.canvas, border: `1px solid ${T.line}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontWeight: 500 };
const kbd = { fontSize: 10.5, fontWeight: 700, color: T.faint, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 6, padding: "2px 6px", fontFamily: "ui-monospace,Menlo,monospace" };

const css = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&display=swap');
* { -webkit-font-smoothing: antialiased; }
.jes-navbtn,.jes-primary,.jes-ghost,.jes-mini,.jes-icon,.jes-opt,.jes-uprow,.jes-task,.jes-chip,.jes-link,.jes-search,.jes-rowx,.jes-calev{transition:background .14s ease,color .14s ease,border-color .14s ease,opacity .14s ease,filter .14s ease,box-shadow .14s ease}
.jes-card{transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
.jes-card:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(26,33,31,.09);border-color:${T.ghost}!important}
.jes-row,.jes-tile{transition:box-shadow .15s ease,border-color .15s ease,transform .15s ease}
.jes-row:hover,.jes-tile:hover{box-shadow:0 8px 22px rgba(26,33,31,.07);border-color:${T.ghost}!important}
.jes-tile:hover .jes-tile-arrow{opacity:1!important}
.jes-navbtn:not(.active):hover{background:${T.hair}!important}
.jes-navbtn.active:hover{background:${T.brandDeep}!important}
.jes-primary:hover{background:${T.brandDeep}!important}
.jes-ghost:hover,.jes-mini:hover{border-color:${T.ghost}!important;color:${T.ink}!important}
.jes-icon:hover{background:${T.canvas}!important;color:${T.ink}!important}
.jes-link:hover{color:${T.ink}!important;text-decoration:underline}
.jes-search:hover{border-color:${T.ghost}!important}
.jes-opt:hover,.jes-uprow:hover,.jes-task:hover,.jes-chip:hover{background:${T.canvas}!important}
.jes-task:hover .jes-rowx{opacity:1!important}
.jes-calev:hover{filter:brightness(.96)}
input:focus,select:focus{border-color:${T.brand}!important;box-shadow:0 0 0 3px ${T.hair}}
button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:2px solid ${T.brand};outline-offset:2px}
.jes-view{animation:jesview .32s cubic-bezier(.22,1,.36,1)}
@keyframes jesview{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.jes-drawer{animation:jesslide .3s cubic-bezier(.22,1,.36,1)}
@keyframes jesslide{from{transform:translateX(36px);opacity:.3}to{transform:translateX(0);opacity:1}}
.jes-modal,.jes-cmdk,.jes-pop{animation:jespop .2s cubic-bezier(.22,1,.36,1)}
@keyframes jespop{from{transform:scale(.97);opacity:0}to{transform:scale(1);opacity:1}}
.jes-scrim{animation:jesfade .2s ease}@keyframes jesfade{from{opacity:0}to{opacity:1}}
.jes-toast{animation:jestoast .26s cubic-bezier(.22,1,.36,1);pointer-events:auto}
@keyframes jestoast{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-thumb{background:${T.line};border-radius:9px}::-webkit-scrollbar-thumb:hover{background:${T.ghost}}::-webkit-scrollbar-track{background:transparent}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (max-width:860px){.jes-ov-grid,.jes-cal-grid{grid-template-columns:1fr!important}}
@media (max-width:640px){
.jes-view{padding:14px!important}
.jes-head{padding:11px 14px!important;gap:10px!important}
.jes-filterbar{padding:10px 14px!important}
.jes-search{display:none!important}
.jes-day{min-height:56px!important;padding:3px!important}
.jes-dow{padding:7px 4px!important}
.jes-calev{font-size:10px!important;padding:1px 5px!important}
}
@media (max-width:520px){.jes-phasepill{display:none!important}}
`;
