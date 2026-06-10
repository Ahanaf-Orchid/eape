import React from 'react';

// Color Palette (matching Buy page)
const colors = {
    bg: '#EBD6C5',
    panel: '#F2DDCB',
    border: '#2A1E16',
    orange: '#F4A23A',
    red: '#8E1C1C',
    lightGrey: '#F3F3F3',
    divider: '#C9C9C9',
    upcomingGrey: '#E7E7E7',
    highlightRed: '#D33A2C',
    white: '#FFFFFF'
};

interface StatsCardProps {
    totalSupply: string | number;
    availableLabel: string;
    availableSubtext?: string; // e.g. "Available for Phase 2"
    priceLabel: string;
    mintedLabel?: string | number; // Optional, for Mint page usage
    statusComponent: React.ReactNode;
    timeLabel: string; // "Ends In" or "Starts In"
    timeLeft: string;
    className?: string;
    style?: React.CSSProperties;
}

const StatsCard: React.FC<StatsCardProps> = ({
    totalSupply,
    availableLabel,
    availableSubtext = 'Available',
    priceLabel,
    mintedLabel,
    statusComponent,
    timeLabel,
    timeLeft,
    className = '',
    style = {}
}) => {
    return (
        <div className={`stats-box ${className}`} style={{
            background: colors.lightGrey,
            border: `2px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
            ...style
        }}>
            <div className="stat-row">
                <span className="stat-label">Total Supply</span>
                <span className="stat-value">{totalSupply}</span>
            </div>

            <div className="stat-row">
                <span className="stat-label">{availableSubtext}</span>
                <span className="stat-value">{availableLabel}</span>
            </div>

            <div className="stat-row">
                <span className="stat-label">Price</span>
                <span className="stat-value">{priceLabel}</span>
            </div>

            {mintedLabel !== undefined && (
                <div className="stat-row">
                    <span className="stat-label">Minted</span>
                    <span className="stat-value">{mintedLabel}</span>
                </div>
            )}

            <div className="stat-row">
                <span className="stat-label">Status</span>
                <div style={{ textAlign: 'right' }}>{statusComponent}</div>
            </div>

            <div className="stat-row" style={{ borderBottom: 'none' }}>
                <span className="stat-label">{timeLabel}</span>
                <span className="stat-value tabular-nums" style={{ color: colors.highlightRed }}>{timeLeft}</span>
            </div>

            <style jsx>{`
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid ${colors.divider};
                    font-size: 15px;
                }
                .stat-label {
                    font-weight: bold;
                    color: ${colors.border};
                }
                .stat-value {
                    font-weight: 500;
                    color: ${colors.border};
                    text-align: right;
                    white-space: pre-line;
                }
                .tabular-nums {
                    font-feature-settings: "tnum";
                    font-variant-numeric: tabular-nums;
                }
            `}</style>
        </div>
    );
};

export default StatsCard;
