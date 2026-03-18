export const uploadService = {
  uploadFile
}

async function uploadFile(ev) {
  const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "dwemun2dn"
  const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET || "vt0iqgff"
  const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

  const files = ev.target.files
  const uploadPromises = Array.from(files).map(async (file) => {
    const formData = new FormData()
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('file', file)

    try {
      const res = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Cloudinary upload failed:', data.error?.message || 'Unknown error')
        throw new Error(data.error?.message)
      }
      return data
    } catch (err) {
      console.error('Error during upload process:', err)
      throw err
    }
  })

  return Promise.all(uploadPromises)
}
