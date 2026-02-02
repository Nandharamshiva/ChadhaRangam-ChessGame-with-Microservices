import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getUser } from "../auth/user";

function stablePlayerIdFromSub(sub) {
  const s = String(sub || "player");
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export default function Matchmaking() {
  const { mode, time } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let timer;

    const findMatch = async () => {
      try {
        localStorage.setItem("selectedMode", mode);
        localStorage.setItem("selectedTime", time);

        const user = getUser();
        const playerId = stablePlayerIdFromSub(user?.sub);

        const res = await api.post("/api/matchmaking/find", {
          playerId,
          mode,
          timeControl: time,
        });

        const gameId = res?.data?.gameId ?? res?.data?.id;
        if (gameId) {
          // Persist ids so Game screen can figure out side/turn.
          localStorage.setItem(`game:${gameId}:me`, String(playerId));
          if (res?.data?.whitePlayerId != null) {
            localStorage.setItem(
              `game:${gameId}:whitePlayerId`,
              String(res.data.whitePlayerId)
            );
          }
          if (res?.data?.blackPlayerId != null) {
            localStorage.setItem(
              `game:${gameId}:blackPlayerId`,
              String(res.data.blackPlayerId)
            );
          }

          if (!cancelled) {
            navigate(`/game/${gameId}?time=${encodeURIComponent(time)}`);
          }
          return;
        }

        if (!cancelled) {
          timer = setTimeout(findMatch, 1200);
        }
      } catch (e) {
        console.error("Matchmaking failed", e);
        if (!cancelled) {
          timer = setTimeout(findMatch, 2000);
        }
      }
    };

    findMatch();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [mode, time, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center 
                    bg-gradient-to-br from-[#020617] to-[#0f172a]">
      <h1 className="text-3xl animate-pulse">
        🔍 Finding opponent...
      </h1>
    </div>
  );
}
