package com.chadharangam.matchmakingservice.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Set;
import java.util.Queue;
import java.util.Objects;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.HashMap;

@Service
public class MatchmakingService {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final long QUEUE_STALE_MS = 15_000;
    private static final long MATCH_STALE_MS = 60_000;

    private static final class WaitingQueue {
        private final Queue<Long> queue = new ConcurrentLinkedQueue<>();
        private final Set<Long> set = ConcurrentHashMap.newKeySet();
        private final Map<Long, Long> lastSeenMs = new ConcurrentHashMap<>();

        void touch(Long playerId) {
            lastSeenMs.put(playerId, System.currentTimeMillis());
        }

        void enqueueOnce(Long playerId) {
            touch(playerId);
            if (set.add(playerId)) queue.add(playerId);
        }

        Long pollDifferent(Long playerId) {
            long now = System.currentTimeMillis();
            while (true) {
                Long candidate = queue.poll();
                if (candidate == null) return null;

                set.remove(candidate);

                Long seen = lastSeenMs.get(candidate);
                if (seen == null || (now - seen) > QUEUE_STALE_MS) {
                    lastSeenMs.remove(candidate);
                    continue;
                }

                // Consume this queue slot.
                lastSeenMs.remove(candidate);
                if (!Objects.equals(candidate, playerId)) {
                    return candidate;
                }
            }
        }
    }

    private static final class MatchResult {
        private final Long gameId;
        private final Long whitePlayerId;
        private final Long blackPlayerId;
        private final Set<Long> pendingAcks = ConcurrentHashMap.newKeySet();
        private final long createdAtMs;

        private MatchResult(Long gameId, Long whitePlayerId, Long blackPlayerId) {
            this.gameId = gameId;
            this.whitePlayerId = whitePlayerId;
            this.blackPlayerId = blackPlayerId;
            this.createdAtMs = System.currentTimeMillis();
            this.pendingAcks.add(whitePlayerId);
            this.pendingAcks.add(blackPlayerId);
        }

        Map<String, Object> toResponseFor(Long playerId) {
            // Mark this player as having received the match.
            pendingAcks.remove(playerId);

            Map<String, Object> m = new HashMap<>();
            m.put("message", "MATCHED");
            m.put("gameId", gameId);
            m.put("whitePlayerId", whitePlayerId);
            m.put("blackPlayerId", blackPlayerId);
            return m;
        }

        boolean fullyAcknowledged() {
            return pendingAcks.isEmpty();
        }

        boolean isExpired() {
            return (System.currentTimeMillis() - createdAtMs) > MATCH_STALE_MS;
        }
    }

    private final Map<String, WaitingQueue> queues = new ConcurrentHashMap<>();
    private final Map<Long, MatchResult> playerToMatch = new ConcurrentHashMap<>();

    public Map<String, Object> findMatch(Long playerId, String mode, String timeControl) {
        if (playerId == null) {
            return Map.of("message", "Missing playerId");
        }

        // If this player was already matched, return the same gameId.
        MatchResult existing = playerToMatch.get(playerId);
        if (existing != null) {
            if (existing.isExpired()) {
                playerToMatch.remove(existing.whitePlayerId);
                playerToMatch.remove(existing.blackPlayerId);
            } else {
            Map<String, Object> res = existing.toResponseFor(playerId);
            if (existing.fullyAcknowledged()) {
                // Clean up mapping for both players.
                playerToMatch.remove(existing.whitePlayerId);
                playerToMatch.remove(existing.blackPlayerId);
            }
            return res;
            }
        }

        String key = normalizeQueueKey(mode, timeControl);
        WaitingQueue waiting = queues.computeIfAbsent(key, k -> new WaitingQueue());

        // Keep this player's queue entry fresh if they are already waiting.
        waiting.touch(playerId);

        // Serialize matching per queue to avoid races creating multiple games.
        synchronized (waiting) {
            // Re-check after acquiring lock.
            MatchResult lockedExisting = playerToMatch.get(playerId);
            if (lockedExisting != null) {
                if (lockedExisting.isExpired()) {
                    playerToMatch.remove(lockedExisting.whitePlayerId);
                    playerToMatch.remove(lockedExisting.blackPlayerId);
                } else {
                Map<String, Object> res = lockedExisting.toResponseFor(playerId);
                if (lockedExisting.fullyAcknowledged()) {
                    playerToMatch.remove(lockedExisting.whitePlayerId);
                    playerToMatch.remove(lockedExisting.blackPlayerId);
                }
                return res;
                }
            }

            Long opponentId;
            while ((opponentId = waiting.pollDifferent(playerId)) != null) {
                // If opponent is already matched (or stale match), skip and keep searching.
                MatchResult opponentExisting = playerToMatch.get(opponentId);
                if (opponentExisting != null) {
                    if (opponentExisting.isExpired()) {
                        playerToMatch.remove(opponentExisting.whitePlayerId);
                        playerToMatch.remove(opponentExisting.blackPlayerId);
                    }
                    continue;
                }

                Long whiteId = opponentId;
                Long blackId = playerId;

                String url =
                        "http://localhost:8082/api/games/create" +
                                "?whitePlayerId=" + whiteId +
                                "&blackPlayerId=" + blackId;

                Map<String, Object> game = restTemplate.postForObject(url, null, Map.class);
                Object rawId = (game != null) ? (game.get("gameId") != null ? game.get("gameId") : game.get("id")) : null;
                Long createdGameId = null;
                if (rawId instanceof Number n) {
                    createdGameId = n.longValue();
                } else if (rawId instanceof String s) {
                    try {
                        createdGameId = Long.parseLong(s);
                    } catch (NumberFormatException ignored) {
                        createdGameId = null;
                    }
                }

                if (createdGameId == null) {
                    // Failed to create game; re-enqueue both so they can retry.
                    waiting.enqueueOnce(opponentId);
                    waiting.enqueueOnce(playerId);
                    return Map.of("message", "Failed to create game");
                }

                MatchResult result = new MatchResult(createdGameId, whiteId, blackId);
                playerToMatch.put(whiteId, result);
                playerToMatch.put(blackId, result);

                return result.toResponseFor(playerId);
            }

            waiting.enqueueOnce(playerId);
            return Map.of(
                    "message", "Waiting for opponent",
                    "queue", key
            );
        }
    }

    private static String normalizeQueueKey(String mode, String timeControl) {
        String m = (mode == null || mode.isBlank()) ? "online" : mode.trim().toLowerCase();
        String t = (timeControl == null || timeControl.isBlank()) ? "default" : timeControl.trim().toUpperCase();
        return m + ":" + t;
    }
}
