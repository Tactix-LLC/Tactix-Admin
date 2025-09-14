import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddkybdc5n',
  api_key: process.env.CLOUDINARY_API_KEY || '316164158773758',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'sOIixRXUPB9BEBV1KnoB4HU1J4Q',
  secure: true
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'tactix/advertisements'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary using server-side credentials (no preset needed)
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
      format: string;
      bytes: number;
    }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          public_id: `tactix_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            })
          } else {
            reject(new Error('No result from Cloudinary'))
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
