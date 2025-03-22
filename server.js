const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add after the express initialization
const scores = [];

// Add leaderboard API endpoints
app.post('/api/scores', (req, res) => {
    const { playerName, score } = req.body;
    
    if (!playerName || score === undefined) {
        return res.status(400).json({ error: 'Player name and score are required' });
    }
    
    const newScore = {
        playerName,
        score,
        timestamp: Date.now()
    };
    
    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score); // Sort by highest score
    
    if (scores.length > 10) {
        scores.length = 10; // Keep only top 10 scores
    }
    
    res.json({ success: true, scores });
});

app.get('/api/scores', (req, res) => {
    res.json(scores);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;

// Start server with error handling
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
}); 