"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="bg-gradient" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="content"
            >
                <div className="icon-wrapper">
                    <i className="fas fa-compass-drafting" />
                </div>
                <h1>404</h1>
                <h2>Página no encontrada</h2>
                <p>Lo sentimos, no pudimos encontrar la página que buscas. Puede que haya sido movida o eliminada.</p>

                <Link href="/" className="btn-home">
                    <i className="fas fa-arrow-left" /> Volver al Inicio
                </Link>
            </motion.div>

            <style jsx>{`
        .not-found-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: var(--bg);
          text-align: center;
          padding: 20px;
        }

        .bg-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(3, 74, 166, 0.03) 0%, transparent 60%);
          pointer-events: none;
        }

        .content {
          position: relative;
          z-index: 1;
          max-width: 400px;
        }

        .icon-wrapper {
          width: 80px;
          height: 80px;
          background: var(--bg-soft);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: var(--primary);
          margin: 0 auto 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        h1 {
          font-size: 64px;
          font-weight: 800;
          color: var(--primary);
          line-height: 1;
          margin-bottom: 8px;
          opacity: 0.1;
          letter-spacing: -2px;
        }

        h2 {
          font-size: 24px;
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 12px;
        }

        p {
          font-size: 15px;
          color: var(--text-secondary);
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .btn-home {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--primary);
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(3, 74, 166, 0.2);
        }

        .btn-home:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(3, 74, 166, 0.25);
          background: var(--primary-light);
        }
      `}</style>
        </div>
    );
}
