'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { FolderKanban, Users, Clock, MapPin, ChevronRight, BookOpen } from 'lucide-react';

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyGroups();
  }, []);

  const loadMyGroups = async () => {
    try {
      const res = await apiClient.get('/teacher/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const daysLabels = ['', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mening Guruhlarim</h1>
        <p className="text-sm text-gray-500">
          Sizga biriktirilgan faol dars guruhlari va o‘quvchilar ro‘yxati
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          Sizga hozircha guruhlar biriktirilmagan.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => {
            const scheduleStr = g.schedules
              ?.map((s: any) => `${daysLabels[s.dayOfWeek]} ${s.startTime}`)
              .join(', ');

            return (
              <Link
                key={g.id}
                href={`/teacher/groups/${g.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                      {g.courseName}
                    </span>
                    {g.hasLessonToday && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full animate-pulse">
                        Bugun dars bor 🔥
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mt-3 text-lg group-hover:text-indigo-600 transition">
                    {g.name}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{scheduleStr || 'Jadval belgilanmagan'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>Xona: {g.room || 'Belgilanmagan'} ({g.durationMin} daqiqa)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{g.studentCount} ta o‘quvchi</span>
                  </div>
                  <span className="text-indigo-600 font-semibold inline-flex items-center gap-1 group-hover:translate-x-1 transition">
                    O‘quvchilar ro‘yxati <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
