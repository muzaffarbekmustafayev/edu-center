'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { DollarSign, Plus, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('salary');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [typeFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transactions', {
        params: { type: typeFilter || undefined },
      });
      setTransactions(res.data.items || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      await apiClient.post('/transactions', {
        type,
        amount: parseInt(amount, 10),
        category,
        description: description || undefined,
      });
      setShowModal(false);
      setAmount('');
      setDescription('');
      loadTransactions();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Tranzaksiyani kiritishda xatolik yuz berdi');
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buxgalteriya</h1>
          <p className="text-sm text-gray-500">
            Kirimlar (to‘lovlar) va chiqimlar (maosh, ijara, kommunal) hisobi
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Yangi tranzaksiya (Chiqim/Kirim)
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Jami Kirim</p>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">
              +{totalIncome.toLocaleString('uz-UZ')} so‘m
            </h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Jami Chiqim</p>
            <h3 className="text-xl font-bold text-red-600 mt-1">
              -{totalExpense.toLocaleString('uz-UZ')} so‘m
            </h3>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Sof Farq (Balans)</p>
            <h3 className="text-xl font-bold text-blue-600 mt-1">
              {(totalIncome - totalExpense).toLocaleString('uz-UZ')} so‘m
            </h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-gray-700">Tranzaksiyalar jurnali</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Barchasi</option>
            <option value="INCOME">Faqat Kirimlar</option>
            <option value="EXPENSE">Faqat Chiqimlar</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Tranzaksiyalar topilmadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Turi</th>
                  <th className="px-6 py-3.5">Kategoriya</th>
                  <th className="px-6 py-3.5">Tavsif / Izoh</th>
                  <th className="px-6 py-3.5">Summa</th>
                  <th className="px-6 py-3.5">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          t.type === 'INCOME'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {t.type === 'INCOME' ? 'Kirim' : 'Chiqim'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                      {t.category}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{t.description || '—'}</td>
                    <td
                      className={`px-6 py-4 font-bold font-mono ${
                        t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {t.type === 'INCOME' ? '+' : '-'}
                      {t.amount?.toLocaleString('uz-UZ')} so‘m
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(t.date || t.createdAt).toLocaleDateString('uz-UZ')}
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tranzaksiya kiritish</h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Tranzaksiya turi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType('EXPENSE');
                      setCategory('salary');
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      type === 'EXPENSE'
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    Chiqim (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('INCOME');
                      setCategory('other_income');
                    }}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      type === 'INCOME'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    Kirim (Income)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Summa (so‘m)
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000000"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Kategoriya
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {type === 'EXPENSE' ? (
                    <>
                      <option value="salary">O‘qituvchi / Xodim maoshi</option>
                      <option value="rent">Xona / Bino ijarasi</option>
                      <option value="utilities">Kommunal to‘lovlar</option>
                      <option value="equipment">Jihozlar & materiallar</option>
                      <option value="marketing">Marketing va reklama</option>
                      <option value="other_expense">Boshqa xarajatlar</option>
                    </>
                  ) : (
                    <>
                      <option value="tuition">O‘qish to‘lovi</option>
                      <option value="book_sale">Kitob va materiallar sotuvi</option>
                      <option value="other_income">Boshqa tushum</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Izoh / Tavsif
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Izoh yozing..."
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
