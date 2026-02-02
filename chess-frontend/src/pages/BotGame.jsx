import { useMemo, useRef, useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useNavigate, useParams } from "react-router-dom";

import useChessTimer from "../hooks/useChessTimer";

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

export default function BotGame() {
  const { time } = useParams();
  const navigate = useNavigate();

  const selectedTime = time || localStorage.getItem("selectedTime") || "BLITZ";
  const initialSeconds = useMemo(
    () => timeControlToSeconds(selectedTime),
    [selectedTime]
  );

  const [game, setGame] = useState(new Chess());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);

  const gameRef = useRef(null);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const playerTime = useChessTimer(initialSeconds, isPlayerTurn);
  const botTime = useChessTimer(initialSeconds, !isPlayerTurn);

  const makeBotMove = (currentGame) => {
    const moves = currentGame.moves({ verbose: true });

    if (moves.length === 0) return;

    // prefer captures
    const captures = moves.filter(m => m.captured);
    const move = (captures.length ? captures : moves)
      [Math.floor(Math.random() * (captures.length || moves.length))];

    currentGame.move(move);
    setGame(new Chess(currentGame.fen()));

    clearSelection();

    // Bot moved -> your turn
    setIsPlayerTurn(true);
  };

  const onDrop = (from, to) => {
    if (!isPlayerTurn) return false;

    const newGame = new Chess(game.fen());
    const move = newGame.move({ from, to, promotion: "q" });
    if (!move) return false;

    clearSelection();
    setGame(newGame);

    // You moved -> bot turn
    setIsPlayerTurn(false);

    setTimeout(() => makeBotMove(newGame), 500);
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
    // Click-to-move if already selected
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

    // Player is always white vs bot; only show hints for player's pieces on player's turn.
    if (!isPlayerTurn || piece.color !== "w") {
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

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <div className="mx-auto w-full max-w-[560px] px-6 py-10 flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-[480px] flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition"
          >
            ← Dashboard
          </button>
          <div className="flex gap-6">
            <span className="font-mono">
              You {Math.floor(playerTime / 60)}:{String(playerTime % 60).padStart(2, "0")}
            </span>
            <span className="font-mono">
              Bot {Math.floor(botTime / 60)}:{String(botTime % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          onSquareClick={onSquareClick}
          customSquareStyles={customSquareStyles}
          boardWidth={480}
          isDraggablePiece={({ piece }) => {
            if (!isPlayerTurn) return false;
            return piece?.[0] === "w";
          }}
        />
      </div>
    </div>
  );
}
