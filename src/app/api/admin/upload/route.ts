import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se seleccionaron archivos para subir.' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Compress and optimize with Sharp into lightweight WebP Data URI
      // Works 100% on Vercel Serverless (read-only filesystem) and locally!
      const optimizedBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const base64DataUrl = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
      uploadedUrls.push(base64DataUrl);
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Error procesando y comprimiendo la imagen.' },
      { status: 500 }
    );
  }
}
