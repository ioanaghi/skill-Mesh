// @ts-nocheck
import React, { useMemo, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import "./app.css";
import "./styles.css";

/* -------------------- Importance mapping -------------------- */
const IMPORTANCE_LABELS = ["Critical", "High", "Medium", "Low", "Optional"] as const;
const IMPORTANCE_WEIGHTS = {
  Critical: 1.0,
  High: 0.9,
  Medium: 0.7,
  Low: 0.4,
  Optional: 0.2,
} as const;

function importanceToLabel(v: number) {
  if (v >= 0.90) return "Critical";
  if (v >= 0.75) return "High";
  if (v >= 0.50) return "Medium";
  if (v >= 0.25) return "Low";
  return "Optional";
}
function labelToWeight(label: string) {
  return IMPORTANCE_WEIGHTS[label] ?? 0.7;
}

/* -------------------- Demo Data -------------------- */
const SEED = {
  people: [
    {
      id: "p1",
      name: "Ana Popescu",
      role: "Process Engineer",
      team: "Manufacturing",
      availability: 0.6,
      // NEW: direct editable hours
      hoursAvail: 24,
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
      hoursAvail: 16,
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
      hoursAvail: 32,
      skills: [
        { skill: "PLC", level: 4, years: 8, validated: true },
        { skill: "Python", level: 3, years: 3, validated: true },
        { skill: "Robot Programming", level: 3, years: 4, validated: true },
        { skill: "Lean", level: 2, years: 2, validated: false },
      ],
      certs: [{ name: "Machine Safety LOTO", expires: "2026-02-01" }],
      nonConformancesOpen: 0,
    },
    {
      id: "p4",
      name: "Andrei Varga",
      role: "Project Manager",
      team: "PMO",
      availability: 0.3,
      hoursAvail: 12,
      skills: [
        { skill: "APQP", level: 4, years: 8, validated: true },
        { skill: "PPAP", level: 4, years: 7, validated: true },
        { skill: "Risk Management", level: 3, years: 5, validated: true },
      ],
      certs: [{ name: "PMP", expires: "2028-06-01" }],
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
        { skill: "APQP", level: 3, importance: 0.9, hours: 30 },
        { skill: "PPAP", level: 3, importance: 0.8, hours: 20 },
        { skill: "FMEA", level: 3, importance: 0.8, hours: 20 },
        { skill: "PLC", level: 3, importance: 0.7, hours: 24 },
        { skill: "Robot Programming", level: 2, importance: 0.5, hours: 12 },
      ],
      compliance: { needsCoreTools: true },
    },
    {
      id: "pr2",
      title: "Yield Improvement – Machining Cell",
      owner: "Quality",
      deadline: "2025-10-15",
      requires: [
        { skill: "SPC", level: 3, importance: 0.9, hours: 24 },
        { skill: "MSA", level: 3, importance: 0.9, hours: 16 },
        { skill: "FMEA", level: 3, importance: 0.8, hours: 20 },
        { skill: "Lean", level: 3, importance: 0.6, hours: 8 },
      ],
      compliance: { needsCoreTools: true },
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
const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 8)}`;

/* -------------------- Helpers -------------------- */
function isExpired(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  return d < now;
}
function expiresInDays(dateStr: string) {
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
function scorePersonForProject(person, project) {
  let sum = 0,
    wsum = 0;
  project.requires.forEach((req) => {
    const owned = person.skills.find((s) => s.skill === req.skill);
    const level = owned ? owned.level : 0;
    const ratio = Math.min(level / req.level, 1);
    const weight = req.importance ?? labelToWeight(req.importanceLabel || "Medium");
    sum += ratio * weight;
    wsum += weight;
  });
  const baseFit = wsum ? sum / wsum : 0;
  let compliance = 1;
  if (project.compliance?.needsCoreTools) {
    const core = person.certs?.find?.((c) => c.name === "IATF Core Tools");
    if (!core) compliance = 0.85;
    else if (isExpired(core.expires)) compliance = 0.8;
    else if (expiresInDays(core.expires) < 60) compliance = 0.9;
  }
  const availabilityBoost = 0.8 + 0.2 * person.availability;
  return +(baseFit * compliance * availabilityBoost).toFixed(3);
}

/* -------------------- Graph Builder -------------------- */
function buildGraph({ data }) {
  const elements: any[] = [];
  const skillSet = new Set(data.skills.map((s) => s.name));

  data.people.forEach((p) => {
    elements.push({ data: { id: p.id, label: p.name, type: "person" } });
    p.skills.forEach((s) => {
      if (!skillSet.has(s.skill)) return;
      const sid = `s:${s.skill}`;
      if (!elements.find((e) => e.data?.id === sid))
        elements.push({ data: { id: sid, label: s.skill, type: "skill" } });
      elements.push({
        data: { id: `${p.id}-${sid}`, source: p.id, target: sid, type: "has" },
      });
    });
  });

  data.projects.forEach((pr) => {
    elements.push({ data: { id: pr.id, label: pr.title, type: "project" } });
    pr.requires.forEach((r) => {
      const sid = `s:${r.skill}`;
      if (!elements.find((e) => e.data?.id === sid))
        elements.push({ data: { id: sid, label: r.skill, type: "skill" } });
      elements.push({
        data: { id: `${pr.id}-${sid}`, source: pr.id, target: sid, type: "requires" },
      });
    });
  });
  return elements;
}

/* -------------------- Global Optimizer (uses direct editable hours) -------------------- */
function allocateAllProjects(data) {
  const people = data.people.map((p) => ({
    ...p,
    _cap: Math.max(0, Number(p.hoursAvail ?? 0)), // DIRECT hours, editable
    _used: 0,
  }));
  const projects = data.projects;

  const tasks = [];
  projects.forEach((pr) => {
    pr.requires.forEach((r) => {
      const label = r.importanceLabel ?? importanceToLabel(r.importance ?? 0.7);
      const weight = labelToWeight(label);
      const hours = r.hours ?? 0;
      tasks.push({
        projectId: pr.id,
        projectTitle: pr.title,
        deadline: pr.deadline ? new Date(pr.deadline).getTime() : Number.MAX_SAFE_INTEGER,
        importanceLabel: label,
        importanceWeight: weight,
        level: r.level,
        skill: r.skill,
        hours,
      });
    });
  });

  tasks.sort((a, b) => {
    if (b.importanceWeight !== a.importanceWeight) return b.importanceWeight - a.importanceWeight;
    if (a.deadline !== b.deadline) return a.deadline - b.deadline;
    return b.level - a.level;
  });

  const perPersonProjectHours: Record<string, Record<string, number>> = {};
  const rows: any[] = [];
  const perProject = new Map<string, number>();
  const unassignedSkills = new Map<string, number>(); // NEW: totals per skill

  function candidateFor(task) {
    let best = null;
    let bestScore = -1;
    people.forEach((p) => {
      const capLeft = p._cap - p._used;
      if (capLeft <= 0) return;
      const owned = p.skills.find((s) => s.skill === task.skill);
      const lvl = owned?.level ?? 0;
      if (lvl < task.level) return;
      const consolidation = (perPersonProjectHours[p.id]?.[task.projectId] ?? 0) > 0 ? 0.2 : 0;
      const surplus = Math.max(0, lvl - task.level);
      const score = surplus + 1 + consolidation;
      if (score > bestScore) {
        bestScore = score;
        best = { p, lvl, capLeft };
      }
    });
    return best;
  }

  tasks.forEach((t) => {
    let remaining = t.hours;
    while (remaining > 0) {
      const cand = candidateFor(t);
      if (!cand) {
        rows.push({
          projectId: t.projectId,
          projectTitle: t.projectTitle,
          skill: t.skill,
          level: t.level,
          personLevel: null,
          personName: "UNASSIGNED",
          hours: remaining,
        });
        perProject.set(t.projectId, (perProject.get(t.projectId) ?? 0) + remaining);
        unassignedSkills.set(t.skill, (unassignedSkills.get(t.skill) ?? 0) + remaining);
        remaining = 0;
        break;
      }
      const take = Math.min(remaining, cand.capLeft);
      rows.push({
        projectId: t.projectId,
        projectTitle: t.projectTitle,
        skill: t.skill,
        level: t.level,
        personLevel: cand.lvl,
        personName: cand.p.name,
        personId: cand.p.id,
        hours: take,
      });
      cand.p._used += take;
      perPersonProjectHours[cand.p.id] ||= {};
      perPersonProjectHours[cand.p.id][t.projectId] =
        (perPersonProjectHours[cand.p.id][t.projectId] ?? 0) + take;
      remaining -= take;
    }
  });

  const perPerson = new Map<string, { name: string; used: number; cap: number }>();
  people.forEach((p) => perPerson.set(p.id, { name: p.name, used: p._used, cap: p._cap }));

  return { rows, perProject, perPerson, unassignedSkills };
}

/* -------------------- App -------------------- */
export default function App() {
  const [data, setData] = useState(SEED);
  const [personId, setPersonId] = useState(SEED.people[0].id);
  const [projectId, setProjectId] = useState(SEED.projects[0].id);

  const cyRef = useRef(null);
  const elements = useMemo(() => buildGraph({ data }), [data]);
  const layout = { name: "cose", fit: true, animate: false };
  const stylesheet = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "font-size": 11,
        color: "#fff",
        "text-wrap": "wrap",
        "text-valign": "center",
        "text-halign": "center",
        width: 30,
        height: 30,
        "text-outline-color": "#0005",
        "text-outline-width": 2,
        "background-color": COLORS.gray,
        "border-width": 2,
        "border-color": "#ffffff33",
      },
    },
    { selector: 'node[type = "person"]', style: { "background-color": COLORS.person } },
    { selector: 'node[type = "skill"]', style: { "background-color": COLORS.skill } },
    {
      selector: 'node[type = "project"]',
      style: { "background-color": COLORS.project, shape: "round-rectangle", width: 150, height: 38, "font-size": 10 },
    },
    { selector: 'edge[type = "has"]', style: { width: 1.4, "line-color": "#9CA3AF", "target-arrow-shape": "none" } },
    {
      selector: 'edge[type = "requires"]',
      style: { width: 2.2, "line-color": COLORS.highlight, "target-arrow-shape": "triangle", "target-arrow-color": COLORS.highlight },
    },
  ];

  const person = data.people.find((p) => p.id === personId);
  const project = data.projects.find((p) => p.id === projectId);
  const ranked = useMemo(
    () =>
      project
        ? data.people
            .map((p) => ({ person: p, score: scorePersonForProject(p, project) }))
            .sort((a, b) => b.score - a.score)
        : [],
    [projectId, data]
  );

  /* ---------- CRUD helpers ---------- */
  const addPerson = (name, role, team) => {
    const id = uid("p");
    setData((d) => ({
      ...d,
      people: [
        ...d.people,
        {
          id,
          name: name || "New person",
          role: role || "",
          team: team || "",
          availability: 0.5,
          hoursAvail: 0, // NEW
          skills: [],
          certs: [],
          nonConformancesOpen: 0,
        },
      ],
    }));
    setPersonId(id);
  };
  const deletePerson = (id) =>
    setData((d) => ({ ...d, people: d.people.filter((p) => p.id !== id) }));

  const addSkillToPerson = (pid, skill, level = 3) => {
    if (!skill) return;
    setData((d) => ({
      ...d,
      people: d.people.map((p) =>
        p.id !== pid
          ? p
          : {
              ...p,
              skills: [...p.skills.filter((s) => s.skill !== skill), { skill, level, years: 1, validated: false }],
            }
      ),
    }));
  };
  const removeSkillFromPerson = (pid, skill) => {
    setData((d) => ({
      ...d,
      people: d.people.map((p) => (p.id !== pid ? p : { ...p, skills: p.skills.filter((s) => s.skill !== skill) })),
    }));
  };

  const addProject = (title, owner, deadline) => {
    const id = uid("pr");
    setData((d) => ({
      ...d,
      projects: [
        ...d.projects,
        {
          id,
          title: title || "New project",
          owner: owner || "",
          deadline: deadline || "",
          requires: [],
          compliance: { needsCoreTools: true },
        },
      ],
    }));
    setProjectId(id);
  };
  const deleteProject = (id) =>
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));

  const addNeedToProject = (pid, skill, level = 3, importanceLabel = "Medium", hours = 8) => {
    if (!skill) return;
    const importance = labelToWeight(importanceLabel);
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) =>
        p.id !== pid
          ? p
          : {
              ...p,
              requires: [
                ...p.requires.filter((r) => r.skill !== skill),
                { skill, level, importance, importanceLabel, hours },
              ],
            }
      ),
    }));
  };

  const removeNeedFromProject = (pid, skill) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) =>
        p.id !== pid ? p : { ...p, requires: p.requires.filter((r) => r.skill !== skill) }
      ),
    }));
  };

  /* ---------- Node click => focus selectors ---------- */
  function onNodeClick(evt) {
    const n = evt.target;
    const id = n.id();
    const type = n.data("type");   // <-- fixed
    if (type === "person") setPersonId(id);
    if (type === "project") setProjectId(id);
  }

  /* ---------- Inputs state ---------- */
  const [newPerson, setNewPerson] = useState({ name: "", role: "", team: "" });
  const [newSkillForPerson, setNewSkillForPerson] = useState({ skill: "", level: 3 });

  const [newProject, setNewProject] = useState({ title: "", owner: "", deadline: "" });
  const [newNeed, setNewNeed] = useState({ skill: "", level: 3, importanceLabel: "High", hours: 8 });

  /* ---------- Global allocation ---------- */
  const allocation = useMemo(() => allocateAllProjects(data), [data]);
  const combinedRows = allocation.rows;
  const unassignedByProject = allocation.perProject;
  const perPersonMap = allocation.perPerson;
  const unassignedSkillsMap = allocation.unassignedSkills;

  /* -------------------- UI -------------------- */
  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-content">
          <div className="brand-dot" />
          <div className="brand">SkillMesh — People/Projects • Graph • Report</div>
        </div>
      </header>

      <main className="container">
        {/* ===== Top: Two Columns ===== */}
        <section className="grid-2">
          {/* ----- Left: People ----- */}
          <div className="card">
            <div className="card-row">
              <label className="label">Select person</label>
              <div className="row">
                <select className="input" value={personId} onChange={(e) => setPersonId(e.target.value)}>
                  {data.people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button className="btn danger" onClick={() => deletePerson(personId)}>
                  Delete person
                </button>
              </div>
              {/* NEW: Direct editable hours for the selected person */}
              {person && (
                <div className="row gap" style={{ marginTop: 8 }}>
                  <input
                    className="input num"
                    type="number"
                    min={0}
                    value={person.hoursAvail ?? 0}
                    onChange={(e) => {
                      const v = Math.max(0, Number(e.target.value || 0));
                      setData((d) => ({
                        ...d,
                        people: d.people.map((pp) =>
                          pp.id !== person.id ? pp : { ...pp, hoursAvail: v }
                        ),
                      }));
                    }}
                    placeholder="Available hours"
                  />
                  <div className="text-xs" style={{ alignSelf: "center" }}>
                    Assigned: <b>{perPersonMap.get(person.id)?.used ?? 0}</b>h • Free:&nbsp;
                    <b>
                      {Math.max(
                        0,
                        (perPersonMap.get(person.id)?.cap ?? (person.hoursAvail ?? 0)) -
                          (perPersonMap.get(person.id)?.used ?? 0)
                      )}
                    </b>
                    h
                  </div>
                </div>
              )}
            </div>

            <div className="card-row">
              <div className="row gap">
                <input
                  className="input"
                  placeholder="Name"
                  value={newPerson.name}
                  onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Role"
                  value={newPerson.role}
                  onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Team"
                  value={newPerson.team}
                  onChange={(e) => setNewPerson({ ...newPerson, team: e.target.value })}
                />
                <button
                  className="btn primary"
                  onClick={() => {
                    addPerson(newPerson.name, newPerson.role, newPerson.team);
                    setNewPerson({ name: "", role: "", team: "" });
                  }}
                >
                  Add person
                </button>
              </div>
            </div>

            <div className="card-row">
              <div className="tile">
                <div className="tile-title">Person’s skills</div>
                <div className="chips">
                  {person?.skills.map((s) => (
                    <span key={s.skill} className="chip">
                      {s.skill} · L{s.level}
                      <button className="chip-x" onClick={() => removeSkillFromPerson(person.id, s.skill)}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Add / edit skill to person */}
              <div className="row gap">
                <select
                  className="input"
                  value={newSkillForPerson.skill}
                  onChange={(e) => setNewSkillForPerson({ ...newSkillForPerson, skill: e.target.value })}
                >
                  <option value="">Select existing…</option>
                  {data.skills.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input num"
                  type="number"
                  min={1}
                  max={5}
                  value={newSkillForPerson.level}
                  onChange={(e) =>
                    setNewSkillForPerson({ ...newSkillForPerson, level: parseInt(e.target.value || "3") })
                  }
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    addSkillToPerson(person.id, newSkillForPerson.skill, newSkillForPerson.level);
                    setNewSkillForPerson({ skill: "", level: 3 });
                  }}
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>

          {/* ----- Right: Projects ----- */}
          <div className="card">
            <div className="card-row">
              <label className="label">Select Project</label>
              <div className="row">
                <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <button className="btn danger" onClick={() => deleteProject(projectId)}>
                  Delete Project
                </button>
              </div>
            </div>

            <div className="card-row">
              <div className="row gap">
                <input
                  className="input"
                  placeholder="Project title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Owner"
                  value={newProject.owner}
                  onChange={(e) => setNewProject({ ...newProject, owner: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Deadline (YYYY-MM-DD)"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                />
                <button
                  className="btn primary"
                  onClick={() => {
                    addProject(newProject.title, newProject.owner, newProject.deadline);
                    setNewProject({ title: "", owner: "", deadline: "" });
                  }}
                >
                  Add Project
                </button>
              </div>
            </div>

            <div className="card-row">
              <div className="tile">
                <div className="tile-title">Project’s needs</div>
                <div className="chips">
                  {project?.requires.map((r) => (
                    <span key={r.skill} className="chip">
                      {r.skill} · L{r.level} · {r.importanceLabel ?? importanceToLabel(r.importance)} · {r.hours ?? 0}h
                      <button className="chip-x" onClick={() => removeNeedFromProject(project.id, r.skill)}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="row gap">
                <select
                  className="input"
                  value={newNeed.skill}
                  onChange={(e) => setNewNeed({ ...newNeed, skill: e.target.value })}
                >
                  <option value="">Select existing…</option>
                  {data.skills.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input num"
                  type="number"
                  min={1}
                  max={5}
                  value={newNeed.level}
                  onChange={(e) =>
                    setNewNeed({ ...newNeed, level: parseInt(e.target.value || "3") })
                  }
                  placeholder="Level"
                />
                <select
                  className="input"
                  value={newNeed.importanceLabel}
                  onChange={(e) => setNewNeed({ ...newNeed, importanceLabel: e.target.value })}
                >
                  {IMPORTANCE_LABELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <input
                  className="input num"
                  type="number"
                  min={0}
                  value={newNeed.hours}
                  onChange={(e) => setNewNeed({ ...newNeed, hours: parseFloat(e.target.value || "0") })}
                  placeholder="Hours"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    addNeedToProject(project.id, newNeed.skill, newNeed.level, newNeed.importanceLabel, newNeed.hours);
                    setNewNeed({ skill: "", level: 3, importanceLabel: "High", hours: 8 });
                  }}
                >
                  Add Skill
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Graph ===== */}
        <section className="card graph-card">
          <div className="section-title">Graph</div>
          <div className="graph-wrap">
            <CytoscapeComponent
              elements={CytoscapeComponent.normalizeElements(elements)}
              style={{ width: "100%", height: "620px", backgroundColor: "transparent" }}
              layout={layout}
              stylesheet={stylesheet}
              cy={(cy) => {
                cyRef.current = cy;
                cy.off("tap").on("tap", "node", onNodeClick);
              }}
            />
          </div>
        </section>

        {/* ===== Report ===== */}
        <section className="card">
          <div className="section-title">Report</div>

          <div className="report-grid">
            {/* Snapshot */}
            <div className="panel">
              <div className="panel-title">Projects Snapshot</div>
              <div className="kv"><span>People</span><b>{data.people.length}</b></div>
              <div className="kv"><span>Projects</span><b>{data.projects.length}</b></div>

              {/* Unassigned per project */}
              <div className="kv">
                <span>Unassigned hours (all)</span>
                <b>{Array.from(unassignedByProject.values()).reduce((a, b) => a + b, 0)}</b>
              </div>

              {/* Skill totals for unassigned */}
              <div className="mt-2 text-xs">
                {Array.from(unassignedSkillsMap.entries()).map(([skill, hrs]) => (
                  <div key={skill}>{skill}: <b>{hrs}</b>h</div>
                ))}
              </div>

              <div className="mt-2 text-xs">
                {data.projects.map((pr) => {
                  const ua = unassignedByProject.get(pr.id) ?? 0;
                  return (
                    <div key={pr.id} className={ua > 0 ? "warn" : ""}>
                      {pr.title}: <b>{ua}</b>h unassigned
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Matches for selected project */}
            <div className="panel">
              <div className="panel-title">Top Matches – {project?.title}</div>
              <div className="list">
                {ranked.map(({ person, score }) => (
                  <div key={person.id} className="list-row">
                    <div>
                      <div className="list-main">{person.name}</div>
                      <div className="list-sub">
                        {person.role} • Hours avail {person.hoursAvail ?? 0}
                      </div>
                    </div>
                    <div className="badge">{(score * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Orphan skills */}
            <div className="panel">
              <div className="panel-title">Orphan Skills (no owners)</div>
              <div className="chips">
                {data.skills
                  .filter((s) => !data.people.some((p) => p.skills.some((ps) => ps.skill === s.name)))
                  .map((s) => (
                    <span key={s.id} className="chip muted">{s.name}</span>
                  ))}
              </div>
            </div>

            {/* Global suggested allocation */}
            <div className="panel span-2">
              <div className="panel-title">Suggested Allocation — All Projects</div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Skill</th>
                    <th>Person L</th>
                    <th>Person</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedRows.map((r, idx) => (
                    <tr key={idx} className={r.personName === "UNASSIGNED" ? "warn-row" : ""}>
                      <td>{r.projectTitle}</td>
                      <td>{r.skill}</td>
                      <td>{r.personLevel ?? "—"}</td>
                      <td>{r.personName}</td>
                      <td>{r.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
