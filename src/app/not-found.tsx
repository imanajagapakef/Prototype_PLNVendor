import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-ink mb-4">Halaman tidak ditemukan</h1>
        <p className="text-muted mb-6">
          Maaf, halaman yang Anda cari tidak dapat ditemukan.
        </p>
        <Link href="/">
          <Button variant="outline" className="text-ink border-line hover:bg-hover">
            Kembali ke Dasbor
          </Button>
        </Link>
      </div>
    </div>
  );
}