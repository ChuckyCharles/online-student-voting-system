import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { CandidateAvatar } from "../components/CandidateAvatar";
import { useAuth } from "../context/AuthContext";

export default function Results() {
  const { electionId } = useParams<{ electionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const justVoted = (location.state as any)?.justVoted === true;
  const preselectedPosition = (location.state as any)?.preselectedPosition as string | undefined;

  const [data, setData] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api(`/results/${electionId}`).then(res => {
      setData(res);
      setLoaded(true);
    }).catch(e => setError(e.message));
  }, [electionId]);

  useEffect(() => {
    if (preselectedPosition && loaded) {
      const el = document.getElementById(`position-${preselectedPosition}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-indigo-400', 'ring-offset-2');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-indigo-400', 'ring-offset-2');
        }, 3000);
      }
    }
  }, [preselectedPosition, loaded]);

  if (error) return (
    <div className="max-w-lg mx-auto card text-center py-16">
      <div className="text-4xl mb-3">🔒</div>
      <p className="font-semibold text-slate-700">{error}</p>
      <button onClick={() => navigate("/dashboard")} className="btn-secondary mt-4">
        ← Back to Dashboard
      </button>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📊</div><p>Loading results…</p></div>
    </div>
  );

  const isEnded = data.election.status === "ENDED";
  const isAdminView = location.pathname.startsWith("/admin");

  // Determine user's field level from their profile
  const getUserFieldLevel = () => {
    if (!user) return "UNIVERSITY";
    if (user.course_id) return "CLASS";
    if (user.department_id) return "DEPARTMENT";
    if (user.school_id) return "SCHOOL";
    return "UNIVERSITY";
  };

  const fieldLevel = getUserFieldLevel();

  // Filter results based on filter setting
  let resultsEntries = Object.entries(data.results as Record<string, any[]>);

  if (filter === "field") {
    resultsEntries = resultsEntries.filter(([_, candidates]) => {
      if (!candidates.length) return false;
      const positionLevel = candidates[0]?.position_level;
      if (!positionLevel) return true;

      switch (fieldLevel) {
        case "CLASS":
          return ["CLASS", "DEPARTMENT", "SCHOOL", "UNIVERSITY"].includes(positionLevel);
        case "DEPARTMENT":
          return ["DEPARTMENT", "SCHOOL", "UNIVERSITY"].includes(positionLevel);
        case "SCHOOL":
          return ["SCHOOL", "UNIVERSITY"].includes(positionLevel);
        case "UNIVERSITY":
        default:
          return positionLevel === "UNIVERSITY";
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">{data.election.title}</h1>
          {isEnded ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              🏁 ENDED
            </span>
          ) : isAdminView ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              🔒 ADMIN LIVE PREVIEW
            </span>
          ) : justVoted ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm">
              ✨ Your Voting Summary
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              ⚡ Live Results
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm mt-1">
          {isEnded ? `Ended ${new Date(data.election.end_time).toLocaleDateString()}` :
           justVoted ? "Here's how the election stands after your vote. Final results will be available after verification." :
           isAdminView ? "Live results — admin view" :
           "Results are being updated in real-time as votes come in"}
        </p>
      </div>

      {/* Field filter */}
      {!isEnded && !isAdminView && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {filter === "all" 
              ? `Showing all positions (you're in ${fieldLevel.toLowerCase()} level)`
              : `Showing only positions for your ${fieldLevel.toLowerCase()} field`}
          </p>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="input w-auto text-sm py-1.5"
          >
            <option value="all">All Positions</option>
            <option value="field">My Field Only</option>
          </select>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-6">
        {resultsEntries.map(([position, candidates]: [string, any[]]) => {
          const total = candidates.reduce((s, c) => s + c.votes, 0);
          const maxVotes = Math.max(...candidates.map((c: any) => c.votes));
          const hasVotes = total > 0;

          return (
            <div key={position} id={`position-${position}`} className="card">
              <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                {position}
              </h2>

              <div className="space-y-4">
                {[...candidates].sort((a, b) => b.votes - a.votes).map((c, i) => {
                  const pct = hasVotes ? Math.round((c.votes / total) * 100) : 0;
                  const isWinner = c.votes === maxVotes && hasVotes;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {i === 0 && hasVotes && <span className="text-base">🏆</span>}
                          <CandidateAvatar photoUrl={c.photo_url} name={c.name} size={32} />
                          <span className={`text-sm font-semibold ${isWinner ? "text-slate-900" : "text-slate-600"} ml-2`}>
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
                {!hasVotes && (
                  <p className="text-sm text-slate-400 italic text-center py-2">
                    No votes yet for this position
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                {total} total vote{total !== 1 ? "s" : ""} cast
              </p>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex gap-3 justify-center">
        <button onClick={() => navigate("/dashboard")} className="btn-secondary">
          ← Back to Dashboard
        </button>
        {justVoted && (
          <button onClick={() => window.print()} className="btn-primary">
            🖨️ Print Results
          </button>
        )}
      </div>
    </div>
  );
}
