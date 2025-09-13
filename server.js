const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection ---
// IMPORTANT: Replace the string below with your MongoDB connection string.
const mongoURI = 'YOUR_MONGODB_CONNECTION_STRING_HERE';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(err => console.error('Database connection error:', err));

// --- Database Schema ---
const gameStateSchema = new mongoose.Schema({
    playerName: String,
    playerScore: Number,
    computerScore: Number,
    history: [String]
});

const GameState = mongoose.model('GameState', gameStateSchema);

// --- API Endpoints ---

// GET /api/game_state - Retrieve the game state
app.get('/api/game_state', async (req, res) => {
    try {
        let gameState = await GameState.findOne();
        if (!gameState) {
            // If no game state exists, create a default one
            gameState = new GameState({ 
                playerName: 'Player 1', 
                playerScore: 0, 
                computerScore: 0, 
                history: [] 
            });
            await gameState.save();
        }
        res.json(gameState);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/game_state - Update the game state
app.post('/api/game_state', async (req, res) => {
    try {
        const updatedState = req.body;
        // Use findOneAndUpdate with upsert:true to create the document if it doesn't exist
        const gameState = await GameState.findOneAndUpdate({}, updatedState, { new: true, upsert: true });
        res.json(gameState);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Start the Server ---
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
