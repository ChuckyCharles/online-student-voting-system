import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import confetti from "canvas-confetti";

// Countdown timer component
function CountdownTimer({ endTime, label }: { endTime: string | null; label?: string }) {
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
    <div className="flex items-center gap-2">
      {label && <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>}
      <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 rounded-lg ring-1 ring-indigo-100">
        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono text-sm sm:text-base font-bold text-indigo-700 tabular-nums">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
}

// Position icon mapping
const positionIcons: Record<string, string> = {
  'president': '👑',
  'vice president': '👤',
  'secretary': '📄',
  'treasurer': '💰',
  'organizing secretary': '📋',
  'deputy president': '🎯',
  'default': '📌'
};

function getPositionIcon(name: string): string {
  const lower = name.toLowerCase();
  return positionIcons[lower] || positionIcons.default;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState<any[]>([]);
  const [votedMap, setVotedMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [showAllPositions, setShowAllPositions] = useState(false);

  useEffect(() => {
    api("/elections").then(async (data) => {
      setElections(data);
      const maps: Record<string, Set<string>> = {};
      await Promise.all(data.map(async (e: any) => {
        try {
          const r = await api(`/elections/${e.id}/my-votes`);
          maps[e.id] = new Set(r.voted_positions);
        } catch {
          maps[e.id] = new Set();
        }
      }));
      setVotedMap(maps);
    }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Compute main election (active then pending)
  const mainElection = useMemo(() => 
    elections.find(e => e.status === "ACTIVE") || elections.find(e => e.status === "PENDING") || elections[0]
  , [elections]);

  // Aggregate stats across all elections
  const stats = useMemo(() => {
    const statsData = elections.map(e => {
      const voted = votedMap[e.id] ?? new Set();
      const total = e.positions.length;
      const votedCount = [...voted].filter((pId: string) => e.positions.some((p: any) => p.id === pId)).length;
      return { total, votedCount, status: e.status };
    });
    const totalPositions = statsData.reduce((sum, s) => sum + s.total, 0);
    const totalVoted = statsData.reduce((sum, s) => sum + s.votedCount, 0);
    return { totalPositions, totalVoted };
  }, [elections, votedMap]);

  const completionPct = stats.totalPositions > 0 ? Math.round((stats.totalVoted / stats.totalPositions) * 100) : 0;
  const allVoted = stats.totalPositions > 0 && stats.totalVoted === stats.totalPositions;

  // Flatten all positions for "show all"
  const allPositions = useMemo(() => {
    const positions: any[] = [];
    elections.forEach(e => {
      e.positions.forEach((p: any) => {
        positions.push({ ...p, electionId: e.id, electionTitle: e.title, electionStatus: e.status });
      });
    });
    return positions;
  }, [elections]);

  // Trigger confetti when all votes are completed
  useEffect(() => {
    if (allVoted && !loading && stats.totalPositions > 0) {
      const duration = 4000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 40, spread: 60, ticks: 80, zIndex: 50, gravity: 1.2 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 40 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.2, 0.4), y: Math.random() - 0.2 },
          colors: ['#10b981', '#34d399', '#059669', '#047857', '#0d9488']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.6, 0.8), y: Math.random() - 0.2 },
          colors: ['#10b981', '#34d399', '#059669', '#047857', '#0d9488']
        });
      }, 200);
    }
  }, [allVoted, loading, stats.totalPositions]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-enter stagger-1">
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard…</p>
        </div>
        <div className="card animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="animate-enter stagger-1">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
              {greeting} 👋
            </p>
            <h1 className="text-3xl font-bold text-slate-900 mt-0.5">{user?.name}</h1>
            {mainElection && (
              <p className="text-slate-600 text-sm mt-1">
                {mainElection.title}
              </p>
            )}
          </div>
          {mainElection && mainElection.status === "ACTIVE" && (
            <CountdownTimer endTime={mainElection.end_time} label="Time left" />
          )}
        </div>
      </div>

      {/* Overall Progress Card */}
      {stats.totalPositions > 0 && (
        <div className="animate-enter stagger-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Overall Voting Progress
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold text-slate-900">{stats.totalVoted}</span>
                    <span className="text-slate-400">/ {stats.totalPositions} positions</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {completionPct}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {stats.totalPositions - stats.totalVoted} remaining
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                  <span>Completion</span>
                  <span className={allVoted ? "text-emerald-600 font-bold" : "text-indigo-600"}>
                    {stats.totalVoted}/{stats.totalPositions}
                  </span>
                </div>
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ease-out ${allVoted ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'}`}
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>

              {/* Step indicator */}
              {mainElection && mainElection.status === "ACTIVE" && !allVoted && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Step <span className="font-bold text-indigo-600">{stats.totalVoted + 1}</span> of {stats.totalPositions}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {Math.round(((stats.totalVoted + 1) / stats.totalPositions) * 100)}% to completion
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Positions Section */}
      {elections.length === 0 ? (
        <div className="card text-center py-16 animate-enter stagger-2">
          <div className="text-5xl mb-4">🗳️</div>
          <h3 className="text-lg font-bold text-slate-900">No Elections Available</h3>
          <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
            There are no active elections at the moment. Check back later.
          </p>
        </div>
      ) : mainElection?.status === "ACTIVE" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between animate-enter stagger-3">
            <h2 className="text-xl font-bold text-slate-900">Your Ballot</h2>
            <button
              onClick={() => setShowAllPositions(!showAllPositions)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              {showAllPositions ? 'Show active election only' : 'View all positions'}
              <svg className={`w-4 h-4 transition-transform ${showAllPositions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Position Cards */}
          {(showAllPositions ? allPositions : mainElection.positions).map((position: any, idx: number) => {
            const isVoted = votedMap[position.electionId]?.has(position.id) || false;
            const isNext = !isVoted && stats.totalVoted === idx;
            
            return (
              <div
                key={`${position.electionId}-${position.id}`}
                className={`position-card animate-enter stagger-${Math.min(idx + 4, 10)} ${
                  isVoted ? 'voted' : ''
                } ${isNext ? 'next-step' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Position Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                      {getPositionIcon(position.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 truncate">{position.name}</h3>
                        {isVoted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                            Voted
                          </span>
                        ) : isNext ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm animate-pulse">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Next
                          </span>
                        ) : null}
                      </div>
                      
                      {/* Show election name if viewing all positions */}
                      {showAllPositions && (
                        <p className="text-xs text-slate-500 mb-2">
                          {position.electionTitle} • {position.electionStatus}
                        </p>
                      )}
                      
                      {/* Status text */}
                      <p className="text-sm text-slate-500">
                        {isVoted 
                          ? "Your vote has been recorded anonymously and securely." 
                          : "You haven't voted for this position yet. Click the button to cast your vote."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex flex-col items-end gap-2">
                    {isVoted ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="step-indicator">
                        <span className="step-dot active">{idx + 1}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action area */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isVoted ? (
                    <span className="inline-flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Vote submitted
                    </span>
                  ) : (
                    <Link
                      to={`/vote/${position.electionId}`}
                      state={{ preselectedPosition: position.id }}
                      className="btn-primary btn-sm hover-lift inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Vote Now
                    </Link>
                  )}

                  {/* Quick preview for voted items */}
                  {isVoted && (
                    <button className="btn-secondary btn-sm hover-lift">
                      View Selection
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : mainElection?.status === "PENDING" ? (
        <div className="card text-center py-16 animate-enter stagger-2 border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white">
          <div className="text-5xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Election Starts Soon</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            This election will open at {new Date(mainElection.start_time || '').toLocaleString()}. 
            Get ready to make your voice heard!
          </p>
          <CountdownTimer endTime={mainElection.start_time} />
        </div>
      ) : (
        <div className="card text-center py-16 animate-enter stagger-2">
          <div className="text-5xl mb-4">🏁</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Election Ended</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            This election has concluded. Results will be published soon.
          </p>
          <Link to={`/results/${mainElection.id}`} className="btn-primary">
            View Results
          </Link>
        </div>
      )}

      {/* Completion Celebration */}
      {allVoted && (
        <div className="mt-8 card text-center py-10 border-emerald-200 bg-gradient-to-b from-emerald-50 to-white animate-enter stagger-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 via-transparent to-emerald-400/10"></div>
          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-2xl font-bold text-emerald-800 mb-2">All Votes Submitted!</h3>
            <p className="text-emerald-600 text-sm mb-6 max-w-md mx-auto">
              Your votes have been recorded anonymously and securely. Thank you for participating!
            </p>
            <div className="action-buttons justify-center">
              <Link to="/dashboard" className="btn-secondary">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Contextual tip */}
      {mainElection?.status === "ACTIVE" && !allVoted && (
        <div className="tip-box animate-enter stagger-8">
          <div className="flex items-start gap-4">
            <div className="tip-icon">💡</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                <strong>Tip:</strong> Review your selections carefully. Once submitted, votes cannot be changed.
                Results will be published after the election closes and verification is complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
