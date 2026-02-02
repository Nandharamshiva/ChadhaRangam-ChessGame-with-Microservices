import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import Sidebar from "../components/Sidebar";

export default function TimeControl() {
  const { mode } = useParams();
  const navigate = useNavigate();

  const select = (time) => {
    localStorage.setItem("selectedMode", mode);
    localStorage.setItem("selectedTime", time);

    if (mode === "online") {
      navigate(`/matchmaking/${mode}/${time}`);
      return;
    }

    if (mode === "bot") {
      navigate(`/bot/${time}`);
      return;
    }

    if (mode === "friend") {
      navigate(`/local/${time}`);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <AppShell sidebar={<Sidebar />}>
      <div className="min-h-[calc(100vh-8rem)] flex items-center">
        <div className="mx-auto w-full max-w-2xl">
          <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
            <h2 className="text-2xl font-semibold">Choose a time control</h2>
            <p className="text-slate-400 mt-1">
              Mode: <span className="text-slate-200 font-medium">{mode}</span>
            </p>

            <div className="mt-8 space-y-3 mx-auto w-full max-w-xl">
              <TimeButton label="⚡ Bullet (1 min)" onClick={() => select("BULLET")} />
              <TimeButton label="🔥 Blitz (5 min)" onClick={() => select("BLITZ")} />
              <TimeButton label="🧠 Rapid (10 min)" onClick={() => select("RAPID")} />
              <TimeButton label="🏛 Classic (30 min)" onClick={() => select("CLASSICAL")} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TimeButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 rounded-2xl text-lg font-semibold border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
    >
      {label}
    </button>
  );
}
