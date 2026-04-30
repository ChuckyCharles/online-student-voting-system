import React from 'react';

interface VotingProgressProps {
  totalPositions: number;
  totalVoted: number;
  nextPosition?: {
    name: string;
    icon: string;
  };
}

export const VotingProgress: React.FC<VotingProgressProps> = ({
  totalPositions,
  totalVoted,
  nextPosition,
}) => {
  const progressPercentage = totalPositions > 0 ? (totalVoted / totalPositions) * 100 : 0;
  const remainingPositions = totalPositions - totalVoted;

  return (
    <div className="bg-gradient-to-br from-slate-50/80 via-slate-50/60 to-slate-100/40 backdrop-blur-md rounded-2xl p-6 border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Voting Progress
          </h3>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalVoted}/{totalPositions}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            {Math.round(progressPercentage)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Complete</p>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="mb-4">
        <div className="relative h-3 bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-lg"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Stats and Next Step */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/30">
        <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-slate-100/50">
          <p className="text-xs text-slate-600 font-medium">Remaining</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{remainingPositions}</p>
        </div>
        {nextPosition ? (
          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-3 border border-slate-100/50">
            <p className="text-xs text-slate-600 font-medium">Next Step</p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {nextPosition.icon} {nextPosition.name}
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-emerald-400/20 to-green-400/20 backdrop-blur-sm rounded-lg p-3 border border-emerald-200/50">
            <p className="text-xs text-emerald-700 font-bold uppercase">✓ Voting Complete</p>
          </div>
        )}
      </div>
    </div>
  );
};
