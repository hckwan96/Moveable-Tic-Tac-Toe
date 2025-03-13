import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";
import "jquery-ui-dist/jquery-ui";
import "./styles.css";

const TicTacToe = () => {
  const [boardSize, setBoardSize] = useState(5); // Default board size
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [gridPosition, setGridPosition] = useState({ row: 0, col: 0 });
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const gridSize = 3; // Fixed grid size for winning condition
  const boardRef = useRef(null);

  useEffect(() => {
    initBoard();
  }, [boardSize]);

  useEffect(() => {
    if (isDraggingEnabled) {
      attachDraggable();
    }
  }, [isDraggingEnabled, boardSize]); // Reinitialize draggable when grid size changes

  const initBoard = () => {
    const newBoard = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null));
    setBoard(newBoard);
    setGridPosition({ row: 0, col: 0 });
    setCurrentPlayer("X");
    setGameActive(true);
    setWinner(null);
    setGameStarted(false);
  };

  const renderCell = (row, col) => {
    return (
      <div
        key={`${row}-${col}`}
        className="cell"
        data-row={row}
        data-col={col}
        onClick={() => handleCellClick(row, col)}
      >
        {board[row][col]}
      </div>
    );
  };

  const handleCellClick = (row, col) => {
    if (!gameActive || isDraggingEnabled) return;
    if (
      row < gridPosition.row ||
      row >= gridPosition.row + gridSize ||
      col < gridPosition.col ||
      col >= gridPosition.col + gridSize
    )
      return;

    if (!board[row][col]) {
      const newBoard = [...board];
      newBoard[row][col] = currentPlayer;
      setBoard(newBoard);

      if (checkWin(newBoard)) {
        setGameActive(false);
        setWinner(currentPlayer);
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }

      setGameStarted(true);
    }
  };

  const checkWin = (newBoard) => {
    const grid = [];
    for (let r = gridPosition.row; r < gridPosition.row + gridSize; r++) {
      grid.push(newBoard[r].slice(gridPosition.col, gridPosition.col + gridSize));
    }

    // Check rows
    for (let row of grid) {
      if (row[0] && row[0] === row[1] && row[1] === row[2]) return true;
    }

    // Check columns
    for (let col = 0; col < gridSize; col++) {
      if (grid[0][col] && grid[0][col] === grid[1][col] && grid[1][col] === grid[2][col])
        return true;
    }

    // Check diagonals
    if (grid[0][0] && grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) return true;
    if (grid[0][2] && grid[0][2] === grid[1][1] && grid[1][1] === grid[2][0]) return true;

    return false;
  };

  const attachDraggable = () => {
    const cellWidth = $(boardRef.current).width() / boardSize;
    const cellHeight = $(boardRef.current).height() / boardSize;

    $(".grid-overlay").draggable({
      containment: "#game-board",
      grid: [cellWidth, cellHeight], // Dynamic grid snap
      start: function () {
        $(".grid-overlay").css("pointer-events", "auto");
      },
      stop: function () {
        const cellPercent = 100 / boardSize;
        const newCol = Math.round(parseInt($(this).css("left")) / cellWidth);
        const newRow = Math.round(parseInt($(this).css("top")) / cellHeight);

        setGridPosition({ row: newRow, col: newCol });

        $(this).css({
          left: newCol * cellPercent + "%",
          top: newRow * cellPercent + "%",
        });
      },
    });
  };

  const handleToggleMode = () => {
    if (!gameActive) return;

    if (!isDraggingEnabled) {
      setIsDraggingEnabled(true);
    } else {
      setIsDraggingEnabled(false);
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const handleReset = () => {
    initBoard();
    setIsDraggingEnabled(false);
  };

  const handleBoardSizeChange = (e) => {
    if (gameStarted) {
      alert("Game started, can't change board size.");
    } else {
      setBoardSize(parseInt(e.target.value));
    }
  };

  return (
    <div className="container">
      <h2>Flexible Tic-Tac-Toe</h2>
      <div id="controls">
        <label htmlFor="board-size">Board Size:</label>
        <select id="board-size" value={boardSize} onChange={handleBoardSizeChange}>
          <option value="5">5x5</option>
          <option value="7">7x7</option>
          <option value="9">9x9</option>
        </select>
        <button id="toggle-mode" onClick={handleToggleMode}>
          {isDraggingEnabled ? "Confirm Move" : "Move Grid Mode"}
        </button>
        <button id="reset" onClick={handleReset}>
          Reset Game
        </button>
      </div>
      <p id="current-player">{gameActive ? `Current Player: ${currentPlayer}` : ""}</p>
      <p id="winner">{winner ? `Winner: Player ${winner}` : ""}</p>
      <div className="board" id="game-board" ref={boardRef}>
        {board.map((row, rowIndex) =>
          row.map((_, colIndex) => renderCell(rowIndex, colIndex))
        )}
        <div
          className="grid-overlay"
          style={{
            left: `${(gridPosition.col * 100) / boardSize}%`,
            top: `${(gridPosition.row * 100) / boardSize}%`,
            pointerEvents: isDraggingEnabled ? "auto" : "none",
          }}
        ></div>
      </div>
    </div>
  );
};

export default TicTacToe;