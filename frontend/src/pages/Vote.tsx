import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Vote() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const [election, setElection] = useState<any>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [elections, { voted_positions }] = await Promise.all([
      api("/elections"),
      api(`/elections/${electionId}/my-votes`),
    ]);
    setElection(elections.find((e: any) => e.id === electionId) ?? null);
    setVoted(new Set(voted_positions));
  }, [electionId]);

  useEffect(() => { load(); }, [load]);

  async function castVote(positionId: string) {
    const candidateId = selections[positionId];
    if (!candidateId) return setError("Please select a candidate first.");
    setSubmitting(positionId); setError("");
    try {
      await api("/vote", {
        method: "POST",
        body: JSON.stringify({ candidate_id: candidateId, position_id: positionId, election_id: electionId }),
      });
      setVoted(prev => new Set([...prev, positionId]));
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(null); }
  }

  if (!election) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-3 animate-pulse">🗳️</div>
        <p>Loading election…</p>
      </div>
    </div>
  );

  if (election.status !== "ACTIVE") return (
    <div className="max-w-lg mx-auto card text-center py-16">
      <div className="text-4xl mb-3">⏸️</div>
      <p className="font-semibold text-slate-700">This election is not currently active.</p>
    </div>
  );

  const allVoted = election.positions.every((p: any) => voted.has(p.id));
  const total = election.positions.length;
  const votedCount = [...voted].length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{election.title}</h1>
        <p className="text-slate-500 text-sm mt-1">Select one candidate per position, then submit.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-slate-100 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: total > 0 ? `${(votedCount / total) * 100}%` : "0%" }} />
          </div>
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{votedCount}/{total} voted</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-6">
        {election.positions.map((pos: any, idx: number) => (
          <div key={pos.id} className={`card transition-all ${voted.has(pos.id) ? "opacity-75" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h2 className="text-base font-semibold text-slate-900">{pos.name}</h2>
              </div>
              {voted.has(pos.id) && (
                <span className="badge-active">✓ Voted</span>
              )}
            </div>

            {voted.has(pos.id) ? (
              <p className="text-slate-400 text-sm pl-10">Your vote for this position has been recorded anonymously.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 pl-0">
                  {pos.candidates.map((c: any) => {
                    const selected = selections[pos.id] === c.id;
                    return (
                      <button key={c.id}
                        onClick={() => setSelections(prev => ({ ...prev, [pos.id]: c.id }))}
                        className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                          selected
                            ? "border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                            {c.description && <div className="text-xs text-slate-500 mt-1 leading-relaxed">{c.description}</div>}
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                            selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                          }`}>
                            {selected && <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => castVote(pos.id)}
                  disabled={!selections[pos.id] || submitting === pos.id}
                  className="btn-primary btn-sm mt-4">
                  {submitting === pos.id ? "Submitting…" : "Confirm Vote"}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {allVoted && (
        <div className="mt-8 card text-center py-10 border-emerald-200 bg-emerald-50">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-emerald-800">All votes submitted!</h3>
          <p className="text-emerald-600 text-sm mt-1 mb-5">Your votes have been recorded anonymously.</p>
          <button onClick={() => navigate("/dashboard")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
