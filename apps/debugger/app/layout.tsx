export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: 16 }}>
          {children}
        </main>
      </body>
    </html>
  );
}

