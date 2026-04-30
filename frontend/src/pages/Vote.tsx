import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api";
import { CandidateAvatar } from "../components/CandidateAvatar";
import confetti from "canvas-confetti";

// Countdown Timer Component
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
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 rounded-lg ring-1 ring-indigo-100">
        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono text-lg font-bold text-indigo-700 tabular-nums">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">remaining</span>
    </div>
  );
}

export default function Vote() {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedPositionId = (location.state as any)?.preselectedPosition;
  const positionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const [election, setElection] = useState<any>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [elections, { voted_positions }] = await Promise.all([
      api("/elections"),
      api(`/elections/${electionId}/my-votes`),
    ]);
    const e = elections.find((e: any) => e.id === electionId) ?? null;
    setElection(e);
    setVoted(new Set(voted_positions));
    setLoaded(true);
  }, [electionId]);

  useEffect(() => { load(); }, [load]);

  // Scroll to preselected position after load
  useEffect(() => {
    if (preselectedPositionId && loaded) {
      setTimeout(() => {
        const el = positionRefs.current[preselectedPositionId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Temporarily highlight
          el.classList.add('ring-2', 'ring-indigo-400', 'ring-offset-2');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-indigo-400', 'ring-offset-2');
          }, 2000);
        }
      }, 100);
    }
  }, [preselectedPositionId, loaded]);

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
      setSelections(prev => {
        const copy = { ...prev };
        delete copy[positionId];
        return copy;
      });
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(null); }
  }

  const total = election?.positions.length || 0;
  const votedCount = [...voted].length;
  const allVoted = total > 0 && votedCount === total;

  // Trigger confetti when all votes are submitted
  useEffect(() => {
    if (allVoted && loaded) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']
        });
      }, 250);
    }
  }, [allVoted, loaded]);

  if (!election) return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-3 animate-pulse">🗳️</div>
        <p className="font-medium">Loading election…</p>
      </div>
    </div>
  );

  if (election.status !== "ACTIVE") return (
    <div className="max-w-2xl mx-auto card text-center py-16 animate-enter">
      <div className="text-4xl mb-3">⏸️</div>
      <p className="font-semibold text-slate-700">
        {election.status === "PENDING" ? "This election has not started yet." : "This election has ended."}
      </p>
      <p className="text-sm text-slate-500 mt-2">
        {election.status === "PENDING"
          ? "Please check back later when voting becomes active."
          : "Visit the results page to see the outcome."}
      </p>
      <button onClick={() => navigate("/dashboard")} className="btn-secondary mt-6">
        ← Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Section with Stats & Countdown */}
      <div className="animate-enter stagger-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">{election.title}</h1>
              <span className="live-badge">
                <span className="live-dot"></span>
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {votedCount} of {total} positions voted
              </span>
            </div>
          </div>
          <CountdownTimer endTime={election.end_time} />
        </div>

        {/* Enhanced progress bar */}
        <div className="relative mt-4">
          <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Voting Progress</span>
            <span className={allVoted ? "text-emerald-600 font-bold" : "text-indigo-600"}>
              {Math.round((votedCount/total)*100)}% complete
            </span>
          </div>
          <div className="progress-bar-container h-3">
            <div
              className={`progress-bar-fill ${allVoted ? '!bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200' : ''}`}
              style={{ width: loaded ? `${(votedCount/total)*100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-enter stagger-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ⚠️ {error}
        </div>
      )}

      {/* Positions list */}
      <div className="space-y-5">
        {election.positions.map((pos: any, idx: number) => {
          const positionVoted = voted.has(pos.id);
          const selectedCandidateId = selections[pos.id];
          const staggerDelay = Math.min(idx + 2, 10);
          
          return (
            <div
              key={pos.id}
              ref={(el) => { positionRefs.current[pos.id] = el; }}
              className={`card transition-all duration-300 animate-enter stagger-${staggerDelay} ${
                positionVoted ? "opacity-75 bg-slate-50/30 border-slate-200" : "hover:shadow-lg hover:border-indigo-200/60"
              }`}
            >
              {/* Position header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-md">
                    {idx + 1}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{pos.name}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                      positionVoted 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white ring-1 ring-emerald-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {positionVoted ? '✓ Voted' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                {positionVoted && (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Candidate selection or voted message */}
              {positionVoted ? (
                <div className="pl-13 pt-2">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 px-3 py-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Your vote has been recorded anonymously.
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                     {pos.candidates.map((c: any) => {
                       const isSelected = selectedCandidateId === c.id;
                       return (
                         <button
                           key={c.id}
                           onClick={() => setSelections(prev => ({ ...prev, [pos.id]: c.id }))}
                           className={`candidate-card text-left hover-lift ${isSelected ? 'selected' : ''}`}
                         >
                           <div className="flex items-start gap-3">
                             <CandidateAvatar photoUrl={c.photo_url} name={c.name} size={48} />
                             <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 text-sm truncate">{c.name}</div>
                                {c.description && (
                                  <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                    {c.description}
                                  </div>
                                )}
                              </div>
                             <div className={`check-circle flex-shrink-0 mt-0.5 ${isSelected ? 'selected' : ''}`}>
                               {isSelected && (
                                 <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                 </svg>
                               )}
                             </div>
                           </div>
                         </button>
                       );
                     })}
                  </div>
                  <button
                    onClick={() => castVote(pos.id)}
                    disabled={!selections[pos.id] || submitting === pos.id}
                    className="btn-primary btn-sm mt-5 w-full sm:w-auto hover-lift inline-flex items-center justify-center gap-2"
                  >
                    {submitting === pos.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm Vote
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Success completion state */}
      {allVoted && (
        <div className="mt-8 card text-center py-10 border-emerald-200 bg-gradient-to-b from-emerald-50 to-emerald-100/30 animate-enter stagger-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-emerald-400/5"></div>
          <div className="relative z-10">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-emerald-800">All votes submitted!</h3>
            <p className="text-emerald-600 text-sm mt-1 mb-5 max-w-md mx-auto">
              Your votes have been recorded anonymously and securely.
            </p>
            <div className="action-buttons justify-center">
              <button 
                onClick={() => navigate("/dashboard")} 
                className="btn-primary"
              >
                ← Back to Dashboard
              </button>
              <button 
                onClick={() => navigate(`/results/${electionId}`, { 
                  state: { 
                    justVoted: true,
                    fieldLevel: "UNIVERSITY" // This should come from user profile
                  } 
                })}
                className="btn-secondary"
              >
                📊 View Live Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contextual tip */}
      {!allVoted && (
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

      {/* My Ballot Summary button */}
      {!allVoted && (
        <div className="text-center animate-enter stagger-8">
          <button 
            onClick={() => {
              const summary = election.positions.map((p: any) => {
                const selectedId = selections[p.id];
                const candidate = p.candidates.find((c: any) => c.id === selectedId);
                return `${p.name}: ${candidate?.name || 'Not selected'}`;
              }).join('\n');
              alert(`Your Current Ballot:\n\n${summary}`);
            }}
            className="btn-secondary"
          >
            📋 View My Ballot Summary
          </button>
        </div>
      )}
    </div>
  );
}
