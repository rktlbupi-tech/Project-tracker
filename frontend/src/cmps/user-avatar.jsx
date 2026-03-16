import React, { useState } from 'react'

export function UserAvatar({ user, size = 30 }) {
    const [imgError, setImgError] = useState(false)
    
    if (!user) return null

    const { fullname, imgUrl } = user
    const firstLetter = fullname ? fullname.charAt(0).toUpperCase() : '?'
    
    const colors = [
        '#FF5733', '#409eff', '#67c23a', '#e6a23c', '#f56c6c',
        '#909399', '#303133', '#1D1D21', '#6161FF', '#FF158A'
    ]

    const getColor = (name) => {
        if (!name) return colors[0]
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        return colors[Math.abs(hash) % colors.length]
    }

    const avatarStyle = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: getColor(fullname),
        color: 'white',
        fontWeight: 'bold',
        fontSize: `${size / 2}px`,
        flexShrink: 0,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative'
    }

    const imgStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0
    }

    const hasImage = imgUrl && !imgUrl.includes('guest_f8d60j') && !imgError

    return (
        <div style={avatarStyle} title={fullname}>
            {hasImage ? (
                <img 
                    src={imgUrl} 
                    alt={fullname} 
                    style={imgStyle}
                    onError={() => setImgError(true)}
                />
            ) : (
                <span>{firstLetter}</span>
            )}
        </div>
    )
}
