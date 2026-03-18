import { useState, useRef } from 'react'
import { AiOutlineFileAdd, AiOutlineFileText } from 'react-icons/ai'
import { useSelector } from 'react-redux'
import { uploadService } from '../../services/upload.service'
import { utilService } from '../../services/util.service'
import { setDynamicModalObj } from '../../store/board.actions'

export function FilePicker({ info, onUpdate }) {
    const [isUploading, setIsUploading] = useState(false)
    const files = info.files || []
    const user = useSelector(storeState => storeState.userModule.user)
    const elContainer = useRef()

    async function onUpload(ev) {
        setIsUploading(true)
        try {
            const uploadedFiles = await uploadService.uploadFile(ev)
            const newFiles = uploadedFiles.map(f => ({
                id: utilService.makeId(),
                url: f.secure_url,
                filename: f.original_filename || (f.resource_type === 'image' ? 'Image' : 'File'),
                createdBy: { _id: user?._id || 'Guest', fullname: user?.fullname || 'Guest' },
                createdAt: Date.now()
            }))
            const allFiles = [...files, ...newFiles]
            onUpdate('files', allFiles)
        } catch (err) {
            console.log('Failed upload', err)
        } finally {
            setIsUploading(false)
        }
    }

    function onOpenFilesModal(ev) {
        ev.stopPropagation()
        const { x, y, height } = elContainer.current.getClientRects()[0]
        setDynamicModalObj({
            isOpen: true,
            pos: { x: x - 20, y: y + height + 5 },
            type: 'files-modal',
            task: info,
            onUpdate
        })
    }

    return (
        <section ref={elContainer} className="file-picker picker flex align-center" style={{ minWidth: '40px', padding: '0 8px', gap: '8px' }}>
            {isUploading ? (
                <div className="uploading-spinner" style={{ fontSize: '12px' }}>...</div>
            ) : (
                <>
                    {/* File Previews & Manage Menu */}
                    {files.length > 0 && (
                        <div className="file-preview-stacked flex align-center" 
                             style={{ gap: '2px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', background: '#f5f5f5', border: '1px solid #ddd' }} 
                             onClick={onOpenFilesModal}
                             title="Manage Attached Files"
                        >
                            <div className="icons flex align-center" style={{ gap: '2px' }}>
                                {files.slice(0, 2).map((file, idx) => {
                                    if (!file) return null
                                    const url = typeof file === 'string' ? file : file.url
                                    const isImage = url && url.match(/\.(jpeg|jpg|gif|png)$/) != null
                                    return (
                                        <div key={idx} style={{ display: 'flex' }}>
                                            {isImage ? (
                                                <img src={url} alt="file" style={{ width: '18px', height: '18px', borderRadius: '2px', objectFit: 'cover' }} />
                                            ) : (
                                                <AiOutlineFileText style={{ fontSize: '18px', color: '#676879' }} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {files.length > 2 && <span style={{ fontSize: '11px', color: '#676879', fontWeight: 'bold' }}>+{files.length - 2}</span>}
                            <div style={{ marginLeft: '4px', fontSize: '14px', color: '#676879', borderLeft: '1px solid #ddd', paddingLeft: '4px' }}>...</div>
                        </div>
                    )}

                    {/* Add Button (Inside label to trigger input) */}
                    <label htmlFor={'file-upload' + info.id} style={{ cursor: 'pointer', display: 'flex', color: '#676879' }} title="Add files">
                        <AiOutlineFileAdd className="icon" style={{ fontSize: '18px' }} />
                    </label>
                </>
            )}

            <input 
                type="file" 
                multiple 
                onChange={onUpload} 
                id={'file-upload' + info.id} 
                style={{ display: 'none' }} 
            />
        </section>
    )
}