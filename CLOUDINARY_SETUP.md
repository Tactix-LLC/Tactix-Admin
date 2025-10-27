# Cloudinary Setup for Advertisement Images

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Cloudinary Configuration (Client-side)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=ddkybdc5n
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tactix_ads

# Cloudinary Configuration (Server-side - more secure)
CLOUDINARY_CLOUD_NAME=ddkybdc5n
CLOUDINARY_API_KEY=316164158773758
CLOUDINARY_API_SECRET=sOIixRXUPB9BEBV1KnoB4HU1J4Q

# API Configuration
NEXT_PUBLIC_API_URL=https://ff-api-eahf.onrender.com
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Cloudinary Dashboard Setup

1. **Create a Cloudinary Account** at https://cloudinary.com
2. **Get your Cloud Name** from the dashboard
3. **Create an Upload Preset**:
   - Go to Settings > Upload
   - Click "Add upload preset"
   - Name: `tactix_ads`
   - Signing Mode: `Unsigned` (for client-side uploads)
   - Folder: `tactix/advertisements`
   - Allowed file types: `Image`
   - Max file size: `10MB`

## Features

- ✅ **Drag & Drop Upload**: Easy image selection
- ✅ **Image Preview**: See uploaded image before saving
- ✅ **File Validation**: Type and size validation
- ✅ **Progress Indicator**: Upload status feedback
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Remove Image**: Option to remove and re-upload

## Usage

1. Click "Choose Image" in the advertisement form
2. Select an image file (JPG, PNG, GIF up to 10MB)
3. Image uploads automatically to Cloudinary
4. Preview shows the uploaded image
5. URL and Public ID are automatically populated
6. Click "Create" to save the advertisement

## Security

- Uses unsigned upload presets for client-side uploads
- File type and size validation
- Organized folder structure in Cloudinary
