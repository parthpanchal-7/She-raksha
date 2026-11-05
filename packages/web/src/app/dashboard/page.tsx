'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardIndexPage() {
  useEffect(() => {
    window.location.href = '/dashboard/efir-queue';
  }, []);

  return null;
}

