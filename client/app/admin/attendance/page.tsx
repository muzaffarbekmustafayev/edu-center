'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { CheckSquare, Calendar, Clock, AlertTriangle, CheckCircle, Save } from 'lucide-react';

export default function AdminAttendancePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [draft, setDraft] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const res = await apiClient.get('/groups');
      setGroups(res.data);
      if (res.data.length > 0) {
        setSelectedGroupId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedGroupId) return;
    loadLessons(selectedGroupId);
  }, [selectedGroupId]);

  const loadLessons = async (groupId: string) => {
    try {
      const res = await apiClient.get('/lessons', { params: { groupId } });
      setLessons(res.data);
      if (res.data.length > 0) {
        setSelectedLessonId(res.data[0].id);
      } else {
        setSelectedLessonId('');
        setAttendanceData(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!selectedLessonId) return;
    loadAttendance(selectedLessonId);
  }, [selectedLessonId]);

  const loadAttendance = async (lessonId: string) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await apiClient.get(`/attendance/lessons/${lessonId}`);
      setAttendanceData(res.data);

      const initialDraft: Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'> = {};
      for (const item of res.data.students || []) {
        initialDraft[item.studentId] = item.status || 'PRESENT';
      }
      setDraft(initialDraft);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'EXCUSED') => {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedLessonId) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const attendances = Object.entries(draft).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await apiClient.post(`/attendance/lessons/${selectedLessonId}`, { attendances });
      setSuccessMsg('Davomat muvaffaqiyatli saqlandi! Dars hisoblandi va kelmagan o‘quvchilar ota-onasiga xabar yuborildi.');
      loadAttendance(selectedLessonId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Davomatni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Davomat</h1>
          <p className="text-sm text-gray-500">
            Darslar bo‘yicha davomatni belgilash va ota-onalarga tezkor ogohlantirish
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
            Guruhni tanlang
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.course?.name})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
            Darsni tanlang
          </label>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={lessons.length === 0}
          >
            {lessons.map((l) => {
              const dateStr = new Date(l.scheduledAt).toLocaleString('uz-UZ', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <option key={l.id} value={l.id}>
                  {dateStr} — {l.status}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Alert Notice */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-800 space-y-1">
        <p className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-blue-600" /> Muhim tizim qoidalari:
        </p>
        <p>1. O‘quvchi kelgan (<b>PRESENT</b>) yoki kelmagan (<b>ABSENT</b>) bo‘lishidan qat'i nazar dars o‘tildi deb hisoblanadi (lessonsDone++).</p>
        <p>2. <b>ABSENT</b> deb belgilangan har bir o‘quvchining mas'ul ota-onasiga zudlik bilan avtomatik Telegram bildirishnoma uzatiladi.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Student attendance list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !attendanceData?.students || attendanceData.students.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Tanlangan dars uchun o‘quvchilar ro‘yxati topilmadi.
          </div>
        ) : (
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Guruh o‘quvchilari ({attendanceData.students.length} ta)
              </span>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saqlanmoqda...' : 'Davomatni saqlash'}</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {attendanceData.students.map((st: any) => {
                const currentStatus = draft[st.studentId] || 'PRESENT';

                return (
                  <div
                    key={st.studentId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{st.studentName}</h4>
                      <p className="text-xs text-gray-500">
                        Ota-ona: {st.parentName || 'Biriktirilmagan'} ({st.parentPhone || '—'})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.studentId, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        ✅ Keldi
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.studentId, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          currentStatus === 'ABSENT'
                            ? 'bg-red-600 border-red-600 text-white shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        ❌ Kelmadi
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStatusChange(st.studentId, 'EXCUSED')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          currentStatus === 'EXCUSED'
                            ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        ⏸ Sababli
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
