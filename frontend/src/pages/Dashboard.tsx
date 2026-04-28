import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

// Countdown timer component (inline)
function CountdownTimer({ endTime }: { endTime: string | null }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  useEffect(() => {
    if (!endTime) return;
    const target = new Date(endTime).getTime();
    
    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1 bg-gradient-to-r from-purple-50 to-indigo-50 px-2.5 py-1.5 rounded-lg ring-1 ring-purple-100">
      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-mono text-sm sm:text-base font-bold text-purple-700 tabular-nums">
        {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

// Stat card component
function StatCard({ icon, title, value, subtext, color, accent }: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtext?: string;
  color: "purple" | "green" | "amber";
  accent?: React.ReactNode;
}) {
  return (
    <div className={`stat-card ${color} animate-enter stagger-1`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`stat-icon ${color}`}>{icon}</div>
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
          </div>
        </div>
        {accent && <div className="flex-shrink-0">{accent}</div>}
      </div>
    </div>
  );
}

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

  // Calculate aggregated stats
  const totalPositions = elections.reduce((sum, e) => sum + e.positions.length, 0);
  const totalVoted = elections.reduce((sum, e) => {
    const voted = votedMap[e.id] ?? new Set();
    return sum + [...voted].length;
  }, 0);
  const activeElections = elections.filter(e => e.status === "ACTIVE").length;
  const mainElection = elections[0];

  // Compute countdown for main election
  const getCountdown = () => {
    if (!mainElection) return null;
    const targetTime = mainElection.status === "ACTIVE" 
      ? new Date(mainElection.end_time).getTime()
      : mainElection.status === "PENDING"
      ? new Date(mainElection.start_time).getTime()
      : null;
    if (!targetTime) return null;

    const now = Date.now();
    const diff = targetTime - now;
    if (diff <= 0) return { text: "0:00:00", label: "Ended" };

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(h)}:${pad(m)}:${pad(s)}`;
    const label = mainElection.status === "ACTIVE" ? "Time left" : "Opens in";
    return { text: timeStr, label };
  };

  const countdown = mainElection ? getCountdown() : null;
  const completionPct = totalPositions > 0 ? Math.round((totalVoted / totalPositions) * 100) : 0;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="animate-enter stagger-1">
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard…</p>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card h-28 animate-pulse bg-slate-100 border-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-enter stagger-1">
        <p className="text-slate-500 text-sm font-medium">{greeting} 👋</p>
        <h1 className="text-3xl font-bold text-slate-900 mt-0.5">{user?.name}</h1>
      </div>

      {/* Stats Cards Row */}
      {elections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Positions Voted - Purple */}
          <StatCard
            icon="🗳️"
            title="Positions Voted"
            value={`${totalVoted}/${totalPositions}`}
            subtext={`${completionPct}% complete`}
            color="purple"
          />

          {/* Card 2: Election Status - Green with countdown */}
          <StatCard
            icon="📊"
            title="Election Status"
            value={activeElections > 0 ? "Live" : mainElection?.status === "PENDING" ? "Upcoming" : "Ended"}
            subtext={mainElection ? `${mainElection.positions.length} positions` : "No elections"}
            color="green"
            accent={
              activeElections > 0 ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="live-badge">
                    <span className="live-dot"></span>
                    LIVE
                  </div>
                  {countdown && (
                    <div className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded ring-1 ring-purple-100 mt-1">
                      {countdown.text}
                    </div>
                  )}
                </div>
              ) : mainElection?.status === "PENDING" ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="live-badge">
                    <span className="live-dot" style={{animationDelay: '1s'}}></span>
                    PENDING
                  </div>
                  {countdown && (
                    <div className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded ring-1 ring-amber-100 mt-1">
                      {countdown.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className="live-badge">
                  <span className="text-slate-400">ENDED</span>
                </div>
              )
            }
          />

          {/* Card 3: Completion - Amber */}
          <StatCard
            icon="📈"
            title="Overall Progress"
            value={`${completionPct}%`}
            subtext={`${totalPositions - totalVoted} remaining`}
            color="amber"
          />
        </div>
      )}

      {/* Elections List */}
      {elections.length === 0 ? (
        <div className="card text-center py-16 animate-enter stagger-2">
          <div className="text-5xl mb-4">🗳️</div>
          <p className="text-slate-500 font-medium">No elections available right now.</p>
          <p className="text-slate-400 text-sm mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((e, idx) => {
            const voted = votedMap[e.id] ?? new Set();
            const total = e.positions.length;
            const votedCount = e.positions.filter((p: any) => voted.has(p.id)).length;
            const allVoted = total > 0 && votedCount === total;
            const pct = total > 0 ? Math.round((votedCount / total) * 100) : 0;

            return (
              <div key={e.id} className={`card hover-lift transition-all animate-enter stagger-${Math.min(idx + 2, 8)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-semibold text-slate-900 truncate">{e.title}</h2>
                      {e.status === "ACTIVE" && (
                        <span className="live-badge">
                          <span className="live-dot"></span>
                          LIVE
                        </span>
                      )}
                    </div>
                    {e.description && <p className="text-sm text-slate-400 mt-0.5">{e.description}</p>}
                    <p className="text-sm text-slate-500 mt-1">{total} position{total !== 1 ? "s" : ""} in this election</p>
                    
                    {/* Position tags with purple voted state */}
                    {total > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {e.positions.map((p: any) => {
                          const isVoted = voted.has(p.id);
                          return (
                            <span
                              key={p.id}
                              className={`position-tag ${isVoted ? 'voted' : 'pending'} transition-all hover:scale-105`}
                            >
                              {isVoted && <span className="text-[10px]">✓</span>}
                              {p.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <span className={
                    e.status === "ACTIVE" ? "badge-active" :
                    e.status === "ENDED" ? "badge-ended" : "badge-pending"
                  }>
                    {e.status === "ACTIVE" ? "● Live" : e.status === "PENDING" ? "Upcoming" : "Ended"}
                  </span>
                </div>

                {/* Enhanced progress bar */}
                {e.status === "ACTIVE" && total > 0 && (
                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                      <span>Voting progress</span>
                      <span className={allVoted ? "text-emerald-600 font-bold" : "text-indigo-600"}>
                        {votedCount}/{total} positions
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className={`progress-bar-fill ${allVoted ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : ''}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-5 action-buttons">
                  {e.status === "ACTIVE" && !allVoted && (
                    <Link to={`/vote/${e.id}`} className="btn-primary btn-sm hover-lift">
                      Cast Vote →
                    </Link>
                  )}
                  {e.status === "ACTIVE" && allVoted && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm px-3 py-1.5 bg-emerald-50 rounded-lg">
                      <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span>
                      All votes submitted
                    </span>
                  )}
                  {e.status === "ENDED" && (
                    <>
                      <Link to={`/results/${e.id}`} className="btn-secondary btn-sm">
                        📊 View Results
                      </Link>
                      <button className="btn-secondary btn-sm" onClick={() => alert("Ballot summary feature coming soon!")}>
                        📋 My Ballot Summary
                      </button>
                    </>
                  )}
                  {e.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <CountdownTimer endTime={e.start_time} />
                      <span className="text-sm text-slate-400">until election opens</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contextual tip */}
      {elections.length > 0 && (
        <div className="tip-box animate-enter stagger-8">
          <div className="flex items-start gap-4">
            <div className="tip-icon">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                {elections[0]?.status === "ACTIVE"
                  ? `Voting is live! Polls close at ${new Date(elections[0]?.end_time || Date.now()).toLocaleString()}. Results will be published immediately after verification.`
                  : elections[0]?.status === "ENDED"
                  ? "Results are being tabulated. Final results will be published within 24 hours."
                  : "Election starts soon. Once active, you'll be able to vote for your representatives."
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
