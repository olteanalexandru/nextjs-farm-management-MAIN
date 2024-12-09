'use client';

import { useEffect } from 'react';
import { initDatabase } from '../db-init';

export default function DatabaseInitializer() {
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  return null; // This component doesn't render anything
}
