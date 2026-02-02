package com.chadharangam.gameservice.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;

import com.chadharangam.gameservice.entity.Game;
import com.chadharangam.gameservice.entity.Move;
import com.chadharangam.gameservice.dto.MoveRequest;
import com.chadharangam.gameservice.service.GameService;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService service;

    public GameController(GameService service) {
        this.service = service;
    }

    @PostMapping("/create")
    public Game createGame(
            @RequestParam Long whitePlayerId,
            @RequestParam Long blackPlayerId) {
        return service.createGame(whitePlayerId, blackPlayerId);
    }

    @PostMapping("/move")
    public Game makeMove(@RequestBody MoveRequest request) {
        return service.makeMove(
                request.gameId,
                request.playerId,
                request.from,
                request.to
        );
    }

    @GetMapping("/{gameId}")
    public Game getGame(@PathVariable Long gameId) {
        return service.getGame(gameId);
    }

    @GetMapping("/{gameId}/moves")
    public List<Move> getMoves(@PathVariable Long gameId) {
        return service.getMoveHistory(gameId);
    }
}
