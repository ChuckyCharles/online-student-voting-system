import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";

const LEVELS = ["UNIVERSITY", "SCHOOL", "DEPARTMENT", "CLASS"] as const;
type PositionLevel = (typeof LEVELS)[number];

export default function AdminPositions() {
  const { id: electionId } = useParams<{ id: string }>();
  const [election, setElection] = useState<any>(null);
  const [posForm, setPosForm] = useState({
    name: "",
    level: "UNIVERSITY" as PositionLevel,
    school_id: "",
    department_id: "",
    course_id: "",
  });
  const [candForm, setCandForm] = useState({ name: "", description: "", position_id: "" });
  const [schools, setSchools] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const elections = await api("/admin/elections");
    setElection(elections.find((e: any) => e.id === electionId) ?? null);
  }, [electionId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api("/admin/schools").then(setSchools).catch(() => setSchools([]));
  }, []);

  useEffect(() => {
    if (!posForm.school_id) {
      setDepartments([]);
      setCourses([]);
      return;
    }
    api(`/admin/departments?school_id=${posForm.school_id}`).then(setDepartments).catch(() => setDepartments([]));
  }, [posForm.school_id]);

  useEffect(() => {
    if (!posForm.department_id) {
      setCourses([]);
      return;
    }
    api(`/admin/courses?department_id=${posForm.department_id}`).then(setCourses).catch(() => setCourses([]));
  }, [posForm.department_id]);

  async function addPosition(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try {
      const payload: any = {
        name: posForm.name,
        election_id: electionId,
        level: posForm.level,
      };
      if (posForm.level !== "UNIVERSITY") payload.school_id = posForm.school_id;
      if (posForm.level === "DEPARTMENT" || posForm.level === "CLASS") payload.department_id = posForm.department_id;
      if (posForm.level === "CLASS") payload.course_id = posForm.course_id;

      await api("/admin/positions", { method: "POST", body: JSON.stringify(payload) });
      setPosForm({ name: "", level: "UNIVERSITY", school_id: "", department_id: "", course_id: "" });
      load();
    }
    catch (err: any) { setError(err.message); }
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try { await api("/admin/candidates", { method: "POST", body: JSON.stringify({ ...candForm, election_id: electionId }) }); setCandForm({ name: "", description: "", position_id: "" }); load(); }
    catch (err: any) { setError(err.message); }
  }

  if (!election) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📋</div><p>Loading…</p></div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{election.title}</h1>
        <p className="text-slate-500 text-sm mt-1">Manage positions and candidates</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">⚠️ {error}</div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mb-8">
        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Add Position</h2>
          <form onSubmit={addPosition} className="space-y-3">
            <input
              className="input"
              placeholder="e.g. President"
              value={posForm.name}
              onChange={e => setPosForm({ ...posForm, name: e.target.value })}
              required
            />
            <select
              className="input"
              value={posForm.level}
              onChange={e => setPosForm({ ...posForm, level: e.target.value as PositionLevel, school_id: "", department_id: "", course_id: "" })}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {posForm.level !== "UNIVERSITY" && (
              <select
                className="input"
                value={posForm.school_id}
                onChange={e => setPosForm({ ...posForm, school_id: e.target.value, department_id: "", course_id: "" })}
                required
              >
                <option value="">Select school…</option>
                {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            {(posForm.level === "DEPARTMENT" || posForm.level === "CLASS") && (
              <select
                className="input"
                value={posForm.department_id}
                onChange={e => setPosForm({ ...posForm, department_id: e.target.value, course_id: "" })}
                required
                disabled={!posForm.school_id}
              >
                <option value="">Select department…</option>
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {posForm.level === "CLASS" && (
              <select
                className="input"
                value={posForm.course_id}
                onChange={e => setPosForm({ ...posForm, course_id: e.target.value })}
                required
                disabled={!posForm.department_id}
              >
                <option value="">Select course…</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <button type="submit" className="btn-primary w-full">Add Position</button>
          </form>
        </div>

        <div className="card">
          <h2 className="font-semibold text-slate-900 mb-4">Add Candidate</h2>
          <form onSubmit={addCandidate} className="space-y-3">
            <select className="input" value={candForm.position_id}
              onChange={e => setCandForm({ ...candForm, position_id: e.target.value })} required>
              <option value="">Select position…</option>
              {election.positions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="input" placeholder="Candidate name"
              value={candForm.name} onChange={e => setCandForm({ ...candForm, name: e.target.value })} required />
            <input className="input" placeholder="Tagline / description (optional)"
              value={candForm.description} onChange={e => setCandForm({ ...candForm, description: e.target.value })} />
            <button type="submit" className="btn-primary w-full">Add Candidate</button>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {election.positions.map((pos: any) => (
          <div key={pos.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                {pos.name}
                <span className="text-xs text-slate-400 font-normal">({pos.candidates.length} candidates)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{pos.level ?? "UNIVERSITY"}</span>
              </h2>
              <button onClick={async () => { if (confirm("Delete this position and all its candidates?")) { await api(`/admin/positions/${pos.id}`, { method: "DELETE" }); load(); } }}
                className="text-red-400 hover:text-red-600 text-xs font-semibold transition-colors">
                Delete position
              </button>
            </div>
            {pos.candidates.length === 0 ? (
              <p className="text-sm text-slate-400 pl-4">No candidates yet.</p>
            ) : (
              <div className="space-y-2">
                {pos.candidates.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                    <div>
                      <span className="font-medium text-sm text-slate-900">{c.name}</span>
                      {c.description && <span className="text-xs text-slate-400 ml-2">{c.description}</span>}
                    </div>
                    <button onClick={async () => { await api(`/admin/candidates/${c.id}`, { method: "DELETE" }); load(); }}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold transition-colors ml-4">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {election.positions.length === 0 && (
          <div className="card text-center py-10 text-slate-400">
            <div className="text-3xl mb-2">📌</div>
            <p>No positions yet. Add one above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
