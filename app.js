// Import required modules
const express = require("express"); // 1. Import the Express framework for creating the server and handling HTTP requests.
const socket = require("socket.io"); // 2. Import Socket.IO for real-time communication between clients and server.
const http = require("http"); // 3. Import the built-in HTTP module to create an HTTP server.
const { Chess } = require("chess.js"); // 4. Import the Chess class from the chess.js library for chess game logic.
const path = require("path"); // 5. Import the path module to handle file and directory paths.

// Create instances
const app = express(); // 6. Create an Express application instance for handling HTTP requests.
const server = http.createServer(app); // 7. Create an HTTP server using the Express application instance.
const io = socket(server); // 8. Initialize Socket.IO with the HTTP server instance to enable real-time communication.
const chess = new Chess(); // 9. Create a new instance of the Chess class to manage the state and logic of the chess game.
let players = {}; // 10. Initialize an object to keep track of connected players' socket IDs.
let currentPlayer = "w"; // 11. Set the initial player to white ("w"). This indicates whose turn it is.

// Middleware setup
app.set("view engine", "ejs"); // 12. Set the view engine to EJS for rendering dynamic HTML pages.
app.use(express.static(path.join(__dirname, "public"))); // 13. Serve static files from the "public" directory, such as CSS and JavaScript files.

// Route Handling
app.get("/", (req, res) => { // 14. Define a route handler for GET requests to the root URL ("/").
    res.render("index", { title: "Chess Game" }); // 15. Render the "index" EJS template with the title "Chess Game".
});

// Socket.IO Connection Handling
io.on("connection", function(uniqueSocket) { // 16. Handle new Socket.IO connections.
    console.log("connected"); // 17. Log when a new client connects.

    if (!players.white) { // 18. Check if the white player slot is available.
        players.white = uniqueSocket.id; // 19. Assign the white player slot to the new client.
        uniqueSocket.emit("playerRole", "w"); // 20. Emit an event to the client indicating that they are the white player.
    } else if (!players.black) { // 21. Check if the black player slot is available.
        players.black = uniqueSocket.id; // 22. Assign the black player slot to the new client.
        uniqueSocket.emit("playerRole", "b"); // 23. Emit an event to the client indicating that they are the black player.
    } else { // 24. If both player slots are occupied.
        uniqueSocket.emit("spectatorRole"); // 25. Emit an event to the client indicating that they are a spectator.
    }

    uniqueSocket.on("disconnect", function() { // 26. Handle disconnection events.
        if (uniqueSocket.id === players.white) { // 27. Check if the disconnected client was the white player.
            delete players.white; // 28. Remove the white player slot.
        } else if (uniqueSocket.id === players.black) { // 29. Check if the disconnected client was the black player.
            delete players.black; // 30. Remove the black player slot.
        }
    });

    uniqueSocket.on("move", (move) => { // 31. Handle the "move" event when a client sends a move.
        try {
            if (chess.turn() === "w" && uniqueSocket.id !== players.white) return; // 32. Validate that the move is made by the current player (white).
            if (chess.turn() === "b" && uniqueSocket.id !== players.black) return; // 33. Validate that the move is made by the current player (black).

            const result = chess.move(move); // 34. Attempt to make the move in the chess game.
            if (result) { // 35. If the move is valid.
                currentPlayer = chess.turn(); // 36. Update the current player turn.
                io.emit("move", move); // 37. Emit the move to all connected clients.
                io.emit("boardState", chess.fen()); // 38. Emit the updated board state in FEN format to all connected clients.
            } else { // 39. If the move is invalid.
                console.log("Invalid move : ", move); // 40. Log the invalid move.
                uniqueSocket.emit("invalidMove", move); // 41. Notify the client that the move was invalid.
            }
        } catch (err) { // 42. Catch any errors that occur during the move handling.
            console.log(err); // 43. Log the error.
            uniqueSocket.emit("Invalid move : ", move); // 44. Notify the client of the invalid move error.
        }
    });
});

// Start the server
server.listen(3000, function() { // 45. Start the HTTP server and listen on port 3000.
    console.log("listening on port 3000"); // 46. Log a message indicating that the server is running.
});
