"use client";

import { PageContent } from './components/PageContent';

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Crops in Rotation</h1>
      <PageContent />
    </div>
  );
}
