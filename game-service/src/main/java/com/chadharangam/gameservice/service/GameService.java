package com.chadharangam.gameservice.service;

import org.springframework.stereotype.Service;
import com.chadharangam.gameservice.entity.Game;
import com.chadharangam.gameservice.entity.Move;
import com.chadharangam.gameservice.repository.GameRepository;
import com.chadharangam.gameservice.repository.MoveRepository;

import java.util.List;

@Service
public class GameService {

    private final GameRepository gameRepo;
    private final MoveRepository moveRepo;

    public GameService(GameRepository gameRepo, MoveRepository moveRepo) {
        this.gameRepo = gameRepo;
        this.moveRepo = moveRepo;
    }

    public Game createGame(Long whiteId, Long blackId) {

        Game game = new Game();
        game.setWhitePlayerId(whiteId);
        game.setBlackPlayerId(blackId);
        game.setFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        game.setStatus("ONGOING");
        game.setTurn("WHITE");

        return gameRepo.save(game);
    }

    public Game getGame(Long gameId) {
        return gameRepo.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));
    }

    public Game makeMove(Long gameId, Long playerId, String from, String to) {

        Game game = gameRepo.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        if (!"ONGOING".equals(game.getStatus())) {
            throw new RuntimeException("Game is finished");
        }

        // 🔐 TURN VALIDATION
        if ("WHITE".equals(game.getTurn()) && !playerId.equals(game.getWhitePlayerId())) {
            throw new RuntimeException("Not WHITE player's turn");
        }

        if ("BLACK".equals(game.getTurn()) && !playerId.equals(game.getBlackPlayerId())) {
            throw new RuntimeException("Not BLACK player's turn");
        }

        int moveCount = moveRepo.findByGameId(gameId).size() + 1;

        Move move = new Move();
        move.setGameId(gameId);
        move.setFromSquare(from);
        move.setToSquare(to);
        move.setMoveNumber(moveCount);

        moveRepo.save(move);

        // TEMP FEN UPDATE
        game.setFen(game.getFen() + " | " + from + "-" + to);

        // SWITCH TURN
        game.setTurn(game.getTurn().equals("WHITE") ? "BLACK" : "WHITE");

        return gameRepo.save(game);
    }

    public List<Move> getMoveHistory(Long gameId) {
        return moveRepo.findByGameId(gameId);
    }
}
