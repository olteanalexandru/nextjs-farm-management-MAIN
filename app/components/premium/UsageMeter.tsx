interface UsageMeterProps {
  label: string;
  used: number;
  limit: number;
}

export default function UsageMeter({ label, used, limit }: UsageMeterProps) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const atLimit = used >= limit;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span>{used} / {limit} today</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${atLimit ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
