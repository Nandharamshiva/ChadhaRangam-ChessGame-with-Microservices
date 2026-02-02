import AppShell from "../components/AppShell";
import Sidebar from "../components/Sidebar";
import { getUser } from "../auth/user";

export default function Profile() {
  const user = getUser();
  const username = user?.sub || "Player";

  return (
    <AppShell sidebar={<Sidebar />}>
      <div className="max-w-3xl">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
          <h2 className="text-2xl font-semibold">Profile</h2>
          <p className="text-slate-400 mt-1">
            Hi <span className="text-slate-200 font-medium">{username}</span> — this page is coming soon.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PlaceholderCard label="Rank" />
            <PlaceholderCard label="Games played" />
            <PlaceholderCard label="Win rate" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function PlaceholderCard({ label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-2 text-slate-300">—</div>
      <div className="mt-1 text-xs text-slate-400">Coming soon</div>
    </div>
  );
}
