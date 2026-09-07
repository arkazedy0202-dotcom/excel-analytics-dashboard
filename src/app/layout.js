import "./globals.css";
import "./dashboard.css";
import "./workspace-features.css";

export const metadata = {
  title: "DataFlow Analytics",
  description:
    "Mengubah data Excel mentah menjadi insight yang mudah dipahami.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}