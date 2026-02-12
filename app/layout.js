import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Legaly - Firma Digital por WhatsApp",
  description: "Envía documentos para firma digital a través de WhatsApp con Legaly. Automatiza tus procesos de firma electrónica.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={plusJakarta.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={plusJakarta.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
