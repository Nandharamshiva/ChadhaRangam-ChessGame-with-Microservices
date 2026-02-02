import { useNavigate } from "react-router-dom";

export default function GameMode() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center 
                    bg-gradient-to-br from-[#020617] to-[#0f172a]">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <ModeCard title="♟ 1 vs 1 Online"
          desc="Play against real players"
          onClick={() => navigate("/time-control/online")} />

        <ModeCard title="🤖 Play vs Bot"
          desc="Practice against AI"
          onClick={() => navigate("/time-control/bot")} />

        <ModeCard title="👥 Play with Friend"
          desc="Invite a friend"
          onClick={() => navigate("/time-control/friend")} />
      </div>
    </div>
  );
}

function ModeCard({ title, desc, onClick }) {
  return (
    <div onClick={onClick}
      className="cursor-pointer p-8 rounded-3xl 
                 bg-white/5 backdrop-blur-xl border border-white/10
                 hover:scale-105 transition shadow-xl">

      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-slate-400">{desc}</p>
    </div>
  );
}
