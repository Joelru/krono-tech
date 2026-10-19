import type { Metadata } from 'next';

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
  return <>{children}</>;
}
