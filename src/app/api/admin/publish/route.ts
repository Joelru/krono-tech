import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          'Para guardar tus productos permanentemente en la base de datos de tu PC, agrégalos desde http://localhost:3000/krono-hq-9x7k y presiona este botón allí.',
      },
      { status: 400 }
    );
  }

  try {
    const cwd = process.cwd();
    await execAsync('git add data/krono-store.json', { cwd });

    const { stdout: statusOut } = await execAsync('git status --porcelain data/krono-store.json', {
      cwd,
    });

    if (!statusOut.trim()) {
      // Even if already committed, push any pending commits to GitHub/Vercel
      await execAsync('git push origin main', { cwd });
      return NextResponse.json({
        ok: true,
        success: true,
        message: 'La web https://kronotech.vercel.app/ ya está sincronizada con tu PC.',
      });
    }

    await execAsync(
      'git commit -m "chore: actualizar catalogo y configuracion desde PC"',
      { cwd }
    );
    await execAsync('git push origin main', { cwd });

    return NextResponse.json({
      ok: true,
      success: true,
      message:
        '¡Catálogo subido a GitHub y Vercel! En ~45 segundos estará actualizado en https://kronotech.vercel.app/',
    });
  } catch (error) {
    console.error('Error syncing to Vercel:', error);
    return NextResponse.json(
      {
        error:
          'No se pudo sincronizar automáticamente con GitHub. Verifica tu conexión a internet.',
      },
      { status: 500 }
    );
  }
}
