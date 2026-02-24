const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); 

const app = express();
const server = http.createServer(app);


app.use(cors({
  origin: "*", 
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
})); 

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => {
  res.send("🚀 PAYMENT SERVER IS LIVE");
});


app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, 
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

const roomsState = {}; 
let globalOnlineQueue = null;

io.on("connection", (socket) => {
    console.log(`✅ Player connected: ${socket.id}`);
    
    socket.on("join_private_room", (code) => {
        const roomId = `PRIVATE_${code}`;
        socket.join(roomId);
        
        if (!roomsState[roomId]) {
            roomsState[roomId] = {
                board: Array(9).fill(null),
                xIsNext: true,
                players: {},
                playerCount: 0
            };
        }
        
        roomsState[roomId].players[socket.id] = socket;
        roomsState[roomId].playerCount += 1;
        
        if (roomsState[roomId].playerCount === 2) {
            const playerIds = Object.keys(roomsState[roomId].players);
            io.to(playerIds[0]).emit("match_found_trigger", {
                room: roomId, players: playerIds, assignedSymbol: "X"
            });
            io.to(playerIds[1]).emit("match_found_trigger", {
                room: roomId, players: playerIds, assignedSymbol: "O"
            });
        }
    });

    socket.on("join_human_queue", () => {
        if (globalOnlineQueue && globalOnlineQueue.id !== socket.id) {
            const roomID = `ONLINE_${globalOnlineQueue.id}_${socket.id}`;
            socket.join(roomID);
            globalOnlineQueue.join(roomID);

            roomsState[roomID] = {
                board: Array(9).fill(null),
                xIsNext: true,
                players: { [globalOnlineQueue.id]: globalOnlineQueue, [socket.id]: socket }
            };

            io.to(roomID).emit("match_found_trigger", {
                room: roomID, players: [globalOnlineQueue.id, socket.id]
            });
            globalOnlineQueue = null; 
        } else {
            globalOnlineQueue = socket;
        }
    });
    
    socket.on("send_move", (data) => {
        const roomData = roomsState[data.room];
        if (roomData) {
            roomData.board[data.index] = data.symbol;
            roomData.xIsNext = !roomData.xIsNext;
            io.to(data.room).emit("receive_move", {
                index: data.index, symbol: data.symbol, xIsNext: roomData.xIsNext
            });
        }
    });

    socket.on("disconnect", () => {
        if (globalOnlineQueue && globalOnlineQueue.id === socket.id) globalOnlineQueue = null;
    });
});


server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});