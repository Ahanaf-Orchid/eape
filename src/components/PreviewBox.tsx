import React from 'react';
import Image from 'next/image';

interface PreviewBoxProps {
    imageSrc: string;
    children?: React.ReactNode; // For overlays like navigation buttons
    className?: string;
    style?: React.CSSProperties;
    aspectRatio?: string;
    maxHeight?: string | number;
    borderRadius?: string;
}

const PreviewBox: React.FC<PreviewBoxProps> = ({
    imageSrc,
    children,
    className = '',
    style = {},
    aspectRatio = '1/1',
    maxHeight = '350px', // Default desktop max-height
    borderRadius = '16px'
}) => {
    return (
        <div
            className={`preview-box ${className}`}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: aspectRatio,
                maxHeight: maxHeight,
                borderRadius: borderRadius,
                // overflow: 'hidden', // User requested removal in Mint, let's keep it safe or override
                background: '#E6E6E6', // Default placeholder bg
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...style // Allow style overrides including overflow and padding
            }}
        >
            {/* Inner Container to hold Image and enforce 100% w/h relative to padding */}
            <div className="preview-image-wrapper" style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Image
                    src={imageSrc}
                    alt="Preview"
                    fill
                    style={{ objectFit: 'contain' }}
                    className="preview-img-component"
                    priority
                />
            </div>

            {children}
        </div>
    );
};

export default PreviewBox;
