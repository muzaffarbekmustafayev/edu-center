'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import {
  ArrowLeft,
  User,
  Phone,
  HeartHandshake,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  CreditCard,
} from 'lucide-react';

export default function StudentAttendanceHistoryPage() {
  const params = useParams();
  const groupId = params.id as string;
  const studentId = params.studentId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId && studentId) {
      loadHistory();
    }
  }, [groupId, studentId]);

  const loadHistory = async () => {
    try {
      const res = await apiClient.get(
        `/teacher/groups/${groupId}/students/${studentId}`,
      );
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data?.student) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
        O‘quvchi ma'lumotlari topilmadi.
      </div>
    );
  }

  const { student, group, attendanceHistory, paymentCycles } = data;

  const presentCount = attendanceHistory.filter(
    (a: any) => a.attendanceStatus === 'PRESENT',
  ).length;
  const absentCount = attendanceHistory.filter(
    (a: any) => a.attendanceStatus === 'ABSENT',
  ).length;
  const excusedCount = attendanceHistory.filter(
    (a: any) => a.attendanceStatus === 'EXCUSED',
  ).length;

  return (
    <div className="space-y-6">
      <Link
        href={`/teacher/groups/${groupId}`}
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Guruh sahifasiga qaytish
      </Link>

      {/* Student & Parent Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                {group.courseName} — {group.name}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  student.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {student.status === 'ACTIVE' ? 'Faol O‘quvchi' : 'To‘xtatilgan (Suspended)'}
              </span>
            </div>

            <h1 className="text-2xl font-black text-gray-900 mt-2">{student.name}</h1>
            <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-1 font-mono">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {student.phone}
            </p>
          </div>

          {/* Responsible Parent Card */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 min-w-[260px]">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-indigo-600" /> Mas'ul Ota yoki Ona:
            </p>
            {student.parent ? (
              <div>
                <p className="font-bold text-gray-900 text-sm">{student.parent.name}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{student.parent.phone}</p>
                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                  Qarindoshligi: {student.parentRelation || 'Ota-ona'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Ota-ona biriktirilmagan</p>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <span className="text-xs text-blue-700 font-medium block">O‘tilgan darslar</span>
            <span className="text-lg font-bold text-blue-900">{student.lessonsDone} ta</span>
          </div>

          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <span className="text-xs text-emerald-700 font-medium block">Qatnashdi (Keldi)</span>
            <span className="text-lg font-bold text-emerald-900">{presentCount} ta</span>
          </div>

          <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
            <span className="text-xs text-red-700 font-medium block">Qoldirdi (Kelmadi)</span>
            <span className="text-lg font-bold text-red-900">{absentCount} ta</span>
          </div>

          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100">
            <span className="text-xs text-amber-700 font-medium block">Sababli darslar</span>
            <span className="text-lg font-bold text-amber-900">{excusedCount} ta</span>
          </div>
        </div>
      </div>

      {/* Complete Attendance History */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Barcha Darslar Bo‘yicha Davomat Tarixi</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Guruhning o‘tgan barcha darslaridagi to‘liq qatnashish holatlari
            </p>
          </div>
        </div>

        {attendanceHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Darslar tarixi mavjud emas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Dars Sanasi</th>
                  <th className="px-6 py-3.5">Boshlanish Vaqti</th>
                  <th className="px-6 py-3.5">Dars Holati</th>
                  <th className="px-6 py-3.5">O‘quvchi Davomati</th>
                  <th className="px-6 py-3.5">Belgilangan Joy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceHistory.map((item: any) => {
                  const dateStr = new Date(item.scheduledAt).toLocaleDateString('uz-UZ', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = new Date(item.scheduledAt).toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Tashkent',
                  });

                  return (
                    <tr key={item.lessonId} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">{dateStr}</td>
                      <td className="px-6 py-4 font-mono text-xs">{timeStr}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {item.lessonStatus}
                        </span>
                        {item.cancelReason && (
                          <span className="block text-[11px] text-red-500 mt-0.5">
                            Sabab: {item.cancelReason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.attendanceStatus === 'PRESENT' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" /> ✅ Keldi
                          </span>
                        ) : item.attendanceStatus === 'ABSENT' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" /> ❌ Kelmadi
                          </span>
                        ) : item.attendanceStatus === 'EXCUSED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> ⏸ Sababli
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belgilanmagan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {item.markedVia ? `${item.markedVia} orqali` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
