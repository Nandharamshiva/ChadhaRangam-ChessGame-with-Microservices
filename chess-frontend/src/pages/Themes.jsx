import AppShell from "../components/AppShell";
import Sidebar from "../components/Sidebar";

export default function Themes() {
  return (
    <AppShell sidebar={<Sidebar />}>
      <div className="max-w-3xl">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
          <h2 className="text-2xl font-semibold">Themes</h2>
          <p className="text-slate-400 mt-1">Coming soon: board themes, piece sets, and accent colors.</p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ThemeCard name="Emerald" swatch="bg-emerald-500/20" />
            <ThemeCard name="Indigo" swatch="bg-indigo-500/20" />
            <ThemeCard name="Rose" swatch="bg-rose-500/20" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ThemeCard({ name, swatch }) {
  return (
    <button
      type="button"
      className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 text-left"
    >
      <div className={`h-10 w-full rounded-xl border border-white/10 ${swatch}`} />
      <div className="mt-3 font-semibold">{name}</div>
      <div className="text-xs text-slate-400">Preview</div>
    </button>
  );
}
