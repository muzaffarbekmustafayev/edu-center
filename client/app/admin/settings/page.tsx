'use client';

import React, { useState } from 'react';
import { Settings, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [centerName, setCenterName] = useState('Edu Center O‘quv Markazi');
  const [centerPhone, setCenterPhone] = useState('+998712001122');
  const [gracePeriod, setGracePeriod] = useState('7');
  const [absenceLimit, setAbsenceLimit] = useState('5');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Markaz Sozlamalari</h1>
        <p className="text-sm text-gray-500">
          O‘quv markazining umumiy parametrlari, grace period va dars qoldirish cheklovlari
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
            O‘quv Markazi Nomi
          </label>
          <input
            type="text"
            required
            value={centerName}
            onChange={(e) => setCenterName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
            Asosiy Aloqa Telefoni (Xabarnomalarda chiqadi)
          </label>
          <input
            type="text"
            required
            value={centerPhone}
            onChange={(e) => setCenterPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Grace Period (Kun)
            </label>
            <input
              type="number"
              required
              value={gracePeriod}
              onChange={(e) => setGracePeriod(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Standart: 7 kun oldindan to‘lov muddati</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
              Dars qoldirish limiti
            </label>
            <input
              type="number"
              required
              value={absenceLimit}
              onChange={(e) => setAbsenceLimit(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Ketma-ket 5 ta kelmaslikda SUSPENDED bo‘ladi</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
            Kunlik qarzdorlik eslatmasi vaqti
          </label>
          <input
            type="time"
            required
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-gray-400 mt-1">Har kuni Toshkent vaqti bilan 09:00 da yuboriladi</p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Save className="w-4 h-4" /> Sozlamalarni saqlash
          </button>
        </div>
      </form>
    </div>
  );
}
