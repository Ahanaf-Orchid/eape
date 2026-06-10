import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
    children,
    className = '',
    maxWidth = '1200px'
}) => {
    return (
        <div
            className={`page-container ${className}`}
            style={{
                maxWidth,
                width: '100%',
                margin: '0 auto',
                padding: '0 clamp(16px, 4vw, 24px)', // Responsive padding: 16px to 24px
                boxSizing: 'border-box'
            }}
        >
            {children}
        </div>
    );
};

export default PageContainer;
