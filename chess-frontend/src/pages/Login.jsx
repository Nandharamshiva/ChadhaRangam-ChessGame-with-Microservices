import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const gatewayBase = "http://localhost:8080";

  const startOAuth = (provider) => {
    window.location.href = `${gatewayBase}/oauth2/authorization/${provider}`;
  };

  const handleLogin = async () => {
    try {
      const res = await api.post("/api/users/login", { username, password });
      localStorage.setItem("token", res.data);
      navigate("/dashboard");
    } catch {
      alert("Invalid credentials. Please sign up.");
      navigate("/signup");
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]">

      {/* ambient glow */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      {/* glass card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-10">

        <h1 className="text-4xl font-bold text-center tracking-wide mb-2">
          ChadhaRangam
        </h1>
        <p className="text-center text-slate-400 mb-8">
          Enter the arena. Outsmart your opponent.
        </p>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 px-5 py-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-emerald-400 transition"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-5 py-4 rounded-xl bg-black/30 border border-white/10 outline-none focus:border-emerald-400 transition"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg"
        >
          Login
        </button>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs text-slate-400">or</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => startOAuth("google")}
              className="w-full py-3.5 rounded-xl font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => startOAuth("github")}
              className="w-full py-3.5 rounded-xl font-semibold border border-white/10 bg-white/5 hover:bg-white/10 transition"
            >
              Continue with GitHub
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          New player?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-emerald-400 cursor-pointer hover:underline"
          >
            Create an account
          </span>
        </p>
      </div>
    </div>
  );
}
