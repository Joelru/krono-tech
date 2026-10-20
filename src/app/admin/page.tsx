import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminAliasPage() {
  if (process.env.VERCEL) {
    notFound();
  }
  redirect('/krono-hq-9x7k');
}
