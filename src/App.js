import React, { useState, useEffect, useRef } from "react";
import $ from "jquery";
import "jquery-ui-dist/jquery-ui";
import "./styles.css"; // Ensure this file contains the necessary styles

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
  // Add a ref to track the last grid position to determine if it actually moved
  const lastGridPosRef = useRef({ row: 0, col: 0 });

  // Initialize the board when component mounts or board size changes
  useEffect(() => {
    initBoard();
  }, [boardSize]);

  // Check for win conditions after grid position changes
  useEffect(() => {
    // Don't do anything with player switching in this effect
    if (isDraggingEnabled && gameActive) {
      if (checkWin(board)) {
        setGameActive(false);
        setWinner(currentPlayer);
      }
    }
  }, [gridPosition]);

  // Check for a draw condition
  useEffect(() => {
    // Validate board state
    if (!Array.isArray(board) || board.length === 0 || !board.every(row => Array.isArray(row))) {
      return;
    }
    
    const isBoardFull = board.flat().every(cell => cell !== null);
    if (isBoardFull && gameActive && !checkWin(board)) {
      setGameActive(false);
      setWinner("Draw");
    }
  }, [board, gameActive]);

  const initBoard = () => {
    const newBoard = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null));
    setBoard(newBoard);
    setGridPosition({ row: 0, col: 0 });
    lastGridPosRef.current = { row: 0, col: 0 };
    setCurrentPlayer("X");
    setGameActive(true);
    setWinner(null);
    setGameStarted(false);
  };

  const setSafeGridPosition = (newRow, newCol) => {
    const safeRow = Math.max(0, Math.min(newRow, boardSize - gridSize));
    const safeCol = Math.max(0, Math.min(newCol, boardSize - gridSize));
    setGridPosition({ row: safeRow, col: safeCol });
  };

  const renderCell = (row, col) => {
    // Only calculate dynamic sizing if boardRef is available
    let cellStyle = {};
    if (boardRef.current) {
      const boardWidth = boardRef.current.offsetWidth;
      const cellSize = boardWidth / boardSize;
      const fontSize = Math.min(30, cellSize * 0.6);
      cellStyle = {
        fontSize: `${fontSize}px`,
        lineHeight: `${cellSize}px`,
      };
    }

    return (
      <div
        key={`${row}-${col}`}
        className="cell"
        data-row={row}
        data-col={col}
        onClick={() => handleCellClick(row, col)}
        style={cellStyle}
      >
        {board[row] && board[row][col]} {/* Display cell content with null check */}
      </div>
    );
  };

  const handleCellClick = (row, col) => {
    // Don't allow clicks if game is not active or in dragging mode
    if (!gameActive || isDraggingEnabled) return;
    
    // Check if the clicked cell is within the current grid
    if (
      row < gridPosition.row ||
      row >= gridPosition.row + gridSize ||
      col < gridPosition.col ||
      col >= gridPosition.col + gridSize
    ) return;
    
    // Check if the cell is empty
    if (board[row] && board[row][col] === null) {
      // Create a deep copy of the board
      const newBoard = board.map(boardRow => [...boardRow]);
      // Place the current player's mark
      newBoard[row][col] = currentPlayer;
      
      // Update the board state
      setBoard(newBoard);
      
      // Check for win condition
      if (checkWin(newBoard)) {
        setGameActive(false);
        setWinner(currentPlayer);
      } else {
        // Switch player only after a successful move
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
      
      setGameStarted(true);
    }
  };

  const checkWin = (newBoard) => {
    // Ensure gridPosition is within bounds
    if (
      gridPosition.row + gridSize > boardSize ||
      gridPosition.col + gridSize > boardSize
    ) {
      return false; // Invalid grid position, no win possible
    }
  
    const grid = [];
    for (let r = gridPosition.row; r < gridPosition.row + gridSize; r++) {
      // Ensure the row exists before slicing
      if (!newBoard[r]) return false;
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

  const handleToggleMode = () => {
    if (!gameActive) return;

    if (!isDraggingEnabled) {
      // Entering grid movement mode
      setIsDraggingEnabled(true);
      // Save current grid position for comparison later
      lastGridPosRef.current = { ...gridPosition };
      // Initialize draggable in a timeout to ensure the DOM is updated
      setTimeout(() => attachDraggable(), 0);
    } else {
      // Confirming grid position
      setIsDraggingEnabled(false);
      
      // Compare if grid actually moved - if so, then switch players
      const gridMoved = 
        lastGridPosRef.current.row !== gridPosition.row || 
        lastGridPosRef.current.col !== gridPosition.col;
      
      if (gridMoved) {
        // The grid was actually moved, so switch players
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
      // Update last position reference
      lastGridPosRef.current = { ...gridPosition };
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

  const attachDraggable = () => {
    const $overlay = $(".grid-overlay");
    const cellWidth = $(".cell").width();
    const cellHeight = $(".cell").height();

    $overlay.draggable({
      containment: "#game-board",
      grid: [cellWidth, cellHeight], // Dynamic grid snap
      start: function() {
        $overlay.css("pointer-events", "auto");
      },
      stop: function() {
        const newCol = Math.round(parseInt($(this).css("left")) / cellWidth);
        const newRow = Math.round(parseInt($(this).css("top")) / cellHeight);

        // Ensure grid position is within bounds
        const safeCol = Math.max(0, Math.min(newCol, boardSize - gridSize));
        const safeRow = Math.max(0, Math.min(newRow, boardSize - gridSize));

        // Update CSS position
        const cellPercent = 100 / boardSize;
        $(this).css({
          left: safeCol * cellPercent + "%",
          top: safeRow * cellPercent + "%",
        });

        setSafeGridPosition(safeRow, safeCol);
        $("#board-size").attr("disabled", true);
      },
    });
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
          <option value="12">12x12</option>
        </select>
        <button id="toggle-mode" onClick={handleToggleMode}>
          {isDraggingEnabled ? "Confirm Move" : "Move Grid Mode"}
        </button>
        {!gameActive && (
          <button id="reset" onClick={handleReset}>
            Reset Game
          </button>
        )}
      </div>
      <p id="current-player">{gameActive ? `Current Player: ${currentPlayer}` : ""}</p>
      <p id="winner">{winner ? (winner === "Draw" ? "Game Draw!" : `Winner: Player ${winner}`) : ""}</p>
      <div
        className="board"
        id="game-board"
        ref={boardRef}
        style={{
          gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
          gridTemplateRows: `repeat(${boardSize}, 1fr)`,
        }}
      >
        {Array.isArray(board) && board.map((row, rowIndex) =>
          row.map((_, colIndex) => renderCell(rowIndex, colIndex))
        )}
        <div
          className="grid-overlay"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            width: `${((gridSize * 100) / boardSize)-1}%`,
            height: `${((gridSize * 100) / boardSize)-1}%`,
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