import { logout } from "../auth/auth";

export default function Navbar() {
  return (
    <div className="flex items-center justify-between px-6 py-4 
                    bg-white/5 backdrop-blur-xl border-b border-white/10">

      <h1 className="text-2xl font-bold tracking-wide">
        ChadhaRangam
      </h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-emerald-500/30 
                          flex items-center justify-center font-bold">
            U
          </div>
          <span className="text-slate-300">You</span>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-red-500/20 
                     hover:bg-red-500/30 text-red-400 transition">
          Logout
        </button>
      </div>
    </div>
  );
}
