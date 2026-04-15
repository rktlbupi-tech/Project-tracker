import { httpService } from './http.service'

export const uploadService = {
  uploadFile,
  uploadImg: uploadFile
}

async function uploadFile(ev) {
  const file = ev.target.files[0]
  if (!file) return

  try {
    // 1. Get signed URL from backend
    const { uploadUrl, fileUrl } = await httpService.get('upload/sign', {
      fileName: file.name,
      fileType: file.type
    })

    // 2. Upload file directly to S3
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('S3 Upload Error:', errorText)
        throw new Error('Failed to upload file to S3')
    }

    // Return the data in a structure that matches what the app expects
    // Usually it expects an object with a 'secure_url' or similar
    // Based on ImgUploader, it expects secure_url, height, width
    return {
      secure_url: fileUrl,
      width: 500, // Dummy values for now as S3 doesn't return metadata
      height: 500
    }
    
  } catch (err) {
    console.error('Error in upload process:', err)
    throw err
  }
}

