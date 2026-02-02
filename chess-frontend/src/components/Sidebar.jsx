import { NavLink, useNavigate } from "react-router-dom";
import { getUser } from "../auth/user";
import { logout } from "../auth/auth";

function clsx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SidebarLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
          "border border-white/10 bg-white/5 hover:bg-white/10",
          "focus:outline-none focus:ring-2 focus:ring-emerald-500/35",
          isActive && "bg-emerald-500/15 border-emerald-500/30"
        )
      }
    >
      {children}
    </NavLink>
  );
}

function SidebarButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition border border-white/10 bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
      }
    >
      {children}
    </button>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getUser();

  const username = user?.sub || "Player";
  const picture = user?.picture;
  const initial = (username?.[0] || "P").toUpperCase();

  const startMode = (mode) => {
    localStorage.setItem("selectedMode", mode);
    navigate(`/time-control/${mode}`);
  };

  return (
    <div className="h-full border-b md:border-b-0 md:border-r border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="p-5 h-full flex flex-col">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-emerald-500/20">
            {picture ? (
              <img
                src={picture}
                alt="Profile"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-full w-full grid place-items-center font-bold text-lg">
                {initial}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-xs text-slate-400">Signed in as</div>
            <div className="truncate text-sm font-semibold">{username}</div>
          </div>
        </div>

        <div className="mt-5 h-px w-full bg-white/10" />

        <nav className="mt-5 space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-slate-400 px-1">
            Dashboard
          </div>
          <SidebarLink to="/dashboard">🏠 Home</SidebarLink>
          <SidebarLink to="/profile">👤 Profile</SidebarLink>
          <SidebarLink to="/tutorials">📚 Tutorials</SidebarLink>
          <SidebarLink to="/themes">🎨 Themes</SidebarLink>
          <SidebarLink to="/settings">⚙️ Settings</SidebarLink>
        </nav>

        <div className="flex-1 flex flex-col justify-center space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-slate-400 px-1">
            Play
          </div>
          <SidebarButton onClick={() => startMode("online")}>
            ♟ 1 vs 1
          </SidebarButton>
          <SidebarButton onClick={() => startMode("bot")}>🤖 vs Bot</SidebarButton>
          <SidebarButton onClick={() => startMode("friend")}>
            👥 Play with Friend
          </SidebarButton>
        </div>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-200 focus:outline-none focus:ring-2 focus:ring-red-500/35"
          >
            ⎋ Logout
          </button>
        </div>
      </div>
    </div>
  );
}
