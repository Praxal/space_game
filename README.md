# 3D Space Game

A modern 3D space game built with Three.js and Node.js. Control your spaceship, shoot enemies, and try to survive as long as possible!

## Features

- 3D graphics using Three.js
- Real-time gameplay
- Score tracking
- Health system
- Responsive design
- Modern web-based interface

## Controls

- Arrow Keys: Move the spaceship
- Spacebar: Shoot bullets

## Installation

### Local Development

1. Install Node.js (v14 or higher)
2. Clone this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`

### Using Docker

1. Build the Docker image:
   ```bash
   docker build -t space-game .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 space-game
   ```
3. Open your browser and navigate to `http://localhost:3000`

## Game Rules

- Control your spaceship using the arrow keys
- Shoot enemies using the spacebar
- Each enemy hit gives you 10 points
- Avoid collisions with enemies
- Each collision reduces your health by 20 points
- If an enemy passes you, you lose 10 health points
- Game ends when your health reaches 0

## Technologies Used

- Three.js for 3D graphics
- Node.js for the server
- Express.js for web server
- Socket.IO for real-time communication
- Docker for containerization

## Development

The game is structured as follows:
- `public/` - Static files served by the web server
  - `index.html` - Main game page
  - `js/game.js` - Game logic and Three.js implementation
- `server.js` - Express server setup
- `package.json` - Project dependencies and scripts
- `Dockerfile` - Container configuration 