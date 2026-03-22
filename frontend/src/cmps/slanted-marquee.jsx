import React from 'react'

export function SlantedMarquee({ items, direction = 'left', color = 'blue' }) {
    return (
        <div className={`marquee-container ${direction} ${color}`}>
            <div className="marquee-content">
                {items.concat(items).map((item, id) => (
                    <span key={id} className="marquee-item">
                        {item} <span className="separator">✖</span>
                    </span>
                ))}
            </div>
        </div>
    )
}
