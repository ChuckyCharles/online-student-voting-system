import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function Results() {
  const { electionId } = useParams<{ electionId: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/results/${electionId}`).then(setData).catch((e) => setError(e.message));
  }, [electionId]);

  if (error) return <div className="card text-center py-12 text-red-500">{error}</div>;
  if (!data) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{data.election.title}</h1>
      <p className="text-gray-500 mb-8">
        {data.election.status === "ENDED" && data.election.end_time
          ? `Ended ${new Date(data.election.end_time).toLocaleDateString()}`
          : "Live results (admin view)"}
      </p>
      <div className="space-y-8">
        {Object.entries(data.results as Record<string, any[]>).map(([position, candidates]) => {
          const total = candidates.reduce((s, c) => s + c.votes, 0);
          const winner = candidates.reduce((a, b) => (a.votes > b.votes ? a : b));
          return (
            <div key={position} className="card">
              <h2 className="text-lg font-semibold mb-4">{position}</h2>
              <div className="space-y-3">
                {[...candidates].sort((a, b) => b.votes - a.votes).map((c) => {
                  const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0;
                  const isWinner = c.id === winner.id && total > 0;
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{c.name} {isWinner && "🏆"}</span>
                        <span className="text-gray-500">{c.votes} vote{c.votes !== 1 ? "s" : ""} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className={`h-3 rounded-full ${isWinner ? "bg-blue-600" : "bg-gray-400"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">Total votes: {total}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
