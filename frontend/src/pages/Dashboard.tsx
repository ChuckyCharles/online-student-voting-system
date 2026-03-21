import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState<any[]>([]);
  const [votedMap, setVotedMap] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    api("/elections").then(async (data) => {
      setElections(data);
      const maps: Record<string, Set<string>> = {};
      await Promise.all(
        data.map(async (e: any) => {
          const r = await api(`/elections/${e.id}/my-votes`);
          maps[e.id] = new Set(r.voted_positions);
        })
      );
      setVotedMap(maps);
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.name} 👋</h1>
      </div>
      {elections.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No active elections at the moment.</div>
      ) : (
        <div className="space-y-6">
          {elections.map((e) => {
            const voted = votedMap[e.id] ?? new Set();
            const total = e.positions.length;
            const votedCount = e.positions.filter((p: any) => voted.has(p.id)).length;
            const allVoted = total > 0 && votedCount === total;
            return (
              <div key={e.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{e.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{total} position{total !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={e.status === "ACTIVE" ? "badge-active" : e.status === "ENDED" ? "badge-ended" : "badge-pending"}>
                    {e.status}
                  </span>
                </div>
                {e.status === "ACTIVE" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span><span>{votedCount}/{total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: total > 0 ? `${(votedCount / total) * 100}%` : "0%" }} />
                    </div>
                  </div>
                )}
                <div className="mt-4 flex gap-3">
                  {e.status === "ACTIVE" && !allVoted && (
                    <Link to={`/vote/${e.id}`} className="btn-primary text-sm">Cast Vote</Link>
                  )}
                  {e.status === "ACTIVE" && allVoted && (
                    <span className="text-green-600 font-medium text-sm">✅ All votes cast</span>
                  )}
                  {e.status === "ENDED" && (
                    <Link to={`/results/${e.id}`} className="btn-secondary text-sm">View Results</Link>
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
