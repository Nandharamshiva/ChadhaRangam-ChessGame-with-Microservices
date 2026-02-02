package com.chadharangam.gameservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.chadharangam.gameservice.entity.Game;

public interface GameRepository extends JpaRepository<Game, Long> {
}
