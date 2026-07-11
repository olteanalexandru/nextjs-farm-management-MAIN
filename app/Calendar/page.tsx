'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

interface FarmEvent {
  id: number;
  title: string;
  eventType: string;
  date: string;
  cropId: number | null;
  fieldId: number | null;
  notes: string | null;
  completed: boolean;
}

interface OwnCrop {
  id: number;
  cropName: string;
}

const EVENT_TYPES = ['PLANTING', 'HARVESTING', 'FERTILIZATION', 'PEST_TREATMENT', 'IRRIGATION', 'SOIL_TEST', 'CUSTOM'] as const;
type EventType = typeof EVENT_TYPES[number];

const TYPE_COLORS: Record<EventType, string> = {
  PLANTING:       'bg-green-100 text-green-800 border-green-200',
  HARVESTING:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  FERTILIZATION:  'bg-blue-100 text-blue-800 border-blue-200',
  PEST_TREATMENT: 'bg-red-100 text-red-800 border-red-200',
  IRRIGATION:     'bg-cyan-100 text-cyan-800 border-cyan-200',
  SOIL_TEST:      'bg-purple-100 text-purple-800 border-purple-200',
  CUSTOM:         'bg-gray-100 text-gray-800 border-gray-200',
};

const TYPE_DOT: Record<EventType, string> = {
  PLANTING:       'bg-green-500',
  HARVESTING:     'bg-yellow-500',
  FERTILIZATION:  'bg-blue-500',
  PEST_TREATMENT: 'bg-red-500',
  IRRIGATION:     'bg-cyan-500',
  SOIL_TEST:      'bg-purple-500',
  CUSTOM:         'bg-gray-500',
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPTY_FORM = {
  title: '',
  eventType: 'CUSTOM' as EventType,
  date: '',
  cropId: '',
  notes: '',
  completed: false,
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<FarmEvent[]>([]);
  const [crops, setCrops] = useState<OwnCrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<EventType | ''>('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, cropsRes] = await Promise.all([
        fetch(`/api/Controllers/FarmEvent?year=${viewYear}&month=${viewMonth + 1}`),
        fetch('/api/Controllers/Crop/crops/all?limit=200'),
      ]);
      if (!eventsRes.ok || !cropsRes.ok) throw new Error('Failed to load data');
      const eventsData = await eventsRes.json();
      const cropsData = await cropsRes.json();
      setEvents(eventsData.events ?? []);
      setCrops((cropsData.crops ?? []).map((c: OwnCrop) => ({ id: c.id, cropName: c.cropName })));
    } catch (e) {
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, FarmEvent[]> = {};
    for (const ev of events) {
      const d = new Date(ev.date);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    }
    return map;
  }, [events, viewYear, viewMonth]);

  const filteredEvents = useMemo(() => {
    const filtered = filterType ? events.filter(e => e.eventType === filterType) : events;
    return [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, filterType]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function openAddForm(day?: number) {
    setEditingId(null);
    const dateStr = day
      ? `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : '';
    setForm({ ...EMPTY_FORM, date: dateStr });
    setShowForm(true);
    setSelectedDay(null);
  }

  function openEditForm(ev: FarmEvent) {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      eventType: ev.eventType as EventType,
      date: ev.date.slice(0, 10),
      cropId: ev.cropId != null ? String(ev.cropId) : '',
      notes: ev.notes ?? '',
      completed: ev.completed,
    });
    setShowForm(true);
    setSelectedDay(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date) return;
    setSubmitting(true);
    try {
      const body = {
        title: form.title.trim(),
        eventType: form.eventType,
        date: form.date,
        cropId: form.cropId ? Number(form.cropId) : null,
        notes: form.notes || null,
        completed: form.completed,
      };
      const url = editingId
        ? `/api/Controllers/FarmEvent/${editingId}`
        : '/api/Controllers/FarmEvent';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to save event');
      }
      setShowForm(false);
      await loadEvents();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this event?')) return;
    try {
      const res = await fetch(`/api/Controllers/FarmEvent/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await loadEvents();
      setSelectedDay(null);
    } catch {
      alert('Failed to delete event');
    }
  }

  async function toggleCompleted(ev: FarmEvent) {
    try {
      const res = await fetch(`/api/Controllers/FarmEvent/${ev.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !ev.completed }),
      });
      if (!res.ok) throw new Error('Failed to update event');
      await loadEvents();
    } catch {
      alert('Failed to update event');
    }
  }

  const dayEvents = selectedDay != null ? (eventsByDay[selectedDay] ?? []) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Farm Calendar</h1>
              <p className="text-sm text-gray-500 mt-0.5">Plan and track planting, harvesting, and field activities</p>
            </div>
            <button
              onClick={() => openAddForm()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <div className="flex flex-col lg:flex-row">
            {/* Calendar grid */}
            <div className="flex-1 p-6">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                  {Array.from({ length: firstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="bg-gray-50 h-20" />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                    const dayEvs = eventsByDay[day] ?? [];
                    const isSelected = selectedDay === day;
                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`bg-white h-20 p-1 cursor-pointer hover:bg-green-50 transition-colors ${isSelected ? 'ring-2 ring-inset ring-green-400' : ''}`}
                      >
                        <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-green-600 text-white' : 'text-gray-700'}`}>
                          {day}
                        </div>
                        <div className="space-y-px overflow-hidden">
                          {dayEvs.slice(0, 3).map(ev => (
                            <div
                              key={ev.id}
                              className={`text-xs px-1 truncate rounded border ${TYPE_COLORS[ev.eventType as EventType] ?? TYPE_COLORS.CUSTOM} ${ev.completed ? 'opacity-50 line-through' : ''}`}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvs.length > 3 && (
                            <div className="text-xs text-gray-400 px-1">+{dayEvs.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                {EVENT_TYPES.map(t => (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[t]}`}></span>
                    <span className="text-xs text-gray-600">{t.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col">
              {/* Day events panel */}
              {selectedDay != null && (
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">
                      {MONTH_NAMES[viewMonth]} {selectedDay}
                    </h3>
                    <button
                      onClick={() => openAddForm(selectedDay)}
                      className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      + Add
                    </button>
                  </div>
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-gray-400">No events this day.</p>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map(ev => (
                        <div key={ev.id} className={`rounded-lg border p-2 ${TYPE_COLORS[ev.eventType as EventType] ?? TYPE_COLORS.CUSTOM}`}>
                          <div className="flex items-start justify-between gap-1">
                            <span className={`text-sm font-medium ${ev.completed ? 'line-through opacity-60' : ''}`}>{ev.title}</span>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => toggleCompleted(ev)} title={ev.completed ? 'Mark incomplete' : 'Mark complete'}
                                className="p-0.5 hover:opacity-70">
                                {ev.completed
                                  ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                  : <svg className="w-4 h-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2}/></svg>
                                }
                              </button>
                              <button onClick={() => openEditForm(ev)} title="Edit" className="p-0.5 hover:opacity-70">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => handleDelete(ev.id)} title="Delete" className="p-0.5 hover:opacity-70">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="text-xs mt-1 opacity-70">{ev.eventType.replace('_', ' ')}</div>
                          {ev.notes && <div className="text-xs mt-1 opacity-80">{ev.notes}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* All events list */}
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">All Events</h3>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as EventType | '')}
                    className="text-xs border border-gray-300 rounded px-1.5 py-1 text-gray-700"
                  >
                    <option value="">All types</option>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                {loading ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : filteredEvents.length === 0 ? (
                  <p className="text-sm text-gray-400">No events this month.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.map(ev => {
                      const d = new Date(ev.date);
                      return (
                        <div
                          key={ev.id}
                          className={`rounded-lg border p-2.5 cursor-pointer hover:shadow-sm transition-shadow ${TYPE_COLORS[ev.eventType as EventType] ?? TYPE_COLORS.CUSTOM}`}
                          onClick={() => {
                            const day = d.getFullYear() === viewYear && d.getMonth() === viewMonth ? d.getDate() : null;
                            setSelectedDay(day);
                          }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${ev.completed ? 'line-through opacity-60' : ''}`}>{ev.title}</p>
                              <p className="text-xs opacity-70 mt-0.5">
                                {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                {' · '}{ev.eventType.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button onClick={e => { e.stopPropagation(); openEditForm(ev); }} title="Edit" className="p-0.5 hover:opacity-70">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDelete(ev.id); }} title="Delete" className="p-0.5 hover:opacity-70">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Event' : 'Add Event'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g. Plant winter wheat"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.eventType}
                    onChange={e => setForm(f => ({ ...f, eventType: e.target.value as EventType }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop (optional)</label>
                <select
                  value={form.cropId}
                  onChange={e => setForm(f => ({ ...f, cropId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">— None —</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.cropName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              {editingId && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.completed}
                    onChange={e => setForm(f => ({ ...f, completed: e.target.checked }))}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Mark as completed</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving…' : editingId ? 'Update Event' : 'Add Event'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
