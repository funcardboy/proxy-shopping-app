import { NextResponse } from 'next/server';
import { getGoogleDriveClient, getDriveFolderId } from '@/lib/google-drive/client';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const drive = await getGoogleDriveClient();
    const folderId = getDriveFolderId();

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: `${Date.now()}-${file.name}`,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    // Make file readable to anyone with the link
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return NextResponse.json({
      fileId: response.data.id,
      url: response.data.webViewLink,
      downloadUrl: response.data.webContentLink,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
