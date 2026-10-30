'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { CreditCard, AlertCircle, CheckCircle, Receipt, Plus, Clock, Search } from 'lucide-react';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'debtors' | 'history'>('debtors');
  const [debtors, setDebtors] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Accept Payment Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'BANK'>('CARD');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [debtorsRes, paymentsRes] = await Promise.all([
        apiClient.get('/payments/debtors'),
        apiClient.get('/payments'),
      ]);
      setDebtors(debtorsRes.data);
      setPayments(paymentsRes.data.items || paymentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (cycle: any) => {
    setSelectedCycle(cycle);
    setAmount(String(cycle.amount));
    setMethod('CARD');
    setNote(`Sikl #${cycle.cycleNo} uchun 12 darslik oldindan to‘lov`);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const res = await apiClient.post('/payments', {
        cycleId: selectedCycle.id,
        amount: parseInt(amount, 10),
        method,
        note,
      });

      setShowModal(false);
      setReceipt(res.data);
      loadData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'To‘lovni qabul qilishda xatolik yuz berdi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">To‘lovlar (Prepay)</h1>
          <p className="text-sm text-gray-500">
            Oldindan to‘lov (12 darslik paketlar) va qabul qilingan to‘lovlar arxivi
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('debtors')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'debtors'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚠️ To‘lov kutilayotganlar ({debtors.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🧾 To‘lovlar tarixi ({payments.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'debtors' ? (
        /* Debtors / Pending prepay cycles */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-amber-50/40">
            <p className="text-xs text-amber-800 font-medium">
              💡 <b>Prepay qoidasi:</b> O‘quvchi har bir 12 ta dars boshlanishidan oldin to‘lov qilishi lozim.
              To‘lov kiritilganda darhol avtomatik kvitansiya farzandga ham, mas'ul ota-onaga ham jo‘natiladi.
            </p>
          </div>

          {debtors.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Qarzdorlik yoki to‘lov kutilayotgan sikllar mavjud emas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">O‘quvchi (Farzand)</th>
                    <th className="px-6 py-3.5">Kurs / Guruh</th>
                    <th className="px-6 py-3.5">Sikl & Darslar</th>
                    <th className="px-6 py-3.5">Summa</th>
                    <th className="px-6 py-3.5">Holati</th>
                    <th className="px-6 py-3.5 text-right">To‘lov</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {debtors.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {d.enrollment?.student?.name}
                        <span className="block text-xs text-gray-400 font-normal">
                          Ota-ona: {d.enrollment?.student?.parent?.name} ({d.enrollment?.student?.parent?.phone})
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">
                          {d.enrollment?.group?.course?.name}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {d.enrollment?.group?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          Sikl #{d.cycleNo} ({d.lessonsDone}/{d.lessonsRequired} dars)
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {d.amount?.toLocaleString('uz-UZ')} so‘m
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            d.status === 'OVERDUE'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {d.status === 'OVERDUE' ? 'Kechikkan (Overdue)' : 'Kutilmoqda (Pending)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenPayModal(d)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                        >
                          To‘lovni qabul qilish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Payment History */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {payments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">To‘lovlar tarixi bo‘sh.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Chek raqami</th>
                    <th className="px-6 py-3.5">O‘quvchi</th>
                    <th className="px-6 py-3.5">Kurs / Guruh</th>
                    <th className="px-6 py-3.5">Summa</th>
                    <th className="px-6 py-3.5">Usul</th>
                    <th className="px-6 py-3.5">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-blue-600 font-semibold">
                        {p.receiptNo || `#${p.id.substring(0, 8)}`}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {p.cycle?.enrollment?.student?.name}
                      </td>
                      <td className="px-6 py-4">
                        {p.cycle?.enrollment?.group?.course?.name} ({p.cycle?.enrollment?.group?.name})
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">
                        {p.amount?.toLocaleString('uz-UZ')} so‘m
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(p.paidAt).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Accept Payment Modal */}
      {showModal && selectedCycle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Oldindan to‘lovni qabul qilish</h3>
            <p className="text-xs text-gray-500 mb-4">
              O‘quvchi: <span className="font-semibold text-gray-800">{selectedCycle.enrollment?.student?.name}</span> • Kurs:{' '}
              <span className="font-semibold text-gray-800">{selectedCycle.enrollment?.group?.course?.name}</span>
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  To‘lov summasi (so‘m)
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  To‘lov usuli
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CARD', 'CASH', 'BANK'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        method === m
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {m === 'CARD' ? '💳 Karta' : m === 'CASH' ? '💵 Naqd' : '🏦 Bank'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Izoh / Chek ma'lumoti
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-[11px] text-blue-700">
                To‘lov kiritilishi bilanoq avtomatik tarzda:
                <ul className="list-disc pl-4 mt-1 space-y-0.5">
                  <li>To‘lov sikli <b>PAID</b> holatiga o‘tadi</li>
                  <li>Buxgalteriyaga kirim (INCOME) yoziladi</li>
                  <li>Farzand va ota-onaning Telegramiga kvitansiya jo‘natiladi</li>
                </ul>
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
                  To‘lovni tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">To‘lov qabul qilindi!</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Elektron kvitansiya Telegram orqali farzand va ota-onaga yuborildi.
            </p>

            <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs space-y-2 border border-gray-100 font-mono mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Kvitansiya:</span>
                <span className="font-bold text-gray-900">{receipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Summa:</span>
                <span className="font-bold text-emerald-600">
                  {receipt.amount?.toLocaleString('uz-UZ')} so‘m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Usuli:</span>
                <span className="font-semibold text-gray-900">{receipt.method}</span>
              </div>
            </div>

            <button
              onClick={() => setReceipt(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
