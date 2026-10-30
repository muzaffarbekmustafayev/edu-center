'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { DollarSign, CreditCard, Users, ArrowDownLeft } from 'lucide-react';

export default function TeacherRevenuePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    try {
      const res = await apiClient.get('/reports/teacher-revenue');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mening Tushumim</h1>
        <p className="text-sm text-gray-500">
          Sizning guruhlaringiz bo‘yicha amalga oshirilgan oldindan to‘lovlar tushumi
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Joriy Oygi Jami Tushum
                </span>
                <h3 className="text-2xl font-black text-indigo-600">
                  {(data?.totalRevenue ?? 0).toLocaleString('uz-UZ')} so‘m
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                  Qabul Qilingan To‘lovlar Soni
                </span>
                <h3 className="text-2xl font-black text-gray-900">
                  {data?.paymentCount ?? 0} ta
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Payments list */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Guruhlar Bo‘yicha To‘lovlar Jurnali
              </h2>
            </div>

            {!data?.payments || data.payments.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">
                Joriy oyda to‘lovlar qayd etilmagan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">O‘quvchi</th>
                      <th className="px-6 py-3.5">Guruh / Kurs</th>
                      <th className="px-6 py-3.5">Summa</th>
                      <th className="px-6 py-3.5">To‘lov Sanasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.payments.map((p: any) => (
                      <tr key={p.paymentId} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900">{p.studentName}</td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-800 block">{p.groupName}</span>
                          <span className="text-xs text-gray-400">{p.courseName}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600 font-mono">
                          +{p.amount?.toLocaleString('uz-UZ')} so‘m
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {new Date(p.paidAt).toLocaleDateString('uz-UZ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
