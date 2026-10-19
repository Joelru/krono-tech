import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Krono Tech | Acceso Privado',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SecretAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seguridad total: el panel de administración existe ÚNICAMENTE en el PC local del dueño (localhost).
  // En internet (Vercel), devuelve 404 Not Found para que sea 100% inaccesible desde afuera.
  if (process.env.VERCEL) {
    notFound();
  }

  return <>{children}</>;
}
