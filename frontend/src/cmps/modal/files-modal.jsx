import { FiTrash } from 'react-icons/fi'
import { AiOutlineFileText } from 'react-icons/ai'
import { useSelector } from 'react-redux'

export function FilesModal({ dynamicModalObj }) {
    const { task, onUpdate } = dynamicModalObj
    const user = useSelector(storeState => storeState.userModule.user)

    const files = task.files || []

    function onRemoveFile(fileId) {
        const updatedFiles = files.filter(f => f && f.id !== fileId)
        onUpdate('files', updatedFiles)
    }

    if (!files.length) return (
        <div 
            className="files-modal flex align-center justify-center" 
            style={{ padding: '20px', color: '#676879', background: 'var(--bg-primary)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
            No files attached yet
        </div>
    )

    return (
        <section 
            className="files-modal" 
            style={{ padding: '10px', minWidth: '220px', background: 'var(--bg-primary)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px', color: 'var(--text-primary)' }}>Files Attached</h4>
            <ul className="files-list" style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' }}>
                {files.map((file) => {
                    if (!file) return null
                    const isImage = typeof file === 'string' ? file.match(/\.(jpeg|jpg|gif|png)$/) : file.url?.match(/\.(jpeg|jpg|gif|png)$/)
                    const url = typeof file === 'string' ? file : file.url
                    const filename = typeof file === 'string' ? 'File' : (file.filename || 'File')
                    const canDelete = typeof file === 'string' ? true : (user?._id === file.createdBy?._id)

                    return (
                        <li key={file.id || url} className="file-item flex align-center justify-between" style={{ padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <div className="file-info flex align-center" style={{ gap: '8px', flex: 1, overflow: 'hidden' }}>
                                {isImage ? (
                                    <img src={url} alt="preview" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                                ) : (
                                    <AiOutlineFileText style={{ fontSize: '20px', color: 'var(--text-secondary)' }} />
                                )}
                                <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#1f76c2', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {filename}
                                </a>
                            </div>
                            
                            <div 
                                className={`delete-file-btn ${!canDelete ? 'disabled' : ''}`} 
                                onClick={() => canDelete && onRemoveFile(file.id)}
                                style={{ 
                                    cursor: canDelete ? 'pointer' : 'not-allowed', 
                                    color: canDelete ? '#e2445c' : '#c4c4c4',
                                    padding: '4px',
                                    display: 'flex',
                                    opacity: canDelete ? 1 : 0.5
                                }}
                                title={canDelete ? "Delete file" : "Only the uploader can delete this file"}
                            >
                                <FiTrash />
                            </div>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

