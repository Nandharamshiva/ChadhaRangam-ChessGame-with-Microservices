import AppShell from "../components/AppShell";
import Sidebar from "../components/Sidebar";

export default function Settings() {
  return (
    <AppShell sidebar={<Sidebar />}>
      <div className="max-w-3xl">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-xl">
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="text-slate-400 mt-1">Coming soon: notifications, sound, accessibility, and preferences.</p>

          <div className="mt-8 space-y-3">
            <SettingRow title="Sound" desc="Move sounds, capture sounds." value="Coming soon" />
            <SettingRow title="Notifications" desc="Match found, friend requests." value="Coming soon" />
            <SettingRow title="Accessibility" desc="High contrast, larger text." value="Coming soon" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SettingRow({ title, desc, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-4">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-slate-400 mt-1">{desc}</div>
      </div>
      <div className="text-xs text-slate-400 whitespace-nowrap">{value}</div>
    </div>
  );
}
