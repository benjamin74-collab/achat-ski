export const metadata = {
  title: "Achat-Ski — comparateur de prix ski",
  description: "Comparez les prix du matériel de ski chez les principaux marchands.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
