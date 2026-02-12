"use client";

export default function Loading() {
  return (
    <div className="skeleton-page">
      <div className="shimmer" />
      <div className="skeleton-grid">
        <div className="skeleton-header" />
        <div className="skeleton-content" />
        <div className="skeleton-content" />
      </div>

      <style jsx>{`
        .skeleton-page {
          width: 100%;
          height: 100%;
          min-height: 400px;
          position: relative;
          overflow: hidden;
          background: var(--bg);
          border-radius: 12px;
          padding: 24px;
        }

        .shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to right,
            transparent 0%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: shimmer 1.5s infinite linear;
          z-index: 1;
        }

        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }

        .skeleton-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .skeleton-header {
          width: 60%;
          height: 32px;
          background: var(--bg-soft);
          border-radius: 8px;
          margin-bottom: 8px;
        }

        .skeleton-content {
          width: 100%;
          height: 80px;
          background: var(--bg-soft);
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
