"use client";

import { ModuleInfo } from "@/lib/types";

interface ModuleCardProps {
  module: ModuleInfo;
  onStart: (moduleId: string) => void;
}

const moduleColors: Record<string, { bg: string; border: string; icon: string }> = {
  sinus: {
    bg: "from-blue-600/20 to-blue-800/20",
    border: "border-blue-500/30 hover:border-blue-400",
    icon: "text-blue-400",
  },
  atrial: {
    bg: "from-purple-600/20 to-purple-800/20",
    border: "border-purple-500/30 hover:border-purple-400",
    icon: "text-purple-400",
  },
  junctional: {
    bg: "from-cyan-600/20 to-cyan-800/20",
    border: "border-cyan-500/30 hover:border-cyan-400",
    icon: "text-cyan-400",
  },
  ventricular: {
    bg: "from-cardio-600/20 to-cardio-800/20",
    border: "border-cardio-500/30 hover:border-cardio-400",
    icon: "text-cardio-400",
  },
  channelopathies: {
    bg: "from-amber-600/20 to-amber-800/20",
    border: "border-amber-500/30 hover:border-amber-400",
    icon: "text-amber-400",
  },
};

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function PulseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function ChannelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M6 12h12" />
    </svg>
  );
}

function NodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

const iconComponents: Record<string, React.FC<{ className?: string }>> = {
  heartbeat: HeartIcon,
  pulse: PulseIcon,
  nodal: NodeIcon,
  lightning: LightningIcon,
  channel: ChannelIcon,
};

export default function ModuleCard({ module, onStart }: ModuleCardProps) {
  const colors = moduleColors[module.id] || moduleColors.sinus;
  const IconComponent = iconComponents[module.icon] || HeartIcon;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} backdrop-blur-sm p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <IconComponent className="w-full h-full" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-white/5 ${colors.icon}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-white/10 text-white/80">
            {module.questionCount} questions
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{module.name}</h3>
        <p className="text-sm text-white/60 mb-6 line-clamp-2">
          {module.description}
        </p>

        <button
          onClick={() => onStart(module.id)}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-white/10 to-white/5 border border-white/20 hover:from-white/20 hover:to-white/10 transition-all duration-200 flex items-center justify-center gap-2`}
        >
          Start Quiz
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
