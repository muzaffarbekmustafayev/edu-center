'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { BookOpen, Edit2, CheckCircle } from 'lucide-react';

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [newPrice, setNewPrice] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await apiClient.get('/courses');
      setCourses(res.data.items || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/courses/${editingCourse.id}`, {
        price: parseInt(newPrice, 10),
      });
      setSuccessMsg('Kurs narxi muvaffaqiyatli yangilandi (kelgusi yangi sikllarga tatbiq etiladi)');
      setEditingCourse(null);
      loadCourses();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mening Kurslarim</h1>
        <p className="text-sm text-gray-500">
          Siz o‘tadigan o‘quv fanlari va 12 darslik to‘lov sikli narxlari
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-sm">
          Kurslar mavjud emas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">{c.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {c.description || 'Tavsif berilmagan'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 block">Sikl narxi ({c.lessonCount} dars)</span>
                  <span className="text-base font-bold text-indigo-600">
                    {c.price?.toLocaleString('uz-UZ')} so‘m
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingCourse(c);
                    setNewPrice(String(c.price));
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Narxni o‘zgartirish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Price Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kurs narxini yangilash</h3>
            <p className="text-xs text-gray-500 mb-4">
              Kurs: <span className="font-semibold text-gray-800">{editingCourse.name}</span>
            </p>

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Yangi sikl narxi (so‘m)
                </label>
                <input
                  type="number"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Eslatma: Narxning o‘zgarishi faqat kelgusida ochiladigan yangi sikllarga ta'sir qiladi.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
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
