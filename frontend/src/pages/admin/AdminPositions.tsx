import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api";

export default function AdminPositions() {
  const { id: electionId } = useParams<{ id: string }>();
  const [election, setElection] = useState<any>(null);
  const [posName, setPosName] = useState("");
  const [candForm, setCandForm] = useState({ name: "", description: "", position_id: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const elections = await api("/admin/elections");
    setElection(elections.find((e: any) => e.id === electionId) ?? null);
  }, [electionId]);

  useEffect(() => { load(); }, [load]);

  async function addPosition(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try { await api("/admin/positions", { method: "POST", body: JSON.stringify({ name: posName, election_id: electionId }) }); setPosName(""); load(); }
    catch (err: any) { setError(err.message); }
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault(); setError("");
    try { await api("/admin/candidates", { method: "POST", body: JSON.stringify({ ...candForm, election_id: electionId }) }); setCandForm({ name: "", description: "", position_id: "" }); load(); }
    catch (err: any) { setError(err.message); }
  }

  if (!election) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{election.title}</h1>
      <p className="text-gray-500 mb-8">Manage positions and candidates</p>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="font-semibold mb-4">Add Position</h2>
          <form onSubmit={addPosition} className="flex gap-3">
            <input className="input flex-1" placeholder="e.g. President" value={posName}
              onChange={e => setPosName(e.target.value)} required />
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-4">Add Candidate</h2>
          <form onSubmit={addCandidate} className="space-y-3">
            <select className="input" value={candForm.position_id}
              onChange={e => setCandForm({ ...candForm, position_id: e.target.value })} required>
              <option value="">Select position</option>
              {election.positions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="input" placeholder="Candidate name" value={candForm.name}
              onChange={e => setCandForm({ ...candForm, name: e.target.value })} required />
            <input className="input" placeholder="Description (optional)" value={candForm.description}
              onChange={e => setCandForm({ ...candForm, description: e.target.value })} />
            <button type="submit" className="btn-primary w-full">Add Candidate</button>
          </form>
        </div>
      </div>

      <div className="space-y-6">
        {election.positions.map((pos: any) => (
          <div key={pos.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{pos.name}</h2>
              <button onClick={async () => { if (confirm("Delete position?")) { await api(`/admin/positions/${pos.id}`, { method: "DELETE" }); load(); } }}
                className="text-red-500 hover:text-red-700 text-sm">Delete</button>
            </div>
            {pos.candidates.length === 0 ? <p className="text-sm text-gray-400">No candidates yet.</p> : (
              <div className="space-y-2">
                {pos.candidates.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-sm">{c.name}</span>
                      {c.description && <span className="text-xs text-gray-500 ml-2">{c.description}</span>}
                    </div>
                    <button onClick={async () => { await api(`/admin/candidates/${c.id}`, { method: "DELETE" }); load(); }}
                      className="text-red-500 hover:text-red-700 text-xs">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
