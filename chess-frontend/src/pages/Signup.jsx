import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await api.post("/api/users/register", {
        username,
        email,
        password
      });
      alert("Account created successfully! Please login.");
      navigate("/login");
    } catch {
      alert("Signup failed. Try a different username/email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#020617] to-[#0f172a]">
      
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Glass Card */}
      <div className="relative w-full max-w-md p-10 rounded-3xl 
                      bg-white/5 backdrop-blur-xl 
                      border border-white/10 shadow-2xl">

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-2 tracking-wide">
          ♟ Join ChadhaRangam
        </h1>
        <p className="text-center text-slate-400 mb-8">
          Create your account and start the battle.
        </p>

        {/* Username */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-5 py-4 rounded-xl bg-black/30 
                       border border-white/10 outline-none
                       focus:border-green-500 transition"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-5 py-4 rounded-xl bg-black/30 
                       border border-white/10 outline-none
                       focus:border-green-500 transition"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            className="w-full px-5 py-4 rounded-xl bg-black/30 
                       border border-white/10 outline-none
                       focus:border-green-500 transition"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          className="w-full py-4 rounded-xl font-semibold text-lg
                     bg-gradient-to-r from-green-500 to-emerald-600
                     hover:scale-[1.02] active:scale-[0.98]
                     transition-transform shadow-lg">
          Create Account
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-slate-400 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-400 cursor-pointer hover:underline">
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
