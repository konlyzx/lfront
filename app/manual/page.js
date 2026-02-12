"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import styles from "./page.module.css";

const steps = {
  envio1: [
    {
      number: 1,
      title: "Ingresa el número de WhatsApp del destinatario",
      text: "Escribe el número completo incluyendo el código del país (Ej: 573161234567 para Colombia).",
      tip: "Asegúrate de que el número tenga WhatsApp activo.",
      image: "/img/tutorial/paso1.png",
    },
    {
      number: 2,
      title: "Ingresa el nombre del destinatario",
      text: "Escribe el nombre y apellido de la persona que firmará el documento.",
      image: "/img/tutorial/paso2.png",
    },
  ],
  envio2: [
    {
      number: 3,
      title: "Ingresa tu nombre o el de tu empresa",
      text: "Este nombre aparecerá como remitente del documento.",
      image: "/img/tutorial/paso3.png",
    },
    {
      number: 4,
      title: "Sube el documento PDF para firma",
      text: "Arrastra y suelta el archivo PDF o haz clic para seleccionarlo desde tu dispositivo.",
      tip: "Solo se aceptan archivos en formato PDF.",
      image: "/img/tutorial/paso4.png",
    },
  ],
  envio3: [
    {
      number: 5,
      title: "Envía la invitación para firma",
      text: "Haz clic en “Enviar Invitación de Firma”. El destinatario recibirá un mensaje en WhatsApp con un enlace para iniciar el proceso de firma.",
      image: "/img/tutorial/paso5.png",
    },
  ],
  historial: [
    {
      number: 1,
      title: "Accede a la sección de Historial",
      text: "Haz clic en la opción “Historial” en el menú lateral izquierdo.",
      image: "/img/tutorial/historial1.png",
    },
    {
      number: 2,
      title: "Visualiza el estado de tus documentos",
      text: "Verás todos los documentos enviados con su estado actual, fecha de envío y destinatario.",
      image: "/img/tutorial/historial2.png",
    },
  ],
};

const faqs = [
  {
    question: "¿Es legal la firma electrónica a través de WhatsApp?",
    answer:
      "Sí, la firma electrónica a través de WhatsApp cumple con los requisitos legales establecidos en la normativa sobre firmas electrónicas. Legaly asegura la validez legal mediante verificación de identidad y registro de evidencias.",
  },
  {
    question: "¿Qué pasa si el destinatario no tiene WhatsApp?",
    answer:
      "Para utilizar Legaly, el destinatario debe tener una cuenta activa de WhatsApp en el número proporcionado. Si no la tiene, no podrá recibir la invitación para firmar.",
  },
  {
    question: "¿Cuánto tiempo tiene el destinatario para firmar?",
    answer:
      "Por defecto, los documentos enviados para firma tienen un plazo de validez de 7 días. Pasado este tiempo, el enlace expirará y aparecerá como “Expirado” en el historial.",
  },
  {
    question: "¿Cómo puedo saber si mi documento ya fue firmado?",
    answer:
      "Consulta el estado en la sección “Historial”. Cuando un documento sea firmado, su estado cambiará automáticamente a “Firmado”.",
  },
  {
    question: "¿Puedo cancelar un documento enviado?",
    answer:
      "Sí. Antes de que sea firmado, ve a “Historial”, localiza el documento y usa la opción de cancelar. El destinatario ya no podrá acceder al proceso de firma.",
  },
];

const pages = [
  {
    key: "intro",
    title: "Introducción a Legaly",
    number: 1,
    render: () => (
      <>
        <p>
          Bienvenido a Legaly, la plataforma que te permite enviar documentos para firma digital de manera segura y rápida a través de WhatsApp.
          Este manual te guiará paso a paso en el uso de todas las funcionalidades de nuestra plataforma.
        </p>
        <div className={styles.card}>
          <h3><i className="fas fa-info-circle" /> ¿Qué es Legaly?</h3>
          <p>
            Legaly permite a empresas y profesionales enviar documentos para firma electrónica por WhatsApp, simplificando el proceso y asegurando la validez legal de cada firma.
          </p>
        </div>
        <div className={styles.preview}>
          <Image src="/img/tutorial/dashboard-preview.png" alt="Vista previa del dashboard" width={960} height={540} />
          <span className={styles.caption}>Vista general de la plataforma Legaly</span>
        </div>
      </>
    ),
  },
  {
    key: "envio-1",
    title: "Cómo enviar un documento (1/3)",
    number: 2,
    render: () => (
      <>
        <p>Sigue estos pasos para enviar un documento a firmar:</p>
        {steps.envio1.map((step) => (
          <Step key={step.number} {...step} />
        ))}
      </>
    ),
  },
  {
    key: "envio-2",
    title: "Cómo enviar un documento (2/3)",
    number: 3,
    render: () => (
      <>
        {steps.envio2.map((step) => (
          <Step key={step.number} {...step} />
        ))}
      </>
    ),
  },
  {
    key: "envio-3",
    title: "Cómo enviar un documento (3/3)",
    number: 4,
    render: () => (
      <>
        {steps.envio3.map((step) => (
          <Step key={step.number} {...step} />
        ))}
        <div className={`${styles.card} ${styles.successCard}`}>
          <h3><i className="fas fa-check-circle" /> Confirmación de envío</h3>
          <p>Al enviar correctamente verás la tarjeta de confirmación con los datos del destinatario.</p>
        </div>
      </>
    ),
  },
  {
    key: "historial",
    title: "Cómo ver el historial de documentos",
    number: 5,
    render: () => (
      <>
        <p>Consulta y monitorea el estado de todos tus documentos enviados:</p>
        {steps.historial.map((step) => (
          <Step key={step.number} {...step} />
        ))}
      </>
    ),
  },
  {
    key: "estados",
    title: "Estados de los documentos",
    number: 6,
    render: () => (
      <>
        <div className={`${styles.card} ${styles.warningCard}`}>
          <h3><i className="fas fa-exclamation-triangle" /> Estados de documentos</h3>
          <ul className={styles.bulletList}>
            <li><strong>Enviado:</strong> Documento enviado, aún sin firma.</li>
            <li><strong>Firmado:</strong> El destinatario ya firmó.</li>
            <li><strong>Rechazado:</strong> El destinatario rechazó la firma.</li>
            <li><strong>Expirado:</strong> Venció el plazo para firmar.</li>
          </ul>
        </div>
        <h3 className={styles.subtitle}>Plantillas (Próximamente)</h3>
        <p>Las plantillas te permitirán agilizar el envío de documentos recurrentes:</p>
        <div className={`${styles.card} ${styles.infoCard}`}>
          <h3><i className="fas fa-info-circle" /> Próximamente</h3>
          <p>Podrás guardar modelos, establecer campos y enviarlos a múltiples destinatarios.</p>
        </div>
        <ul className={styles.bulletList}>
          <li>Guardar documentos de uso frecuente.</li>
          <li>Configurar campos para personalizar rápido.</li>
          <li>Enviar el mismo documento a múltiples destinatarios.</li>
          <li>Ahorrar tiempo en cada envío.</li>
        </ul>
      </>
    ),
  },
  {
    key: "faq-1",
    title: "Preguntas frecuentes (1/2)",
    number: 7,
    render: () => (
      <FaqList items={faqs.slice(0, 2)} />
    ),
  },
  {
    key: "faq-2",
    title: "Preguntas frecuentes (2/2)",
    number: 8,
    render: () => (
      <FaqList items={faqs.slice(2)} />
    ),
  },
];

