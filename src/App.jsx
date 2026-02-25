import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createInitialState, stepState, resolveDirection } from "./gameLogic.js";

const TICK_MS = 140;

const KEY_TO_DIRECTION = {
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  w: "UP",
  s: "DOWN",
  a: "LEFT",
  d: "RIGHT",
  W: "UP",
  S: "DOWN",
  A: "LEFT",
  D: "RIGHT"
};

export default function App() {
  const [game, setGame] = useState(() => createInitialState());
  const [paused, setPaused] = useState(false);
  const queuedDirection = useRef(null);
  const containerRef = useRef(null);

  const snakeSet = useMemo(() => {
    return new Set(game.snake.map((segment) => `${segment.x},${segment.y}`));
  }, [game.snake]);

  const handleRestart = useCallback(() => {
    setGame(createInitialState());
    setPaused(false);
    queuedDirection.current = null;
  }, []);

  const handleKey = useCallback(
    (event) => {
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault();
        queuedDirection.current = resolveDirection(game.direction, direction);
      }

      if (event.code === "Space") {
        event.preventDefault();
        setPaused((value) => !value);
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        handleRestart();
      }
    },
    [game.direction, handleRestart]
  );

  useEffect(() => {
    const target = containerRef.current || window;
    if (target === window) {
      window.addEventListener("keydown", handleKey, { passive: false });
      return () => window.removeEventListener("keydown", handleKey);
    }
    target.addEventListener("keydown", handleKey);
    return () => target.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (paused || game.gameOver) return;
    const id = setInterval(() => {
      setGame((prev) => {
        const next = stepState(prev, { inputDirection: queuedDirection.current });
        queuedDirection.current = null;
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, game.gameOver]);

  const handleDirectionClick = (direction) => {
    queuedDirection.current = resolveDirection(game.direction, direction);
  };

  const statusLabel = game.gameOver
    ? "Game Over"
    : paused
      ? "Paused"
      : "";

  return (
    <div
      className="app"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKey}
      onClick={() => containerRef.current?.focus()}
    >
      <header className="hud">
        <div className="hud-title">Classic Snake</div>
        <div className="hud-score">Score: {game.score}</div>
        <div className="hud-controls">
          <button type="button" onClick={() => setPaused((value) => !value)}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={handleRestart}>Restart</button>
        </div>
      </header>

      <div className="board" style={{ gridTemplateColumns: `repeat(${game.cols}, 1fr)` }}>
        {Array.from({ length: game.rows * game.cols }).map((_, index) => {
          const x = index % game.cols;
          const y = Math.floor(index / game.cols);
          const key = `${x},${y}`;
          const isSnake = snakeSet.has(key);
          const isFood = game.food && game.food.x === x && game.food.y === y;
          return (
            <div
              key={key}
              className={
                isSnake
                  ? "cell snake"
                  : isFood
                    ? "cell food"
                    : "cell"
              }
            />
          );
        })}
      </div>

      {statusLabel && (
        <div className="status">
          <div className="status-card">{statusLabel}</div>
        </div>
      )}

      <section className="controls">
        <div className="controls-row">
          <button type="button" onClick={() => handleDirectionClick("UP")}>Up</button>
        </div>
        <div className="controls-row">
          <button type="button" onClick={() => handleDirectionClick("LEFT")}>Left</button>
          <button type="button" onClick={() => handleDirectionClick("DOWN")}>Down</button>
          <button type="button" onClick={() => handleDirectionClick("RIGHT")}>Right</button>
        </div>
        <div className="controls-hint">Arrow keys / WASD. Space = pause. R = restart.</div>
      </section>
    </div>
  );
}
