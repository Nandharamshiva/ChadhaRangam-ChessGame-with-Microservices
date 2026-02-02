import AppShell from "../components/AppShell";
import Sidebar from "../components/Sidebar";

export default function Tutorials() {
  return (
    <AppShell sidebar={<Sidebar />}>
      <div className="min-h-[calc(100vh-8rem)] flex items-center">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
            <h2 className="text-2xl font-semibold">Tutorials</h2>
            <p className="text-slate-400 mt-1">Coming soon: openings, tactics, endgames, and puzzles.</p>

            <div className="mt-8 space-y-3">
              <Item title="Basics" desc="How pieces move, check/checkmate, castling." />
              <Item title="Tactics" desc="Pins, forks, skewers, discovered attacks." />
              <Item title="Endgames" desc="King + pawn basics, opposition, promotion." />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Item({ title, desc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-slate-400 text-sm mt-1">{desc}</div>
    </div>
  );
}
