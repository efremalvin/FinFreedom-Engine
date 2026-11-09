import { AuthProvider } from '@/context/AuthContext';
import { FinFreedomEngine } from '@/components/FinFreedomEngine';
import { Sparkles, ShieldCheck, Calculator, ArrowUpRight } from 'lucide-react';

export default function Home() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-zinc-950 text-zinc-100 antialiased py-2.5 sm:py-8 px-0 sm:px-4">
      {/* Background radial gradient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[30%] right-[10%] w-[450px] h-[450px] bg-teal-500/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-[10%] left-[15%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* Top Header Badge (Desktop/Tablet) */}
        <div className="hidden sm:block max-w-7xl mx-auto px-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">Next.js App Router & TypeScript</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Recharts & Tailwind CSS</span>
          </div>
        </div>

        {/* Master Interactive FinTech Component */}
        <FinFreedomEngine />

        {/* Methodology & Educational Footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-zinc-900 text-xs text-zinc-400 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Metodologi Akumulasi Majemuk</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Menggunakan formula bunga majemuk bulanan anuitas biasa dengan kontribusi rutin akhir bulan (DCA). Menghitung nominal masa depan serta daya beli riil yang telah terdiskon laju inflasi majemuk tahunan.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Aturan SWR 4% vs Adaptasi Indonesia</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Trinity Study (1998) menguji pasar modal Amerika Serikat dengan inflasi rendah 2-3%. Di Indonesia, volatilitas inflasi dan suku bunga pasar berkembang menyarankan rasio penarikan 3.0% - 3.25% (pengali 28.5x–30.8x) untuk mencegah kegagalan portofolio pensiun sebelum 30 tahun.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Disclaimer Keuangan</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Simulasi ini bersifat edukasi finansial matematis interaktif dan tidak merupakan anjuran investasi resmi. Hasil aktual di masa depan dipengaruhi oleh siklus pasar riil (*Sequence of Returns Risk*), pajak, dan biaya transaksi.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-zinc-900/80 gap-3 text-zinc-400 text-[11px]">
            <div>
              © 2026 FinFreedom Engine. Dibangun dengan standar rekayasa FinTech kelas dunia.
            </div>
            <div className="flex items-center gap-4 text-zinc-400">
              <span>TypeScript</span>
              <span>Next.js 15</span>
              <span>Tailwind CSS</span>
              <span>Recharts</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
    </AuthProvider>
  );
}
