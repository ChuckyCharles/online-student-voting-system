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
    if (!candidateId) return setError("Select a candidate first");
    setSubmitting(positionId); setError("");
    try {
      await api("/vote", {
        method: "POST",
        body: JSON.stringify({ candidate_id: candidateId, position_id: positionId, election_id: electionId }),
      });
      setVoted(prev => new Set([...prev, positionId]));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  }

  if (!election) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (election.status !== "ACTIVE") return <div className="card text-center py-12 text-gray-500">Election is not active.</div>;

  const allVoted = election.positions.every((p: any) => voted.has(p.id));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{election.title}</h1>
      <p className="text-gray-500 mb-8">Select one candidate per position.</p>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      <div className="space-y-8">
        {election.positions.map((pos: any) => (
          <div key={pos.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{pos.name}</h2>
              {voted.has(pos.id) && <span className="badge-active">✓ Voted</span>}
            </div>
            {voted.has(pos.id) ? (
              <p className="text-gray-500 text-sm">Your vote has been recorded.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {pos.candidates.map((c: any) => (
                    <button key={c.id}
                      onClick={() => setSelections(prev => ({ ...prev, [pos.id]: c.id }))}
                      className={`text-left p-4 rounded-lg border-2 transition-all ${selections[pos.id] === c.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="font-medium">{c.name}</div>
                      {c.description && <div className="text-sm text-gray-500 mt-1">{c.description}</div>}
                    </button>
                  ))}
                </div>
                <button onClick={() => castVote(pos.id)}
                  disabled={!selections[pos.id] || submitting === pos.id}
                  className="btn-primary mt-4">
                  {submitting === pos.id ? "Submitting..." : "Submit Vote"}
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {allVoted && (
        <div className="card mt-8 text-center bg-green-50 border-green-200">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-semibold text-green-800">You have voted for all positions!</p>
          <button onClick={() => navigate("/dashboard")} className="btn-primary mt-4">Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}
