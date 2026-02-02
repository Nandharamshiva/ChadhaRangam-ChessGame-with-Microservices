import { useNavigate } from "react-router-dom";
import { getUser } from "../auth/user";
import AppShell from "../components/AppShell";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const go = (mode) => {
    localStorage.setItem("selectedMode", mode);
    navigate(`/time-control/${mode}`);
  };

  return (
    <AppShell sidebar={<Sidebar />}>
      <div className="min-h-[calc(100vh-8rem)] flex items-center">
        <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
          <h2 className="text-2xl font-semibold">
            Welcome{user?.sub ? `, ${user.sub}` : ""}
          </h2>
          <p className="text-slate-400 mt-1">
            Pick a mode from the left sidebar, or use the quick buttons below.
          </p>

          <div className="mt-8 space-y-3 mx-auto w-full max-w-2xl">
            <ModeButton
              title="♟ 1 vs 1 Online"
              desc="Matchmaking against real players"
              onClick={() => go("online")}
            />
            <ModeButton
              title="🤖 User vs Bot"
              desc="Practice against AI"
              onClick={() => go("bot")}
            />
            <ModeButton
              title="👥 Play with Friend"
              desc="Local 2-player on the same device"
              onClick={() => go("friend")}
            />
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Rank" value="—" hint="Coming soon" />
            <StatCard label="Games played" value="—" hint="Coming soon" />
            <StatCard label="Win rate" value="—" hint="Coming soon" />
          </div>
        </div>
        </div>
      </div>
    </AppShell>
  );
}

function ModeButton({ title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left cursor-pointer p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 active:scale-[0.99] transition shadow-lg"
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-slate-400">{desc}</p>
    </button>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{hint}</div>
    </div>
  );
}
