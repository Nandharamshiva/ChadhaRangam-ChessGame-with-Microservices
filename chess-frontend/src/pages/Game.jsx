import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import api from "../api/axios";
import useChessTimer from "../hooks/useChessTimer";
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

function readNumber(key) {
  const v = localStorage.getItem(key);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function timeControlToSeconds(timeControl) {
  switch ((timeControl || "").toUpperCase()) {
    case "BULLET":
      return 60;
    case "BLITZ":
      return 5 * 60;
    case "RAPID":
      return 10 * 60;
    case "CLASSICAL":
      return 30 * 60;
    default:
      return 5 * 60;
  }
}

export default function Game() {
  const { gameId } = useParams();
  const parsedGameId = useMemo(() => Number(gameId), [gameId]);
  const location = useLocation();

  const myPlayerId = useMemo(() => {
    const user = getUser();
    const fromJwt = stablePlayerIdFromSub(user?.sub);
    const stored = readNumber(`game:${parsedGameId}:me`);
    return stored ?? fromJwt;
  }, [parsedGameId]);

  const whitePlayerId = useMemo(
    () => readNumber(`game:${parsedGameId}:whitePlayerId`),
    [parsedGameId]
  );
  const blackPlayerId = useMemo(
    () => readNumber(`game:${parsedGameId}:blackPlayerId`),
    [parsedGameId]
  );

  const [serverWhitePlayerId, setServerWhitePlayerId] = useState(null);
  const [serverBlackPlayerId, setServerBlackPlayerId] = useState(null);
  const [serverTurn, setServerTurn] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const myColor = useMemo(() => {
    const effectiveWhite = serverWhitePlayerId ?? whitePlayerId;
    const effectiveBlack = serverBlackPlayerId ?? blackPlayerId;

    if (effectiveWhite != null && myPlayerId === effectiveWhite) return "white";
    if (effectiveBlack != null && myPlayerId === effectiveBlack) return "black";
    return "white";
  }, [myPlayerId, whitePlayerId, blackPlayerId, serverWhitePlayerId, serverBlackPlayerId]);

  const selectedTime = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("time") || localStorage.getItem("selectedTime") || "BLITZ";
  }, [location.search]);

  const initialSeconds = useMemo(() => timeControlToSeconds(selectedTime), [selectedTime]);

  const [game, setGame] = useState(() => new Chess());
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const gameRef = useRef(null);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);

  const isMyTurn = useMemo(() => {
    const turn = game.turn();
    const myTurn = myColor === "white" ? "w" : "b";
    return turn === myTurn;
  }, [game, myColor]);

  const clientRef = useRef(null);
  const lastAppliedMoveCountRef = useRef(0);

  const playerTime = useChessTimer(initialSeconds, isMyTurn);
  const opponentTime = useChessTimer(initialSeconds, !isMyTurn);

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  useEffect(() => {
    if (!parsedGameId) return;

    let cancelled = false;

    const loadGameMeta = async () => {
      try {
        const res = await api.get(`/api/games/${parsedGameId}`);
        if (cancelled) return;

        const whiteId = res?.data?.whitePlayerId != null ? Number(res.data.whitePlayerId) : null;
        const blackId = res?.data?.blackPlayerId != null ? Number(res.data.blackPlayerId) : null;
        const turn = res?.data?.turn ?? null;

        setServerWhitePlayerId(Number.isFinite(whiteId) ? whiteId : null);
        setServerBlackPlayerId(Number.isFinite(blackId) ? blackId : null);
        setServerTurn(turn);

        if (Number.isFinite(whiteId)) localStorage.setItem(`game:${parsedGameId}:whitePlayerId`, String(whiteId));
        if (Number.isFinite(blackId)) localStorage.setItem(`game:${parsedGameId}:blackPlayerId`, String(blackId));
      } catch (e) {
        // Ignore; move-history polling can still work.
      }
    };

    loadGameMeta();
    const id = setInterval(loadGameMeta, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [parsedGameId]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8084/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsSocketConnected(true);
        clientRef.current = client;
        client.subscribe("/topic/game", (msg) => {
          let event;
          try {
            event = JSON.parse(msg.body);
          } catch (e) {
            console.warn("Bad WS message", msg.body);
            return;
          }
          if (event?.gameId == null) return;
          if (Number(event.gameId) !== parsedGameId) return;
          if (!event.from || !event.to) return;

          // Ignore our own broadcast to avoid flipping turns incorrectly.
          if (event.playerId != null && Number(event.playerId) === myPlayerId) {
            return;
          }

          clearSelection();

          setGame((prev) => {
            try {
              const next = new Chess(prev.fen());
              const applied = next.move({
                from: event.from,
                to: event.to,
                promotion: "q",
              });
              if (!applied) return prev;
              return next;
            } catch (e) {
              console.error("Failed to apply WS move", e);
              return prev;
            }
          });
        });
      },
      onDisconnect: () => setIsSocketConnected(false),
      onStompError: () => setIsSocketConnected(false),
    });

    client.activate();
    return () => {
      clientRef.current = null;
      client.deactivate();
    };
  }, [parsedGameId, myPlayerId]);

  useEffect(() => {
    if (!parsedGameId) return;

    let cancelled = false;

    const refreshFromHistory = async () => {
      try {
        const res = await api.get(`/api/games/${parsedGameId}/moves`);
        const moves = Array.isArray(res?.data) ? res.data : [];
        moves.sort((a, b) => (a.moveNumber ?? 0) - (b.moveNumber ?? 0));

        if (cancelled) return;
        if (moves.length === lastAppliedMoveCountRef.current) return;

        const reconstructed = new Chess();
        for (const m of moves) {
          if (!m?.fromSquare || !m?.toSquare) continue;
          reconstructed.move({ from: m.fromSquare, to: m.toSquare, promotion: "q" });
        }

        lastAppliedMoveCountRef.current = moves.length;
        clearSelection();
        setGame(reconstructed);
      } catch (e) {
        // Ignore polling errors; socket may still work.
      }
    };

    refreshFromHistory();
    const interval = setInterval(refreshFromHistory, 1200);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [parsedGameId, myColor]);

  const onDrop = (from, to) => {
    setStatusMessage("");
    if (!isMyTurn) return false;

    clearSelection();

    let prevFen;
    let next;
    try {
      const current = gameRef.current ?? game;
      prevFen = current.fen();
      next = new Chess(prevFen);
      const localMove = next.move({ from, to, promotion: "q" });
      if (!localMove) return false;
    } catch (e) {
      console.error("Local move failed", e);
      setStatusMessage("Local move failed");
      return false;
    }

    // react-chessboard expects a synchronous boolean return.
    // Apply optimistically; rollback if server rejects.
    setGame(next);

    (async () => {
      try {
        await api.post("/api/games/move", {
          gameId: parsedGameId,
          playerId: myPlayerId,
          from,
          to,
        });

        // Broadcast move so opponent updates immediately.
        const client = clientRef.current;
        if (client?.connected) {
          client.publish({
            destination: "/app/move",
            body: JSON.stringify({
              gameId: parsedGameId,
              playerId: myPlayerId,
              from,
              to,
              fen: null,
            }),
          });
        }
      } catch (e) {
        // Roll back if backend rejects move.
        try {
          setGame(new Chess(prevFen));
        } catch {
          // If rollback fails (shouldn't), let polling recover.
        }
        const message =
          e?.response?.data?.message ||
          e?.response?.data ||
          e?.message ||
          "Move rejected by server";
        setStatusMessage(String(message));
        console.error("Move submit failed", e);
      }
    })();

    return true;
  };

  const customSquareStyles = useMemo(() => {
    const styles = {};

    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: "rgba(59, 130, 246, 0.35)",
      };
    }

    for (const m of legalMoves) {
      const isCapture = typeof m?.flags === "string" && (m.flags.includes("c") || m.flags.includes("e"));
      styles[m.to] = isCapture
        ? {
            boxShadow: "inset 0 0 0 3px rgba(244, 63, 94, 0.75)",
            backgroundColor: "rgba(244, 63, 94, 0.10)",
          }
        : {
            backgroundImage:
              "radial-gradient(circle, rgba(16, 185, 129, 0.85) 18%, rgba(0, 0, 0, 0) 20%)",
          };
    }

    return styles;
  }, [selectedSquare, legalMoves]);

  const onSquareClick = (square) => {
    setStatusMessage("");

    // Click-to-move if a piece is already selected.
    if (selectedSquare && legalMoves.some((m) => m?.to === square)) {
      const ok = onDrop(selectedSquare, square);
      if (ok) clearSelection();
      return;
    }

    const current = gameRef.current ?? game;
    let piece;
    try {
      piece = current.get(square);
    } catch {
      piece = null;
    }

    if (!piece) {
      clearSelection();
      return;
    }

    // Only allow hinting for your pieces during your turn.
    if (!isKnownPlayer || !isMyTurn) {
      clearSelection();
      return;
    }

    const myPieceColor = myColor === "white" ? "w" : "b";
    if (piece.color !== myPieceColor) {
      clearSelection();
      return;
    }

    let moves;
    try {
      moves = current.moves({ square, verbose: true }) || [];
    } catch {
      moves = [];
    }

    setSelectedSquare(square);
    setLegalMoves(moves);
  };

  const turnLabel = useMemo(() => {
    const t = game.turn() === "w" ? "WHITE" : "BLACK";
    return t;
  }, [game]);

  const youLabel = useMemo(() => (myColor === "white" ? "WHITE" : "BLACK"), [myColor]);

  const isKnownPlayer = useMemo(() => {
    const w = serverWhitePlayerId ?? whitePlayerId;
    const b = serverBlackPlayerId ?? blackPlayerId;
    if (w == null || b == null) return true;
    return myPlayerId === w || myPlayerId === b;
  }, [myPlayerId, serverWhitePlayerId, serverBlackPlayerId, whitePlayerId, blackPlayerId]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="mx-auto w-full max-w-[560px] px-6 py-10 flex flex-col items-center justify-center gap-4">
      <div className="w-full max-w-[480px] flex items-center justify-between text-sm">
        <div>
          Socket: {isSocketConnected ? "connected" : "disconnected"}
        </div>
        <div className="flex gap-6">
          <span className="font-mono">
            You {Math.floor(playerTime / 60)}:{String(playerTime % 60).padStart(2, "0")}
          </span>
          <span className="font-mono">
            Opp {Math.floor(opponentTime / 60)}:{String(opponentTime % 60).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="w-full max-w-[480px] flex items-center justify-between text-xs text-slate-300">
        <div className="flex gap-3">
          <span>
            You: <span className="font-semibold text-slate-100">{youLabel}</span>
          </span>
          <span>
            Turn: <span className="font-semibold text-slate-100">{turnLabel}</span>
          </span>
          <span>
            {isMyTurn ? (
              <span className="font-semibold text-emerald-300">Your move</span>
            ) : (
              <span className="font-semibold text-amber-300">Opponent move</span>
            )}
          </span>
        </div>
        <div className="text-slate-400">Game #{parsedGameId}</div>
      </div>

      {statusMessage ? (
        <div className="w-full max-w-[480px] text-xs text-red-300 bg-red-950/30 border border-red-900/40 rounded-md px-3 py-2">
          {statusMessage}
        </div>
      ) : null}

      {!isKnownPlayer ? (
        <div className="w-full max-w-[480px] text-xs text-amber-200 bg-amber-950/20 border border-amber-900/40 rounded-md px-3 py-2">
          You are not registered as White/Black for this game (spectator mode).
        </div>
      ) : null}

      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        customSquareStyles={customSquareStyles}
        boardOrientation={myColor}
        boardWidth={480}
        isDraggablePiece={({ piece }) => {
          if (!isKnownPlayer) return false;
          if (!isMyTurn) return false;
          const color = piece?.[0];
          if (myColor === "white") return color === "w";
          return color === "b";
        }}
      />
      </div>
    </div>
  );
}
