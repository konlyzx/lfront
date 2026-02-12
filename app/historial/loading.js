"use client";

export default function Loading() {
    return (
        <div className="skeleton-container">
            <div className="shimmer" />

            {/* Header Skeleton */}
            <div className="skeleton-header">
                <div className="block title" />
                <div className="block user" />
            </div>

            {/* Filters Skeleton */}
            <div className="skeleton-filters">
                <div className="block filter" />
                <div className="block filter" />
                <div className="block filter grow" />
                <div className="block btn" />
            </div>

            {/* Table Skeleton */}
            <div className="skeleton-table">
                <div className="table-header" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="table-row">
                        <div className="cell date" />
                        <div className="cell phone" />
                        <div className="cell name" />
                        <div className="cell status" />
                    </div>
                ))}
            </div>

            <style jsx>{`
        .skeleton-container {
          padding: 2px;
          position: relative;
          overflow: hidden;
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
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          transform: skewX(-20deg);
          animation: shimmer 1.5s infinite linear;
          z-index: 10;
          pointer-events: none;
        }

        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }

        .block {
          background: #E2E8F0;
          border-radius: 6px;
        }

        .skeleton-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          height: 60px;
          background: white;
          border-bottom: 1px solid #E2E8F0;
          padding: 0 24px;
        }
        .title { width: 200px; height: 24px; }
        .user { width: 150px; height: 32px; border-radius: 20px; }

        .skeleton-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          background: white;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
        }
        .filter { width: 120px; height: 40px; }
        .filter.grow { flex: 1; }
        .btn { width: 80px; height: 40px; }

        .skeleton-table {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
        }
        .table-header {
          height: 48px;
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
        }
        .table-row {
          display: flex;
          align-items: center;
          padding: 16px;
          gap: 16px;
          border-bottom: 1px solid #E2E8F0;
        }
        .cell { height: 16px; background: #F1F5F9; border-radius: 4px; }
        .date { width: 100px; }
        .phone { width: 120px; }
        .name { flex: 1; }
        .status { width: 80px; height: 24px; border-radius: 12px; }
      `}</style>
        </div>
    );
}
