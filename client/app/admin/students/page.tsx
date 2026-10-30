'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Plus, Search, Trash2, Edit2, User, Phone, Send, HeartHandshake } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [telegramId, setTelegramId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('+998');
  const [parentRelation, setParentRelation] = useState('Otasi');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadStudents();
  }, [search]);

  const loadStudents = async () => {
    try {
      const res = await apiClient.get('/students', {
        params: { search: search || undefined },
      });
      setStudents(res.data.items || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (st?: any) => {
    if (st) {
      setEditingStudent(st);
      setName(st.name);
      setPhone(st.phone);
      setTelegramId(st.telegramId || '');
      setParentName(st.parent?.name || '');
      setParentPhone(st.parent?.phone || '+998');
      setParentRelation(st.parentRelation || 'Otasi');
    } else {
      setEditingStudent(null);
      setName('');
      setPhone('+998');
      setTelegramId('');
      setParentName('');
      setParentPhone('+998');
      setParentRelation('Otasi');
    }
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingStudent) {
        await apiClient.patch(`/students/${editingStudent.id}`, {
          name,
          phone,
          telegramId: telegramId || undefined,
          parentPhone: parentPhone.length > 4 ? parentPhone : undefined,
          parentName: parentName || undefined,
          parentRelation,
        });
      } else {
        await apiClient.post('/students', {
          name,
          phone,
          telegramId: telegramId || undefined,
          parentPhone: parentPhone.length > 4 ? parentPhone : undefined,
          parentName: parentName || undefined,
          parentRelation,
        });
      }
      setShowModal(false);
      loadStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu o‘quvchini tizimdan o‘chirmoqchimisiz?')) return;
    try {
      await apiClient.delete(`/students/${id}`);
      loadStudents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">O‘quvchilar</h1>
          <p className="text-sm text-gray-500">
            Barcha o‘quvchilar va ularga biriktirilgan yagona mas'ul ota-ona ma'lumotlari
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yangi o‘quvchi qo‘shish
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="O‘quvchi yoki ota-onasi bo‘yicha qidiruv..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">O‘quvchilar topilmadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">O‘quvchi (F.I.SH)</th>
                  <th className="px-6 py-3.5">Telefon</th>
                  <th className="px-6 py-3.5">Mas'ul Ota yoki Ona</th>
                  <th className="px-6 py-3.5">Telegram</th>
                  <th className="px-6 py-3.5">Holati</th>
                  <th className="px-6 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4">{s.phone}</td>
                    <td className="px-6 py-4">
                      {s.parent ? (
                        <div>
                          <p className="text-gray-900 font-medium">
                            {s.parent.name} ({s.parentRelation || 'Ota-ona'})
                          </p>
                          <p className="text-xs text-gray-500">{s.parent.phone}</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 text-xs font-medium">Biriktirilmagan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.telegramId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">
                          <Send className="w-3 h-3" /> {s.telegramId}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Ulanmagan</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(s)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingStudent ? 'O‘quvchini tahrirlash' : 'Yangi o‘quvchi qo‘shish'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  O‘quvchi ismi (F.I.SH)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jasur Aliyev"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Telefon raqam
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Telegram ID (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="123456789"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4" /> Mas'ul Ota yoki Ona
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                      Ota-onaning ismi
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Rustam Aliyev"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                        Ota-onaning telefoni
                      </label>
                      <input
                        type="text"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="+998909876543"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                        Qarindoshligi
                      </label>
                      <select
                        value={parentRelation}
                        onChange={(e) => setParentRelation(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Otasi">Otasi</option>
                        <option value="Onasi">Onasi</option>
                        <option value="Vasiysi">Vasiysi</option>
                      </select>
                    </div>
                  </div>
                </div>
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
