'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  Users,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Calendar,
  Clock,
  BookOpen,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const res = await apiClient.get('/reports/overview');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">O‘quv markazining asosiy ko‘rsatkichlari va bugungi darslar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Faol O‘quvchilar</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{data?.totalStudents ?? 0}</h3>
            </div>
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-3">Tizimda faol ta'lim olayotganlar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Faol Guruhlar</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{data?.activeGroups ?? 0}</h3>
            </div>
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-indigo-600 font-medium mt-3">Hozirgi kundagi o‘quv guruhlari</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Oldindan To‘lov Kutilayotganlar</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{data?.debtorsCount ?? 0}</h3>
            </div>
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-3">12 darslik to‘lovi tugagan yoki kechikkan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Oylik Sof Foyda</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {(data?.netProfit ?? 0).toLocaleString('uz-UZ')} <span className="text-xs font-normal text-gray-500">so‘m</span>
              </h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <span>Kirim: {(data?.monthlyIncome ?? 0).toLocaleString('uz-UZ')}</span>
            <span>•</span>
            <span>Chiqim: {(data?.monthlyExpense ?? 0).toLocaleString('uz-UZ')}</span>
          </div>
        </div>
      </div>

      {/* Today's Lessons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Bugungi darslar jadvali</h2>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
            {data?.todayLessons?.length || 0} ta dars rejalashtirilgan
          </span>
        </div>

        {(!data?.todayLessons || data.todayLessons.length === 0) ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Bugun uchun rejalashtirilgan darslar yo‘q.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.todayLessons.map((lesson: any) => {
              const time = new Date(lesson.scheduledAt).toLocaleTimeString('uz-UZ', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Tashkent',
              });

              return (
                <div key={lesson.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center py-1 px-2 bg-gray-50 rounded-lg border border-gray-100 text-xs font-semibold text-gray-700">
                      <Clock className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-600" />
                      {time}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {lesson.group?.course?.name} — {lesson.group?.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        O‘qituvchi: {lesson.group?.teacher?.name || 'Belgilanmagan'} • Xona: {lesson.group?.room || 'Yo‘q'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {lesson.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
