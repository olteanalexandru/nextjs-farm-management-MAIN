'use client';

import { useEffect, useState } from 'react';

interface AiHistoryEntry {
  id: number;
  feature: string;
  query: string;
  createdAt: string;
  responseJson: string | null;
  cropId: number | null;
}

interface AiHistoryPanelProps {
  feature: 'CROP_LOOKUP' | 'FERTILIZATION_INSIGHT' | 'ROTATION_INSIGHT' | 'PEST_DIAGNOSIS';
  refreshKey?: number;
}

const FEATURE_LABELS: Record<string, string> = {
  CROP_LOOKUP: 'Crop Lookup',
  FERTILIZATION_INSIGHT: 'Fertilization Insight',
  ROTATION_INSIGHT: 'Rotation Health Insight',
  PEST_DIAGNOSIS: 'Pest & Disease Diagnosis'
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function renderResponse(feature: string, json: string) {
  try {
    const data = JSON.parse(json);
    if (feature === 'PEST_DIAGNOSIS') {
      const candidates = data.candidates ?? [];
      if (!data.isAgricultural || candidates.length === 0) {
        return <p className="text-sm text-gray-500">No matching candidates identified.</p>;
      }
      return (
        <ul className="space-y-1 mt-1">
          {candidates.map((c: { name: string; likelihood: string; type: string }, i: number) => (
            <li key={i} className="text-sm text-gray-700">
              <span className="font-medium">{c.name}</span>
              <span className="ml-2 text-xs text-gray-500">({c.type} · {c.likelihood})</span>
            </li>
          ))}
        </ul>
      );
    }
    if (feature === 'ROTATION_INSIGHT' || feature === 'FERTILIZATION_INSIGHT') {
      return (
        <div className="text-sm text-gray-700 space-y-1 mt-1">
          {data.summary && <p>{data.summary}</p>}
          {data.risks?.length > 0 && (
            <p className="text-orange-700">Risks: {data.risks.slice(0, 2).join('; ')}</p>
          )}
          {data.tips?.length > 0 && (
            <p className="text-green-700">Tips: {data.tips.slice(0, 2).join('; ')}</p>
          )}
        </div>
      );
    }
    if (feature === 'CROP_LOOKUP') {
      return (
        <div className="text-sm text-gray-700 mt-1 space-y-0.5">
          {data.cropName && <p className="font-medium">{data.cropName} ({data.cropType})</p>}
          {data.description && <p className="text-gray-500 line-clamp-2">{data.description}</p>}
        </div>
      );
    }
    return <p className="text-sm text-gray-500 mt-1">{json.slice(0, 120)}</p>;
  } catch {
    return <p className="text-sm text-gray-500 mt-1">{json.slice(0, 120)}</p>;
  }
}

export default function AiHistoryPanel({ feature, refreshKey }: AiHistoryPanelProps) {
  const [entries, setEntries] = useState<AiHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/Controllers/AiHistory?feature=${feature}&limit=10`)
      .then(r => r.json())
      .then(data => setEntries(data.logs ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [open, feature, refreshKey]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700"
      >
        <span>Past {FEATURE_LABELS[feature]} Results</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="divide-y bg-white">
          {loading && (
            <div className="p-4 text-sm text-gray-500 text-center">Loading history…</div>
          )}
          {!loading && entries.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">No saved results yet.</div>
          )}
          {!loading && entries.map(entry => (
            <div key={entry.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">{formatDate(entry.createdAt)}</p>
                  <p className="text-sm text-gray-800 truncate mt-0.5">{entry.query}</p>
                  {expanded.has(entry.id) && entry.responseJson && (
                    <div className="mt-2 bg-gray-50 rounded p-2">
                      {renderResponse(feature, entry.responseJson)}
                    </div>
                  )}
                </div>
                {entry.responseJson && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(entry.id)}
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    {expanded.has(entry.id) ? 'Hide' : 'View'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
