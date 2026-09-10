'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-xl font-bold text-ink mb-4">Terjadi kesalahan</h1>
        <p className="text-muted mb-6">
          Maaf, terjadi masalah saat memuat halaman. Silakan coba lagi.
        </p>
        <Button 
          variant="outline" 
          className="text-ink border-line hover:bg-hover"
          onClick={() => reset()}
        >
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}