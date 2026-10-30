'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Search, BookOpen, Edit2, Trash2 } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('450000');
  const [lessonCount, setLessonCount] = useState('12');
  const [teacherId, setTeacherId] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/users?role=TEACHER'),
      ]);
      setCourses(coursesRes.data.items || coursesRes.data);
      setTeachers(usersRes.data.items || usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      setName(course.name);
      setPrice(String(course.price));
      setLessonCount(String(course.lessonCount || 12));
      setTeacherId(course.teacherId || '');
      setDescription(course.description || '');
    } else {
      setEditingCourse(null);
      setName('');
      setPrice('450000');
      setLessonCount('12');
      setTeacherId(teachers[0]?.id || '');
      setDescription('');
    }
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        name,
        price: parseInt(price, 10),
        lessonCount: parseInt(lessonCount, 10),
        teacherId: teacherId || undefined,
        description: description || undefined,
      };

      if (editingCourse) {
        await apiClient.patch(`/courses/${editingCourse.id}`, payload);
      } else {
        await apiClient.post('/courses', payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Kursni o‘chirmoqchimisiz?')) return;
    try {
      await apiClient.delete(`/courses/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kurslar</h1>
          <p className="text-sm text-gray-500">
            O‘quv fanlari, narxlar va 12 darslik to‘lov sikli parametrlari
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yangi kurs yaratish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 text-sm">
            Kurslar mavjud emas.
          </div>
        ) : (
          courses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:border-blue-100 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mt-3 text-base">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {c.description || 'Tavsif berilmagan'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 block">Sikl narxi ({c.lessonCount} dars)</span>
                  <span className="text-base font-bold text-blue-600">
                    {c.price?.toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block">Mas'ul o‘qituvchi</span>
                  <span className="font-semibold text-gray-800">
                    {c.teacher?.name || 'Biriktirilmagan'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingCourse ? 'Kursni tahrirlash' : 'Yangi kurs yaratish'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Kurs nomi
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="IELTS Foundation"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Narxi (so‘m)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Darslar soni (sikl)
                  </label>
                  <input
                    type="number"
                    required
                    value={lessonCount}
                    onChange={(e) => setLessonCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Mas'ul O‘qituvchi
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tanlang...</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Tavsif (ixtiyoriy)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kurs haqida qisqacha ma'lumot..."
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
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
