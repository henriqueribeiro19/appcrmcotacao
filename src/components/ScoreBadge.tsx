interface ScoreBadgeProps {
  score: number;
  classificacao: string;
}

export function ScoreBadge({ score, classificacao }: ScoreBadgeProps) {
  const colors: Record<string, string> = {
    A: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    B: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${colors[classificacao] || colors.C}`}>
      <span>{classificacao}</span>
      <span className="opacity-70">{score}</span>
    </span>
  );
}
