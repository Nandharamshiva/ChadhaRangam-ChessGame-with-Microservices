export default function AppShell({ sidebar, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-white">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full md:w-72 md:shrink-0 md:sticky md:top-0 md:h-screen">
          {sidebar}
        </aside>

        <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
