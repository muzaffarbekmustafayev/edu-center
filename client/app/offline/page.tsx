'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Internet aloqasi yo‘q</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Siz hozir oflayn rejimdasiz. Oxirgi ko‘rilgan sahifalar va ma'lumotlar qurilma keshidan ko‘rsatilmoqda.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Qaytadan urinish
        </button>
      </div>
    </div>
  );
}
