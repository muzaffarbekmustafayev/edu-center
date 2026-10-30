'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Search, FolderKanban, Users, Clock, MapPin, UserPlus } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Group Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [room, setRoom] = useState('304');
  const [durationMin, setDurationMin] = useState('90');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Dush, Chor, Jum
  const [startTime, setStartTime] = useState('14:00');
  const [formError, setFormError] = useState('');

  // Enroll Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [studentIdToEnroll, setStudentIdToEnroll] = useState('');
  const [enrollError, setEnrollError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsRes, coursesRes, teachersRes, studentsRes] = await Promise.all([
        apiClient.get('/groups'),
        apiClient.get('/courses'),
        apiClient.get('/users?role=TEACHER'),
        apiClient.get('/students'),
      ]);
      setGroups(groupsRes.data);
      setCourses(coursesRes.data.items || coursesRes.data);
      setTeachers(teachersRes.data.items || teachersRes.data);
      setStudents(studentsRes.data.items || studentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (selectedDays.length === 0) {
      setFormError('Kamida bitta dars kunini tanlang');
      return;
    }

    try {
      const schedules = selectedDays.map((d) => ({
        dayOfWeek: d,
        startTime,
        durationMin: parseInt(durationMin, 10),
      }));

      await apiClient.post('/groups', {
        name,
        courseId,
        teacherId,
        room,
        durationMin: parseInt(durationMin, 10),
        schedules,
      });

      setShowModal(false);
      setName('');
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Guruh yaratishda xatolik yuz berdi');
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollError('');

    try {
      await apiClient.post(`/groups/${selectedGroupId}/enroll`, {
        studentId: studentIdToEnroll,
      });
      setShowEnrollModal(false);
      loadData();
    } catch (err: any) {
      setEnrollError(err.response?.data?.message || 'O‘quvchini biriktirishda xatolik');
    }
  };

  const daysLabels = ['', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guruhlar</h1>
          <p className="text-sm text-gray-500">
            Guruhlar jadvali, dars davomiyligi va 90 kunlik darslar monitoringi
          </p>
        </div>
        <button
          onClick={() => {
            setCourseId(courses[0]?.id || '');
            setTeacherId(teachers[0]?.id || '');
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yangi guruh ochish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm">
            Guruhlar mavjud emas.
          </div>
        ) : (
          groups.map((g) => {
            const scheduleStr = g.schedules
              ?.map((s: any) => `${daysLabels[s.dayOfWeek]} ${s.startTime}`)
              .join(', ');

            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:border-blue-100 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                      {g.course?.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedGroupId(g.id);
                        setStudentIdToEnroll(students[0]?.id || '');
                        setShowEnrollModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-800"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> A'zo qo‘shish
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-900 mt-3 text-lg">{g.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Ustoz: <span className="font-medium text-gray-700">{g.teacher?.name}</span>
                  </p>

                  <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{scheduleStr || 'Jadval belgilanmagan'} ({g.durationMin} daqiqa)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>Xona: {g.room || 'Belgilanmagan'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{g.enrollments?.length ?? 0} ta o‘quvchi</span>
                  </div>
                  <span className="text-emerald-700 font-semibold">
                    {g.course?.price?.toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Yangi guruh ochish</h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Guruh nomi
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="IELTS Foundation - 1"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Kursni tanlang
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    O‘qituvchi
                  </label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Xona raqami
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="304"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Davomiyligi (daqiqa)
                  </label>
                  <input
                    type="number"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-2">
                  Dars kunlari
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {daysLabels[day]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Boshlanish vaqti
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Guruhni ochish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Guruhga o‘quvchi qo‘shish</h3>

            {enrollError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {enrollError}
              </div>
            )}

            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  O‘quvchini tanlang
                </label>
                <select
                  value={studentIdToEnroll}
                  onChange={(e) => setStudentIdToEnroll(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.phone})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-2">
                  Dastlabki 2 ta qatnashgan darsi bepul sinov darsi hisoblanadi. Shundan so‘ng 12 darslik oldindan to‘lov talab etiladi.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
                >
                  Biriktirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
