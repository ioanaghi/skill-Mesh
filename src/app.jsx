import React, { useMemo, useState, useEffect, useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";

/**
 * SkillMesh – Clickable Demo (single-file React app)
 *
 * What you can do here:
 * - Toggle views: Skills Graph / Needs Graph / Compliance
 * - Click any node to see details (Person, Skill, Project)
 * - Select a Project to see Best Matches (people ranked by skill fit & compliance)
 * - Filter by team, search by name/skill
 * - Inspect compliance (certifications, expirations, open NCs/CAPAs)
 *
 * Notes:
 * - Data is mocked in-memory for demo purposes
 * - Graph layout is automatic; drag nodes freely
 */

const DEMO = {
  people: [
    {
      id: "p1",
      name: "Ana Popescu",
      role: "Process Engineer",
      team: "Manufacturing",
      availability: 0.6,
      skills: [
        { skill: "Lean", level: 4, years: 6, validated: true },
        { skill: "VSM", level: 4, years: 5, validated: true },
        { skill: "APQP", level: 3, years: 3, validated: true },
        { skill: "FMEA", level: 3, years: 4, validated: true },
        { skill: "Python", level: 2, years: 2, validated: false },
      ],
      certs: [
        { name: "IATF Core Tools", expires: "2026-03-01" },
        { name: "Six Sigma Green Belt", expires: "2027-10-01" },
      ],
      nonConformancesOpen: 0,
    },
    {
      id: "p2",
      name: "Mihai Ionescu",
      role: "Quality Engineer",
      team: "Quality",
      availability: 0.4,
      skills: [
        { skill: "FMEA", level: 4, years: 7, validated: true },
        { skill: "MSA", level: 4, years: 6, validated: true },
        { skill: "SPC", level: 3, years: 4, validated: true },
        { skill: "PPAP", level: 3, years: 4, validated: true },
        { skill: "APQP", level: 3, years: 4, validated: true },
      ],
      certs: [
        { name: "IATF Core Tools", expires: "2025-12-15" },
        { name: "Internal Auditor ISO 9001", expires: "2026-08-10" },
      ],
      nonConformancesOpen: 1,
    },
    {
      id: "p3",
      name: "Ioana Muntean",
      role: "Automation Engineer",
      team: "Manufacturing",
      availability: 0.8,
      skills: [
        { skill: "PLC", level: 4, years: 8, validated: true },
        { skill: "Python", level: 3, years: 3, validated: true },
        { skill: "Robot Programming", level: 3, years: 4, validated: true },
        { skill: "Lean", level: 2, years: 2, validated: false },
      ],
      certs: [
        { name: "Machine Safety LOTO", expires: "2026-02-01" },
      ],
      nonConformancesOpen: 0,
    },
    {
      id: "p4",
      name: "Andrei Varga",
      role: "Project Manager",
      team: "PMO",
      availability: 0.3,
      skills: [
        { skill: "APQP", level: 4, years: 8, validated: true },
        { skill: "PPAP", level: 4, years: 7, validated: true },
        { skill: "Risk Management", level: 3, years: 5, validated: true },
      ],
      certs: [
        { name: "PMP", expires: "2028-06-01" },
      ],
      nonConformancesOpen: 0,
    },
  ],
  skills: [
    { id: "s1", name: "Lean", category: "Ops" },
    { id: "s2", name: "VSM", category: "Ops" },
    { id: "s3", name: "APQP", category: "Quality" },
    { id: "s4", name: "FMEA", category: "Quality" },
    { id: "s5", name: "MSA", category: "Quality" },
    { id: "s6", name: "SPC", category: "Quality" },
    { id: "s7", name: "PPAP", category: "Quality" },
    { id: "s8", name: "Python", category: "Digital" },
    { id: "s9", name: "PLC", category: "Automation" },
    { id: "s10", name: "Robot Programming", category: "Automation" },
    { id: "s11", name: "Risk Management", category: "PM" },
  ],
  projects: [
    {
      id: "pr1",
      title: "New Line Commissioning – Servo Press",
      owner: "Manufacturing",
      deadline: "2025-11-30",
      requires: [
        { skill: "APQP", level: 3, importance: 0.9 },
        { skill: "PPAP", level: 3, importance: 0.8 },
        { skill: "FMEA", level: 3, importance: 0.8 },
        { skill: "PLC", level: 3, importance: 0.7 },
        { skill: "Robot Programming", level: 2, importance: 0.5 },
      ],
      compliance: { needsCoreTools: true },
    },
    {
      id: "pr2",
      title: "Yield Improvement – Machining Cell",
      owner: "Quality",
      deadline: "2025-10-15",
      requires: [
        { skill: "SPC", level: 3, importance: 0.9 },
        { skill: "MSA", level: 3, importance: 0.9 },
        { skill: "FMEA", level: 3, importance: 0.8 },
        { skill: "Lean", level: 3, importance: 0.6 },
      ],
      compliance: { needsCoreTools: true },
    },
  ],
  certifications: [
    { id: "c1", name: "IATF Core Tools" },
    { id: "c2", name: "Internal Auditor ISO 9001" },
    { id: "c3", name: "Six Sigma Green Belt" },
    { id: "c4", name: "Machine Safety LOTO" },
    { id: "c5", name: "PMP" },
  ],
  nonConformances: [
    {
      id: "nc1",
      title: "Control Plan gap on OP20",
      linkedTo: { project: "pr2", person: "p2", skill: "SPC" },
      status: "Open",
      correctiveActions: [
        { id: "ca1", desc: "Retrain on SPC subgrouping", due: "2025-09-10", owner: "p2" },
      ],
    },
  ],
};

const COLORS = {
  person: "#2255AA",
  skill: "#0C8F6C",
  project: "#13223B",
  highlight: "#F59E0B",
  gray: "#94A3B8",
};

function isExpired(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  return d < now;
}

function expiresInDays(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function scorePersonForProject(person, project) {
  // Weighted cosine-like score based on required skills & levels
  let sum = 0;
  let wsum = 0;
  project.requires.forEach((req) => {
    const owned = person.skills.find((s) => s.skill === req.skill);
    const level = owned ? owned.level : 0;
    const ratio = Math.min(level / req.level, 1);
    sum += ratio * req.importance;
    wsum += req.importance;
  });
  const baseFit = wsum ? sum / wsum : 0;

  // Compliance modifier: if project needs core tools, require certification present & valid
  let compliance = 1;
  if (project.compliance?.needsCoreTools) {
    const core = person.certs.find((c) => c.name === "IATF Core Tools");
    if (!core) compliance = 0.85; // soft penalty if missing
    else if (isExpired(core.expires)) compliance = 0.8; // expired
    else if (expiresInDays(core.expires) < 60) compliance = 0.9; // expiring soon
  }

  // Availability weight: prefer available people
  const availabilityBoost = 0.8 + 0.2 * person.availability; // 0.8–1.0

  return +(baseFit * compliance * availabilityBoost).toFixed(3);
}

function buildGraph({ mode, filterText, team, data }) {
  const elements = [];
  const text = (filterText || "").toLowerCase();

  const people = data.people.filter((p) =>
    (team ? p.team === team : true) &&
    (text
      ? p.name.toLowerCase().includes(text) ||
        p.skills.some((s) => s.skill.toLowerCase().includes(text))
      : true)
  );

  const skillSet = new Set(data.skills.map((s) => s.name));

  // Add nodes
  people.forEach((p) => {
    elements.push({ data: { id: p.id, label: p.name, type: "person" } });
    if (mode !== "compliance") {
      p.skills.forEach((s) => {
        if (!skillSet.has(s.skill)) return;
        const sid = `s:${s.skill}`;
        if (!elements.find((e) => e.data?.id === sid))
          elements.push({ data: { id: sid, label: s.skill, type: "skill" } });
        elements.push({ data: { id: `${p.id}-${sid}`, source: p.id, target: sid, type: "has" } });
      });
    }
  });

  if (mode !== "skills") {
    data.projects.forEach((pr) => {
      elements.push({ data: { id: pr.id, label: pr.title, type: "project" } });
      pr.requires.forEach((r) => {
        const sid = `s:${r.skill}`;
        if (!elements.find((e) => e.data?.id === sid))
          elements.push({ data: { id: sid, label: r.skill, type: "skill" } });
        elements.push({ data: { id: `${pr.id}-${sid}` , source: pr.id, target: sid, type: "requires" } });
      });
    });
  }

  return elements;
}

export default function App() {
  const [mode, setMode] = useState("skills"); // skills | needs | compliance
  const [filterText, setFilterText] = useState("");
  const [team, setTeam] = useState("");
  const [selected, setSelected] = useState(null);
  const [projectId, setProjectId] = useState("pr1");
  const cyRef = useRef(null);

  const elements = useMemo(() => buildGraph({ mode, filterText, team, data: DEMO }), [mode, filterText, team]);

  const layout = { name: "cose", fit: true, animate: false };
  const stylesheet = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "font-size": 10,
        color: "#fff",
        "text-wrap": "wrap",
        "text-valign": "center",
        "text-halign": "center",
        width: 28,
        height: 28,
        "background-color": COLORS.gray,
        "border-width": 2,
        "border-color": "#ffffff33",
      },
    },
    {
      selector: 'node[type = "person"]',
      style: { "background-color": COLORS.person },
    },
    {
      selector: 'node[type = "skill"]',
      style: { "background-color": COLORS.skill },
    },
    {
      selector: 'node[type = "project"]',
      style: { "background-color": COLORS.project, shape: "round-rectangle", width: 120, height: 34, "font-size": 9 },
    },
    {
      selector: 'edge[type = "has"]',
      style: { width: 1.5, "line-color": "#9CA3AF", "target-arrow-shape": "none" },
    },
    {
      selector: 'edge[type = "requires"]',
      style: { width: 2.2, "line-color": COLORS.highlight, "target-arrow-shape": "triangle", "target-arrow-color": COLORS.highlight },
    },
    {
      selector: ".selected",
      style: { "border-color": COLORS.highlight, "border-width": 4 },
    },
  ];

  function onNodeClick(evt) {
    const n = evt.target;
    const id = n.id();
    const type = n.data("type");
    let entity = null;
    if (type === "person") entity = DEMO.people.find((p) => p.id === id);
    if (type === "project") entity = DEMO.projects.find((p) => p.id === id);
    if (type === "skill") entity = DEMO.skills.find((s) => `s:${s.name}` === id);
    setSelected(entity ? { type, data: entity } : null);
  }

  const project = DEMO.projects.find((p) => p.id === projectId);
  const ranked = useMemo(() => {
    if (!project) return [];
    return DEMO.people
      .map((p) => ({ person: p, score: scorePersonForProject(p, project) }))
      .sort((a, b) => b.score - a.score);
  }, [projectId]);

  const teams = ["", ...Array.from(new Set(DEMO.people.map((p) => p.team)))];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <header className="px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#2255AA]"></div>
          <div className="font-bold">SkillMesh – Skills & Needs Graph (Demo)</div>
          <div className="ml-auto flex gap-2">
            <button className={`px-3 py-1.5 rounded text-white ${mode==='skills'?'bg-[#2255AA]':'bg-slate-500'}`} onClick={() => setMode("skills")}>Skills Graph</button>
            <button className={`px-3 py-1.5 rounded text-white ${mode==='needs'?'bg-[#2255AA]':'bg-slate-500'}`} onClick={() => setMode("needs")}>Needs Graph</button>
            <button className={`px-3 py-1.5 rounded text-white ${mode==='compliance'?'bg-[#2255AA]':'bg-slate-500'}`} onClick={() => setMode("compliance")}>Compliance</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-12 gap-4 p-4">
        {/* Left controls */}
        <aside className="col-span-3 bg-white rounded-xl shadow p-3 flex flex-col gap-3">
          <div className="text-sm font-semibold">Filters</div>
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search person or skill"
            className="w-full px-3 py-2 border rounded"
          />
          <select value={team} onChange={(e) => setTeam(e.target.value)} className="w-full px-3 py-2 border rounded">
            {teams.map((t) => (
              <option key={t} value={t}>{t || "All Teams"}</option>
            ))}
          </select>

          <div className="h-px bg-slate-200" />

          <div className="text-sm font-semibold">Project Matching</div>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-3 py-2 border rounded">
            {DEMO.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          <div className="text-xs text-slate-600">Top Matches</div>
          <div className="max-h-72 overflow-auto pr-1">
            {ranked.map(({ person, score }) => (
              <div key={person.id} className="flex items-center justify-between py-1 border-b last:border-b-0">
                <div>
                  <div className="text-sm font-medium">{person.name}</div>
                  <div className="text-xs text-slate-600">{person.role} • Avail {Math.round(person.availability*100)}%</div>
                </div>
                <div className="text-sm font-semibold">{(score*100).toFixed(0)}%</div>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-200" />

          <div className="text-sm font-semibold">Legend</div>
          <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded" style={{background: COLORS.person}} /> Person</div>
          <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded" style={{background: COLORS.skill}} /> Skill</div>
          <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded" style={{background: COLORS.project}} /> Project</div>
        </aside>

        {/* Graph */}
        <section className="col-span-6 bg-white rounded-xl shadow p-2 min-h-[560px]">
          <CytoscapeComponent
            elements={CytoscapeComponent.normalizeElements(elements)}
            style={{ width: "100%", height: "560px" }}
            layout={layout}
            stylesheet={stylesheet}
            cy={(cy) => {
              cyRef.current = cy;
              cy.off("tap").on("tap", "node", onNodeClick);
            }}
          />
        </section>

        {/* Details Panel */}
        <aside className="col-span-3 bg-white rounded-xl shadow p-3">
          {!selected && (
            <div className="text-sm text-slate-600">Click a node to see details.</div>
          )}
          {selected?.type === "person" && <PersonPanel person={selected.data} project={project} />}
          {selected?.type === "project" && <ProjectPanel project={selected.data} />}
          {selected?.type === "skill" && <SkillPanel skill={selected.data} demo={DEMO} />}
        </aside>

        {/* Compliance Dashboard */}
        <section className="col-span-12 bg-white rounded-xl shadow p-4">
          <ComplianceDashboard data={DEMO} focusProjectId={projectId} />
        </section>
      </main>
    </div>
  );
}

function Tag({ children }) {
  return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs mr-1">{children}</span>;
}

function ValidityPill({ expires }) {
  const d = expiresInDays(expires);
  const expired = isExpired(expires);
  let cls = "bg-emerald-100 text-emerald-800";
  let label = `valid ${d}d`;
  if (expired) { cls = "bg-rose-100 text-rose-800"; label = "expired"; }
  else if (d < 60) { cls = "bg-amber-100 text-amber-800"; label = `${d}d left`; }
  return <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{label}</span>;
}

function PersonPanel({ person, project }) {
  const core = person.certs.find((c) => c.name === "IATF Core Tools");
  const hasCore = !!core && !isExpired(core.expires);
  return (
    <div>
      <div className="text-lg font-semibold">{person.name}</div>
      <div className="text-sm text-slate-600">{person.role} • {person.team}</div>
      <div className="text-xs text-slate-600 mb-2">Availability: {Math.round(person.availability*100)}%</div>

      <div className="text-sm font-semibold mb-1">Skills</div>
      <div className="flex flex-wrap gap-1 mb-2">
        {person.skills.map((s) => (
          <Tag key={s.skill}>{s.skill} · L{s.level} {s.validated ? "✓" : "(unvalidated)"}</Tag>
        ))}
      </div>

      <div className="text-sm font-semibold mb-1">Certifications</div>
      <div className="space-y-1 mb-2">
        {person.certs.map((c) => (
          <div key={c.name} className="text-xs flex items-center gap-2">
            <span>{c.name}</span> <ValidityPill expires={c.expires} />
          </div>
        ))}
      </div>

      {project && (
        <div className="mt-3 p-2 border rounded">
          <div className="text-sm font-semibold">Fit for: {project.title}</div>
          <div className="text-xs">Score: {(scorePersonForProject(person, project)*100).toFixed(0)}%</div>
          <div className="text-xs mt-1">Core Tools: {hasCore ? "OK" : "Missing/Expired"}</div>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-600">Open NCs: {person.nonConformancesOpen}</div>
    </div>
  );
}

function ProjectPanel({ project }) {
  return (
    <div>
      <div className="text-lg font-semibold">{project.title}</div>
      <div className="text-sm text-slate-600">Owner: {project.owner} • Deadline: {project.deadline}</div>
      <div className="mt-2 text-sm font-semibold">Required Skills</div>
      <div className="space-y-1">
        {project.requires.map((r) => (
          <div key={r.skill} className="text-xs flex items-center justify-between">
            <span>{r.skill} · L{r.level}</span>
            <span className="text-slate-600">importance {(r.importance*100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs">Compliance: Core Tools {project.compliance?.needsCoreTools ? "required" : "not required"}</div>
    </div>
  );
}

function SkillPanel({ skill, demo }) {
  const peopleWith = demo.people.filter((p) => p.skills.some((s) => s.skill === skill.name));
  const projectsNeed = demo.projects.filter((pr) => pr.requires.some((r) => r.skill === skill.name));
  return (
    <div>
      <div className="text-lg font-semibold">{skill.name}</div>
      <div className="text-sm text-slate-600">Category: {skill.category}</div>
      <div className="mt-2 text-sm font-semibold">People</div>
      <ul className="list-disc list-inside text-xs">
        {peopleWith.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <div className="mt-2 text-sm font-semibold">Projects requiring this skill</div>
      <ul className="list-disc list-inside text-xs">
        {projectsNeed.map((pr) => (
          <li key={pr.id}>{pr.title}</li>
        ))}
      </ul>
    </div>
  );
}

function ComplianceDashboard({ data, focusProjectId }) {
  const focus = data.projects.find((p) => p.id === focusProjectId);

  const expiring = [];
  data.people.forEach((p) => {
    p.certs.forEach((c) => {
      const d = expiresInDays(c.expires);
      if (d < 60 && !isExpired(c.expires)) expiring.push({ person: p.name, cert: c.name, days: d });
    });
  });

  const openNCs = data.nonConformances.filter((n) => n.status === "Open");

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-3 rounded-xl border">
        <div className="text-sm font-semibold">Compliance Snapshot</div>
        <div className="mt-2 text-xs">
          <div>People: {data.people.length}</div>
          <div>Projects: {data.projects.length}</div>
          <div>Open NCs: {openNCs.length}</div>
          <div>Certs expiring &lt; 60d: {expiring.length}</div>
        </div>
      </div>

      <div className="p-3 rounded-xl border">
        <div className="text-sm font-semibold">Certificates Expiring Soon</div>
        <div className="mt-2 space-y-1 text-xs max-h-32 overflow-auto pr-1">
          {expiring.length === 0 && <div className="text-slate-500">None</div>}
          {expiring.map((e, i) => (
            <div key={i} className="flex items-center justify-between">
              <span>{e.person} — {e.cert}</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">{e.days}d</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl border">
        <div className="text-sm font-semibold">Open Non-Conformances & CAPAs</div>
        <div className="mt-2 space-y-2 text-xs">
          {openNCs.length === 0 && <div className="text-slate-500">None</div>}
          {openNCs.map((n) => (
            <div key={n.id} className="p-2 border rounded">
              <div className="font-medium">{n.title}</div>
              <div className="text-slate-600">Linked: {(n.linkedTo.person ? `Person ${n.linkedTo.person}` : "")} {n.linkedTo.skill ? `• Skill ${n.linkedTo.skill}` : ""} {n.linkedTo.project ? `• Project ${n.linkedTo.project}` : ""}</div>
              <div className="mt-1">CAPAs:</div>
              <ul className="list-disc list-inside">
                {n.correctiveActions.map((c) => (
                  <li key={c.id}>{c.desc} — due {c.due} — owner {c.owner}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {focus && (
        <div className="col-span-3 p-3 rounded-xl border">
          <div className="text-sm font-semibold">Project Readiness – {focus.title}</div>
          <div className="text-xs text-slate-600">Core Tools Required: {focus.compliance.needsCoreTools ? "Yes" : "No"}</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {focus.requires.map((r) => (
              <div key={r.skill} className="p-2 border rounded">
                <div className="text-sm font-medium">{r.skill} · L{r.level}</div>
                <ReadinessList skill={r.skill} level={r.level} people={data.people} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReadinessList({ skill, level, people }) {
  const ready = people
    .map((p) => ({
      name: p.name,
      level: p.skills.find((s) => s.skill === skill)?.level || 0,
      core: p.certs.find((c) => c.name === "IATF Core Tools"),
      availability: p.availability,
    }))
    .sort((a, b) => b.level - a.level);

  return (
    <div className="space-y-1 text-xs">
      {ready.map((r, i) => (
        <div key={i} className="flex items-center justify-between">
          <span>{r.name}</span>
          <span className={`px-2 py-0.5 rounded ${r.level >= level ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>L{r.level}</span>
        </div>
      ))}
    </div>
  );
}
