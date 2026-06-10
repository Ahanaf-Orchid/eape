'use client';

import { SITE } from "@/lib/site-config";
import { palette, getNextStatus, STATUS_NAMES, STATUS_LEVELS, computeCountdown } from '@/lib/nft-config';

interface NFTGalleryProps {
  userWallet: string;
  userSolWallet: string;
  userStatus: string;
  userReferrals: number;
  userMxp: number;
  nftImages?: string[];
}

const DUMMY_NFTS = [
  { id: '1', name: `${SITE.shortName} Ape #001`, image: '/shared/thumb-1.svg', traits: { Background: 'Gold', Eyes: 'Laser', Hat: 'Crown' }, phase: 'Phase 1' },
  { id: '2', name: `${SITE.shortName} Ape #042`, image: '/shared/thumb-2.svg', traits: { Background: 'Blue', Eyes: 'Normal', Hat: 'Cap' }, phase: 'Phase 1' },
  { id: '3', name: `${SITE.shortName} Ape #077`, image: '/shared/thumb-3.svg', traits: { Background: 'Red', Eyes: 'Angry', Hat: 'None' }, phase: 'Phase 2' },
  { id: '4', name: `${SITE.shortName} Ape #103`, image: '/shared/thumb-4.svg', traits: { Background: 'Green', Eyes: 'Sleepy', Hat: 'Headband' }, phase: 'Phase 2' },
  { id: '5', name: `${SITE.shortName} Ape #215`, image: '/shared/thumb-5.svg', traits: { Background: 'Purple', Eyes: 'Glowing', Hat: 'Top Hat' }, phase: 'Public' },
];

export default function NFTGallery({ userWallet, userSolWallet, userStatus, userReferrals, userMxp, nftImages }: NFTGalleryProps) {
  const images = nftImages || DUMMY_NFTS.map(n => n.image);
  const nfts = DUMMY_NFTS.map((n, i) => ({ ...n, image: images[i] || n.image }));
  const statusBadge = userStatus === STATUS_NAMES.vip ? 'vip' : userStatus === STATUS_NAMES.shark ? 'shark' : userStatus === STATUS_NAMES.whale ? 'whale' : userStatus === STATUS_NAMES.boss ? 'boss' : 'bot';

  return (
    <div style={{ width: '100%', maxWidth: 520, margin: '0 auto', fontFamily: "'Comic Neue', cursive" }}>
      {/* Back button */}
      <button
        className="btn text-btn"
        onClick={() => window.location.href = '/'}
        style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: palette.muted }}
      >
        ← Back to Home
      </button>

      {/* Status card */}
      <div style={{ background: palette.card, border: `2px solid ${palette.border}`, borderRadius: 22, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: palette.muted, fontSize: 12, fontWeight: 700 }}>Your Status</span>
          <span className={`status-badge ${statusBadge}`} style={{ cursor: 'default' }}>
            {userStatus || STATUS_NAMES.default}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: `1px solid ${palette.border}` }}>
            <div style={{ color: palette.muted, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>Referrals</div>
            <div style={{ color: palette.text, fontSize: 18, fontWeight: 800 }}>{userReferrals}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: `1px solid ${palette.border}` }}>
            <div style={{ color: palette.muted, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>MXP</div>
            <div style={{ color: palette.text, fontSize: 18, fontWeight: 800 }}>{userMxp}</div>
          </div>
        </div>

        {(() => {
          const next = getNextStatus(userReferrals);
          if (next) {
            return (
              <>
                <div style={{ color: palette.text, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  {next.needed} more referrals to reach {next.name}
                </div>
                <div style={{ height: 14, background: '#f0dfd4', borderRadius: 999, overflow: 'hidden', border: `1px solid ${palette.border}` }}>
                  <div style={{ width: `${Math.min((userReferrals / (STATUS_LEVELS.boss || 50)) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #9E1B1E, #F28C28)', transition: 'width 0.35s ease' }} />
                </div>
              </>
            );
          }
          return <div style={{ color: palette.success, fontSize: 13, fontWeight: 700 }}>Maximum status achieved!</div>;
        })()}
      </div>

      {/* Wallet info card */}
      <div style={{ background: palette.card, border: `2px solid ${palette.border}`, borderRadius: 22, padding: 16, marginBottom: 16 }}>
        <div style={{ color: palette.muted, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Connected Wallet</div>
        <div style={{ color: palette.text, fontSize: 13, fontWeight: 700, wordBreak: 'break-all', marginBottom: 4 }}>
          {userWallet ? `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}` : 'Not set'}
        </div>
        {userSolWallet && (
          <div style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>
            Sol: {userSolWallet.slice(0, 6)}...{userSolWallet.slice(-4)}
          </div>
        )}
      </div>

      {/* NFT Stats */}
      <div style={{ background: palette.card, border: `2px solid ${palette.border}`, borderRadius: 22, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `2px solid ${palette.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {[
            ['Total NFTs', String(nfts.length)],
            ['Collection', `${SITE.shortName} Apes`],
            ['Floor Price', '0.06 SOL'],
            ['Volume', '1,250 SOL'],
          ].map(([label, val], idx) => (
            <div key={label} style={{ padding: '14px 12px', background: idx % 2 === 0 ? '#fff' : palette.soft, borderRight: idx % 2 === 0 ? `1px solid ${palette.border}` : 'none', borderTop: idx > 1 ? `1px solid ${palette.border}` : 'none' }}>
              <div style={{ color: palette.muted, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{label}</div>
              <div style={{ color: palette.text, fontSize: 14, fontWeight: 800 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NFT Grid or Empty State */}
      {nfts.length > 0 ? (
        <div style={{ background: palette.card, border: `2px solid ${palette.border}`, borderRadius: 22, padding: 16 }}>
          <div style={{ color: palette.text, fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Your NFTs</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {nfts.map((nft) => (
              <div key={nft.id} style={{ background: '#fff', border: `1px solid ${palette.border}`, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s ease', }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ width: '100%', aspectRatio: '1', background: palette.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={nft.image} alt={nft.name} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ color: palette.text, fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{nft.name}</div>
                  <div style={{ color: palette.muted, fontSize: 11, fontWeight: 600 }}>{nft.phase}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: palette.card, border: `2px solid ${palette.border}`, borderRadius: 22, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
          <div style={{ color: palette.text, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No NFTs Yet</div>
          <div style={{ color: palette.muted, fontSize: 14, marginBottom: 16 }}>Minting is coming soon. Stay tuned!</div>
          <div style={{ color: palette.text, fontSize: 12, fontWeight: 600, background: palette.soft, padding: '8px 16px', borderRadius: 999, display: 'inline-block' }}>
            Wallet: {userWallet ? `${userWallet.slice(0, 6)}...${userWallet.slice(-4)}` : 'Not connected'}
          </div>
        </div>
      )}
    </div>
  );
}
