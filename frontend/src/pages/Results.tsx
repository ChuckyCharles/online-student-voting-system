import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function Results() {
  const { electionId } = useParams<{ electionId: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/results/${electionId}`).then(setData).catch(e => setError(e.message));
  }, [electionId]);

  if (error) return (
    <div className="max-w-lg mx-auto card text-center py-16">
      <div className="text-4xl mb-3">🔒</div>
      <p className="font-semibold text-slate-700">{error}</p>
    </div>
  );
  if (!data) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📊</div><p>Loading results…</p></div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{data.election.title}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {data.election.status === "ENDED" && data.election.end_time
            ? `Ended ${new Date(data.election.end_time).toLocaleDateString()}`
            : "Live preview — admin view"}
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(data.results as Record<string, any[]>).map(([position, candidates]) => {
          const total = candidates.reduce((s, c) => s + c.votes, 0);
          const maxVotes = Math.max(...candidates.map((c: any) => c.votes));
          return (
            <div key={position} className="card">
              <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                {position}
              </h2>
              <div className="space-y-4">
                {[...candidates].sort((a, b) => b.votes - a.votes).map((c, i) => {
                  const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0;
                  const isWinner = c.votes === maxVotes && total > 0;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {i === 0 && total > 0 && <span className="text-base">🏆</span>}
                          <span className={`text-sm font-semibold ${isWinner ? "text-slate-900" : "text-slate-600"}`}>
                            {c.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">
                          {c.votes} vote{c.votes !== 1 ? "s" : ""} · {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-700 ${isWinner ? "bg-indigo-500" : "bg-slate-300"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                {total} total vote{total !== 1 ? "s" : ""} cast
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
