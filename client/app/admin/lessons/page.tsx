'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Calendar, Clock, MapPin, XCircle, AlertCircle, Search } from 'lucide-react';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(true);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingLesson, setCancellingLesson] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    loadGroups();
    loadLessons();
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const res = await apiClient.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLessons = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/lessons', {
        params: { groupId: selectedGroupId || undefined },
      });
      setLessons(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancel = (lesson: any) => {
    setCancellingLesson(lesson);
    setCancelReason('Texnik sabablarga ko‘ra qoldirildi');
    setCancelError('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelError('');

    try {
      await apiClient.post(`/lessons/${cancellingLesson.id}/cancel`, {
        reason: cancelReason,
      });
      setShowCancelModal(false);
      loadLessons();
    } catch (err: any) {
      setCancelError(err.response?.data?.message || 'Darsni bekor qilishda xatolik');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Darslar Jadvali</h1>
          <p className="text-sm text-gray-500">
            Rejalashtirilgan, o‘tilgan va bekor qilingan darslar ro‘yxati
          </p>
        </div>

        <div className="w-64">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : lessons.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Darslar topilmadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Sana & Vaqt</th>
                  <th className="px-6 py-3.5">Guruh / Kurs</th>
                  <th className="px-6 py-3.5">O‘qituvchi</th>
                  <th className="px-6 py-3.5">Xona</th>
                  <th className="px-6 py-3.5">Holati</th>
                  <th className="px-6 py-3.5 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lessons.map((l) => {
                  const dateStr = new Date(l.scheduledAt).toLocaleDateString('uz-UZ', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = new Date(l.scheduledAt).toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Tashkent',
                  });

                  return (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 block">{dateStr}</span>
                        <span className="text-xs text-blue-600 font-mono">{timeStr}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 block">{l.group?.name}</span>
                        <span className="text-xs text-gray-400">{l.group?.course?.name}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {l.group?.teacher?.name}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">{l.group?.room || '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            l.status === 'DONE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : l.status === 'CANCELLED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {l.status === 'DONE'
                            ? 'O‘tildi'
                            : l.status === 'CANCELLED'
                              ? 'Bekor qilingan'
                              : 'Rejalashtirilgan'}
                        </span>
                        {l.cancelReason && (
                          <span className="block text-[11px] text-red-500 mt-1">
                            Sabab: {l.cancelReason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {l.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleOpenCancel(l)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition"
                          >
                            Bekor qilish
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && cancellingLesson && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Darsni bekor qilish</h3>
            <p className="text-xs text-gray-500 mb-4">
              Guruh: <span className="font-semibold text-gray-800">{cancellingLesson.group?.name}</span>
            </p>

            {cancelError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Bekor qilish sababi (Ota-ona va o‘quvchiga boradi)
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Bekor qilishni tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
