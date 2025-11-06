import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-6 mt-auto">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="text-center sm:text-left">
            <p className="font-medium text-slate-900">Mentoría Estudiantil</p>
            <p>Campus Monterrey | Desarrollado por ME Karen Ariadna Guzmán Vega</p>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="https://tec.mx/es/avisos-de-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 rounded"
            >
              Aviso de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

