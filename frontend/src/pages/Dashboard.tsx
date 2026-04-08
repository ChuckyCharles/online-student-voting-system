import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState<any[]>([]);
  const [votedMap, setVotedMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/elections").then(async (data) => {
      setElections(data);
      const maps: Record<string, Set<string>> = {};
      await Promise.all(data.map(async (e: any) => {
        const r = await api(`/elections/${e.id}/my-votes`);
        maps[e.id] = new Set(r.voted_positions);
      }));
      setVotedMap(maps);
    }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="text-slate-500 text-sm font-medium">{greeting} 👋</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-0.5">{user?.name}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="card h-36 animate-pulse bg-slate-100 border-0" />)}
        </div>
      ) : elections.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🗳️</div>
          <p className="text-slate-500 font-medium">No elections available right now.</p>
          <p className="text-slate-400 text-sm mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((e) => {
            const voted = votedMap[e.id] ?? new Set();
            const total = e.positions.length;
            const votedCount = e.positions.filter((p: any) => voted.has(p.id)).length;
            const allVoted = total > 0 && votedCount === total;
            const pct = total > 0 ? Math.round((votedCount / total) * 100) : 0;

            return (
              <div key={e.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 truncate">{e.title}</h2>
                    {e.description && <p className="text-sm text-slate-400 mt-0.5">{e.description}</p>}
                    <p className="text-sm text-slate-500 mt-0.5">{total} position{total !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={e.status === "ACTIVE" ? "badge-active" : e.status === "ENDED" ? "badge-ended" : "badge-pending"}>
                    {e.status === "ACTIVE" ? "● Live" : e.status === "PENDING" ? "Upcoming" : "Ended"}
                  </span>
                </div>

                {e.status === "ACTIVE" && (
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
                      <span>Voting progress</span>
                      <span className={allVoted ? "text-emerald-600" : ""}>{votedCount}/{total} positions</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${allVoted ? "bg-emerald-500" : "bg-indigo-500"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center gap-3">
                  {e.status === "ACTIVE" && !allVoted && (
                    <Link to={`/vote/${e.id}`} className="btn-primary btn-sm">Cast Vote →</Link>
                  )}
                  {e.status === "ACTIVE" && allVoted && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm">
                      <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span>
                      All votes submitted
                    </span>
                  )}
                  {e.status === "ENDED" && (
                    <Link to={`/results/${e.id}`} className="btn-secondary btn-sm">View Results</Link>
                  )}
                  {e.status === "PENDING" && (
                    <span className="text-sm text-slate-400">Election not started yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
