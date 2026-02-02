import { Chessboard } from "react-chessboard";

export default function ChessBoard() {
  return (
    <div className="relative">

      {/* board glow */}
      <div className="absolute inset-0 bg-emerald-500/20 
                      blur-3xl rounded-2xl"></div>

      <div className="relative z-10 rounded-2xl 
                      bg-black/40 p-4 backdrop-blur-xl 
                      border border-white/10 shadow-2xl">
        <Chessboard boardWidth={420} />
      </div>
    </div>
  );
}
