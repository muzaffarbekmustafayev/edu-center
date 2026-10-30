'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Users, Clock, MapPin, ChevronRight, ArrowLeft, HeartHandshake, CheckCircle } from 'lucide-react';

export default function TeacherGroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadGroupDetail();
    }
  }, [groupId]);

  const loadGroupDetail = async () => {
    try {
      const res = await apiClient.get(`/teacher/groups/${groupId}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daysLabels = ['', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data?.group) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
        Guruh ma'lumotlari topilmadi.
      </div>
    );
  }

  const { group, students } = data;
  const scheduleStr = group.schedules
    ?.map((s: any) => `${daysLabels[s.dayOfWeek]} ${s.startTime}`)
    .join(', ');

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/groups"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Barcha guruhlarimga qaytish
      </Link>

      {/* Group Card Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
            {group.courseName}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-2">{group.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {scheduleStr || 'Jadval belgilanmagan'} ({group.durationMin} daqiqa)
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              Xona: {group.room || 'Belgilanmagan'}
            </span>
          </div>
        </div>

        <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-center shrink-0">
          <p className="text-xs text-indigo-700 font-medium">Jami O‘quvchilar</p>
          <p className="text-2xl font-black text-indigo-950 mt-0.5">{students.length} ta</p>
        </div>
      </div>

      {/* Students list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
            Guruh O‘quvchilari Ro‘yxati
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            O‘quvchi to‘liq davomat tarixini ko‘rish uchun uning qatoriga bosing
          </p>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">Guruhda o‘quvchilar yo‘q.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">O‘quvchi</th>
                  <th className="px-6 py-3.5">Telefon</th>
                  <th className="px-6 py-3.5">Mas'ul Ota yoki Ona</th>
                  <th className="px-6 py-3.5">12 Darslik Sikl</th>
                  <th className="px-6 py-3.5">Holati</th>
                  <th className="px-6 py-3.5 text-right">Tarix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((st: any) => (
                  <tr
                    key={st.studentId}
                    className="hover:bg-indigo-50/40 transition cursor-pointer"
                    onClick={() => {
                      window.location.href = `/teacher/groups/${groupId}/students/${st.studentId}`;
                    }}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">{st.studentName}</td>
                    <td className="px-6 py-4">{st.studentPhone}</td>
                    <td className="px-6 py-4">
                      {st.parentName ? (
                        <div>
                          <span className="font-medium text-gray-800 block">
                            {st.parentName} ({st.parentRelation})
                          </span>
                          <span className="text-xs text-gray-400">{st.parentPhone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Biriktirilmagan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {st.currentCycle ? (
                        <div>
                          <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">
                            {st.currentCycle.lessonsDone}/{st.currentCycle.lessonsRequired} dars
                          </span>
                          <span
                            className={`block text-[11px] font-medium mt-0.5 ${
                              st.currentCycle.status === 'PAID'
                                ? 'text-emerald-600'
                                : st.currentCycle.status === 'OVERDUE'
                                  ? 'text-red-600'
                                  : 'text-amber-600'
                            }`}
                          >
                            {st.currentCycle.status === 'PAID'
                              ? '🟢 To‘langan'
                              : st.currentCycle.status === 'OVERDUE'
                                ? '🔴 Kechikkan'
                                : '🟡 Kutilmoqda'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Sinov darsida</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          st.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {st.status === 'ACTIVE' ? 'Faol' : 'To‘xtatilgan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                        Davomat tarixi <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
