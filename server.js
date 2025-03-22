const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const https = require('https');

// SSL certificate configuration
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certificates', 'private.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certificates', 'certificate.crt'))
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);
const io = require('socket.io')(server);

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

// HTTP to HTTPS redirect
app.use((req, res, next) => {
    if (!req.secure) {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
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
server.listen(PORT, () => {
    console.log(`Server running on HTTPS port ${PORT}`);
}).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
}); 