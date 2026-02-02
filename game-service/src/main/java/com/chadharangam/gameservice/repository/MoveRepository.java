package com.chadharangam.gameservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.chadharangam.gameservice.entity.Move;
import java.util.List;

public interface MoveRepository extends JpaRepository<Move, Long> {
    List<Move> findByGameId(Long gameId);
}
