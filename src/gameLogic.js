export const DEFAULT_ROWS = 20;
export const DEFAULT_COLS = 20;
export const INITIAL_LENGTH = 3;

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

const OPPOSITES = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT"
};

export function createInitialState({ rows = DEFAULT_ROWS, cols = DEFAULT_COLS, rng = Math.random } = {}) {
  const startX = Math.floor(cols / 2) - 1;
  const startY = Math.floor(rows / 2);
  const snake = [
    { x: startX + 2, y: startY },
    { x: startX + 1, y: startY },
    { x: startX, y: startY }
  ];
  const food = placeFood(snake, rows, cols, rng);

  return {
    rows,
    cols,
    snake,
    direction: "RIGHT",
    food,
    score: 0,
    gameOver: false
  };
}

export function resolveDirection(currentDirection, inputDirection) {
  if (!inputDirection) return currentDirection;
  if (OPPOSITES[currentDirection] === inputDirection) return currentDirection;
  return inputDirection;
}

export function stepState(state, { rows = state.rows, cols = state.cols, rng = Math.random, inputDirection } = {}) {
  if (state.gameOver) return state;

  const direction = resolveDirection(state.direction, inputDirection);
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  const newHead = { x: head.x + vector.x, y: head.y + vector.y };

  if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
    return { ...state, direction, gameOver: true };
  }

  const ateFood = state.food && newHead.x === state.food.x && newHead.y === state.food.y;
  const nextSnake = [newHead, ...state.snake];
  if (!ateFood) {
    nextSnake.pop();
  }

  const collided = nextSnake.slice(1).some((segment) => segment.x === newHead.x && segment.y === newHead.y);
  if (collided) {
    return { ...state, direction, gameOver: true };
  }

  const nextFood = ateFood ? placeFood(nextSnake, rows, cols, rng) : state.food;
  const nextScore = ateFood ? state.score + 1 : state.score;
  const nextGameOver = ateFood && !nextFood;

  return {
    ...state,
    rows,
    cols,
    snake: nextSnake,
    direction,
    food: nextFood,
    score: nextScore,
    gameOver: nextGameOver
  };
}

export function placeFood(snake, rows, cols, rng = Math.random) {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const free = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) free.push({ x, y });
    }
  }

  if (free.length === 0) return null;
  const index = Math.floor(rng() * free.length);
  return free[index];
}
