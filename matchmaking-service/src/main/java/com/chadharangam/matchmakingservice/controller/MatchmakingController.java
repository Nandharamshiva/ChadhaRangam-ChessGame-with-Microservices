package com.chadharangam.matchmakingservice.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;

import com.chadharangam.matchmakingservice.dto.MatchRequest;
import com.chadharangam.matchmakingservice.service.MatchmakingService;

@RestController
@RequestMapping("/api/matchmaking")
public class MatchmakingController {

    private final MatchmakingService service;

    public MatchmakingController(MatchmakingService service) {
        this.service = service;
    }

    @PostMapping("/find")
    public Map<String, Object> findMatch(@RequestBody MatchRequest request) {
        return service.findMatch(request.playerId, request.mode, request.timeControl);
    }
}