function Step({ number, title, text, tip, image }) {
  return (
    <div className={styles.step}>
      <div className={styles.stepNumber}>{number}</div>
      <div className={styles.stepBody}>
        <h3>{title}</h3>
        <p>{text}</p>
        {tip && <div className={styles.tip}><i className="fas fa-lightbulb" /> {tip}</div>}
        {image && (
          <div className={styles.stepImage}>
            <Image src={image} alt={title} width={960} height={540} />
          </div>
        )}
      </div>
    </div>
  );
}

function FaqList({ items }) {
  return (
    <div className={styles.faqList}>
      {items.map((faq) => (
        <details key={faq.question} className={styles.faqItem}>
          <summary>
            <span>{faq.question}</span>
            <i className="fas fa-chevron-down" />
          </summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export default function ManualPage() {
  const [pageIndex, setPageIndex] = useState(0);

  const progress = useMemo(() => ((pageIndex + 1) / pages.length) * 100, [pageIndex]);

  const currentPage = pages[pageIndex];

  return (
    <AppShell title="Manual de Usuario">
      <div className={styles.wrapper}>
        <div className={styles.coverCard}>
          <div className={styles.coverInfo}>
            <div className={styles.coverBadge}><i className="fas fa-book-open" /> Manual</div>
            <h1>Manual de Usuario</h1>
            <p>Guía completa para usar la plataforma Legaly y enviar documentos a firmar por WhatsApp de forma segura.</p>
            <div className={styles.coverCtas}>
              <button className={styles.primaryBtn} onClick={() => { setPageIndex(0); }}>
                <i className="fas fa-play" /> Comenzar a leer
              </button>
              <button className={styles.ghostBtn} onClick={() => setPageIndex((i) => Math.min(i + 1, pages.length - 1))}>
                <i className="fas fa-arrow-down" /> Ir a la siguiente
              </button>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={styles.coverVisual}>
            <div className={styles.logoCircle}>
              <Image src="/img/logo2.png" alt="Legaly Logo" fill sizes="220px" />
            </div>
            <div className={styles.coverStats}>
              <div>
                <strong>+25K</strong>
                <span>Documentos firmados</span>
              </div>
              <div>
                <strong>99.9%</strong>
                <span>Disponibilidad</span>
              </div>
            </div>
            <div className={styles.coverChip}>Guía oficial</div>
          </div>
        </div>

        <div className={styles.bookShell}>
          <div className={styles.bookTop}>
            <div className={styles.pageMeta}>
              <span className={styles.pageBadge}>Capítulo {currentPage.number} / {pages.length}</span>
              <h2>{currentPage.title}</h2>
            </div>
            <div className={styles.navButtons}>
              <button className={styles.navBtn} onClick={() => setPageIndex((i) => Math.max(0, i - 1))} disabled={pageIndex === 0}>
                <i className="fas fa-arrow-left" /> Anterior
              </button>
              <button className={styles.navBtn} onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))} disabled={pageIndex === pages.length - 1}>
                Siguiente <i className="fas fa-arrow-right" />
              </button>
            </div>
          </div>

          <div className={styles.bookBody}>
            <div className={styles.pageCard}>
              {currentPage.render()}
              <div className={styles.pageNumber}>Página {currentPage.number}</div>
            </div>
            <div className={styles.sidePanel}>
              <h4>Contenido</h4>
              <ul>
                {pages.map((p, idx) => (
                  <li key={p.key} className={idx === pageIndex ? styles.activeLink : ""}>
                    <button type="button" onClick={() => { setPageIndex(idx); }}>
                      <span className={styles.dot} />
                      {p.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
