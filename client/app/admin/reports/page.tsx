'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const [financial, setFinancial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialReport();
  }, []);

  const loadFinancialReport = async () => {
    try {
      const res = await apiClient.get('/reports/financial');
      setFinancial(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Moliyaviy Hisobotlar</h1>
        <p className="text-sm text-gray-500">
          Oylik va umumiy daromadlar, xarajatlar va sof foyda tahlili
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Jami Daromad (Kirim)
              </span>
              <h3 className="text-2xl font-extrabold text-emerald-600">
                +{(financial?.totalIncome ?? 0).toLocaleString('uz-UZ')} so‘m
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Jami Xarajat (Chiqim)
              </span>
              <h3 className="text-2xl font-extrabold text-red-600">
                -{(financial?.totalExpense ?? 0).toLocaleString('uz-UZ')} so‘m
              </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Sof Foyda
              </span>
              <h3 className="text-2xl font-extrabold text-blue-600">
                {(financial?.netProfit ?? 0).toLocaleString('uz-UZ')} so‘m
              </h3>
            </div>
          </div>

          {/* Category breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Kirimlar tuzilmasi</h3>
              {financial?.incomeCategories?.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Kirimlar yo‘q</p>
              ) : (
                <div className="space-y-3">
                  {financial?.incomeCategories?.map((item: any) => (
                    <div key={item.category} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize font-medium">{item.category}</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        +{item.amount?.toLocaleString('uz-UZ')} so‘m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Chiqimlar tuzilmasi</h3>
              {financial?.expenseCategories?.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Chiqimlar yo‘q</p>
              ) : (
                <div className="space-y-3">
                  {financial?.expenseCategories?.map((item: any) => (
                    <div key={item.category} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize font-medium">{item.category}</span>
                      <span className="font-bold text-red-600 font-mono">
                        -{item.amount?.toLocaleString('uz-UZ')} so‘m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
