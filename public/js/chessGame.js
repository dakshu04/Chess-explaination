const socket = io(); // 1. Connects to the Socket.IO server, allowing real-time communication with the backend.
const chess = new Chess(); // 2. Creates a new instance of the Chess object from chess.js, which handles game logic and board state.
const boardElement = document.querySelector(".chessboard"); // 3. Selects the chessboard element from the DOM to manipulate and render the game board.

let draggedPiece = null; // 4. Keeps track of the piece currently being dragged by the user.
let sourceSquare = null; // 5. Stores the coordinates of the square where the piece was initially dragged from.
let playerRole = null; // 6. Stores the role of the current player ('w' for white, 'b' for black).

// Key Concepts:
// 1. Socket.IO: Used for real-time communication between the client and server. The io() function connects to the server.
// 2. Chess.js: A library that handles chess game logic, including move validation and board state management.
// 3. Drag and Drop: JavaScript's drag-and-drop API is used to allow pieces to be moved around the chessboard. The dragstart, dragend, dragover, and drop events manage this functionality.
// 4. Unicode Characters: Unicode characters are used to represent chess pieces on the board. These characters are used to render pieces in the UI.
// 5. Responsive Rendering: The board is re-rendered based on the player's role (white or black) and game state updates. The board is flipped for black players to match their perspective.

// Function to render the chessboard based on the current game state
const renderBoard = () => {
    const board = chess.board(); // 7. Retrieves the current board state from the Chess object.
    boardElement.innerHTML = ""; // 8. Clears the previous board elements to prepare for rendering the updated board.

    // Loop through each row and square of the board to create and style the board elements
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div"); // 9. Creates a new div for each square on the board.
            squareElement.classList.add("square", (rowIndex + squareIndex) % 2 == 0 ? "light" : "dark"); // 10. Adds light or dark class based on the square's position.

            squareElement.dataset.row = rowIndex; // 11. Stores the row index in a data attribute for later use.
            squareElement.dataset.col = squareIndex; // 12. Stores the column index in a data attribute for later use.

            if (square) { // 13. If there is a piece on the square
                const piece = document.createElement("div"); // 14. Creates a new div for the piece.
                piece.classList.add("piece", square.color === "w" ? "white" : "black"); // 15. Adds class based on the piece's color.
                piece.innerText = getPieceUnicode(square); // 16. Sets the piece's unicode character based on its type.
                piece.draggable = playerRole === square.color; // 17. Sets draggable attribute based on whether the player owns the piece.

                // Event listener for when the piece starts being dragged
                piece.addEventListener("dragstart", (e) => {
                    if (piece.draggable) {
                        draggedPiece = piece; // 18. Sets the draggedPiece variable to the piece being dragged.
                        sourceSquare = { row: rowIndex, col: squareIndex }; // 19. Sets the sourceSquare variable to the initial square's coordinates.
                        e.dataTransfer.setData("text/plain", ""); // 20. Sets data for the drag event (required for dragging to work).
                    }
                });

                // Event listener for when the piece is done being dragged
                piece.addEventListener("dragend", (e) => {
                    draggedPiece = null; // 21. Resets the draggedPiece variable when dragging ends.
                    sourceSquare = null; // 22. Resets the sourceSquare variable when dragging ends.
                });

                squareElement.appendChild(piece); // 23. Appends the piece element to the square element.
            }

            // Event listener to allow dragging over squares
            squareElement.addEventListener("dragover", function(e) {
                e.preventDefault(); // 24. Prevents the default behavior to allow dropping.
            });

            // Event listener to handle dropping pieces onto squares
            squareElement.addEventListener("drop", function(e) {
                e.preventDefault(); // 25. Prevents the default behavior of the drop event.
                if (draggedPiece) { // 26. Checks if a piece is being dragged
                    const targetSquare = { // 27. Creates a targetSquare object with the dropped location coordinates.
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare); // 28. Calls handleMove function to process the move.
                }
            });

            boardElement.appendChild(squareElement); // 29. Appends the square element to the board.
        });
    });

    // Flips the board for the black player
    if (playerRole === 'b') {
        boardElement.classList.add("flipped"); // 30. Adds a class to flip the board if the player is black.
    } else {
        boardElement.classList.remove("flipped"); // 31. Removes the flip class if the player is white.
    }
};

// Function to handle making a move
const handleMove = (source, target) => {
    const move = { // 32. Creates a move object with source and target coordinates.
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`, // 33. Converts column and row indices to algebraic notation.
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`, // 34. Converts target column and row indices to algebraic notation.
        promotion: 'q' // 35. Promotes the pawn to a queen (default promotion).
    };

    const result = chess.move(move); // 36. Makes the move using the Chess object.

    if (result) { // 37. If the move is successful
        socket.emit("move", move); // 38. Sends the move to the server via socket.
        renderBoard(); // 39. Re-renders the board to reflect the new state.
    }
};

// Function to get Unicode character for a chess piece
const getPieceUnicode = (piece) => {
    const unicode = { // 40. Defines a mapping of piece types to their Unicode characters.
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♗",
        q: "♕",
        k: "♔",
        P: "♟",
        R: "♜",
        N: "♞",
        B: "♝",
        Q: "♛",
        K: "♚"
    };

    return unicode[piece.type] || ""; // 41. Returns the Unicode character for the piece type or an empty string if not found.
};

// Socket event listeners
socket.on("playerRole", function(role) { // 42. Listens for the player's role from the server.
    playerRole = role; // 43. Sets the player's role.
    renderBoard(); // 44. Re-renders the board based on the new role.
});

socket.on("spectatorRole", function () { // 45. Listens for the spectator role from the server.
    playerRole = null; // 46. Sets playerRole to null for spectators.
    renderBoard(); // 47. Re-renders the board for spectators.
});

socket.on("boardState", function(fen) { // 48. Listens for the board state from the server.
    chess.load(fen); // 49. Loads the board state into the Chess object.
    renderBoard(); // 50. Re-renders the board to reflect the loaded state.
});

socket.on("move", function(move) { // 51. Listens for a move from the server.
    chess.move(move); // 52. Makes the move on the Chess object.
    renderBoard(); // 53. Re-renders the board to reflect the new move.
});

renderBoard(); // 54. Initial rendering of the board when the script first loads.
