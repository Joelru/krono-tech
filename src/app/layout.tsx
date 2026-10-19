import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'KRONO TECH | Periféricos Gamer de Alto Rendimiento — Pago Contraentrega Colombia',
  description:
    'Tienda oficial de periféricos gamer competitivos en Colombia: Teclados Mecánicos Gasket & Rapid Trigger, Mouses PAW3395 Superlight, Audio IEMs y Streaming. Envío gratis y Pago Contraentrega.',
  icons: {
    icon: '/brand/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} dark`}>
      <body className="bg-[#090D16] text-slate-100 antialiased font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
