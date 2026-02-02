import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const query = useQuery();

  useEffect(() => {
    const token = query.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard", { replace: true });
      return;
    }

    // If we got here without a token, go back to login.
    navigate("/login?oauth2Error=1", { replace: true });
  }, [navigate, query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a] text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
        <div className="text-xl font-semibold">Signing you in…</div>
        <div className="text-slate-400 mt-2">Please wait a moment.</div>
      </div>
    </div>
  );
}
