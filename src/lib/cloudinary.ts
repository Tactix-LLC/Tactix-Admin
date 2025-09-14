// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  // Cloudinary cloud name from environment or fallback
  CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddkybdc5n',
  
  // Upload preset for advertisements (set this up in your Cloudinary dashboard)
  UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'tactix_ads',
  
  // Folder to organize uploads
  FOLDER: 'tactix/advertisements',
  
  // Upload URL for unsigned uploads (client-side)
  UPLOAD_URL: `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'ddkybdc5n'}/image/upload`,
  
  // Server-side upload endpoint (more secure)
  SERVER_UPLOAD_URL: '/api/upload/cloudinary'
}

// Helper function to upload image to Cloudinary (client-side, unsigned)
export const uploadToCloudinary = async (file: File, folder?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET)
  formData.append('folder', folder || CLOUDINARY_CONFIG.FOLDER)

  const response = await fetch(CLOUDINARY_CONFIG.UPLOAD_URL, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  return response.json()
}

// Helper function to upload via server (more secure, requires backend endpoint)
export const uploadToCloudinaryViaServer = async (file: File, folder?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder || CLOUDINARY_CONFIG.FOLDER)

  const response = await fetch(CLOUDINARY_CONFIG.SERVER_UPLOAD_URL, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  return response.json()
}
