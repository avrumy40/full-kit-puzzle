class PuzzleGame {
// Initialize Socket.IO connection
const socket = io();
    constructor() {
        this.canvas = document.getElementById('puzzleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pieces = [];
        this.totalPieces = 16; // 4x4 puzzle
        this.timeRemaining = 300; // 5 minutes
        this.moves = 0;
        this.batchInterval = 30; // seconds
        this.nextBatchTime = this.batchInterval;
        this.draggedPiece = null;
        this.batches = [0.3, 0.3, 0.4]; // 30%, 30%, 40% of pieces
        this.currentBatch = 0;
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.startGame();
    }

    initializeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.pieceWidth = this.canvas.width / 4;
        this.pieceHeight = this.canvas.height / 4;
        
        // Create puzzle pieces
        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                this.pieces.push({
                    x: this.canvas.width - this.pieceWidth - 10,
                    y: 10,
                    correctX: x * this.pieceWidth,
                    correctY: y * this.pieceHeight,
                    width: this.pieceWidth,
                    height: this.pieceHeight,
                    available: false,
                    placed: false
                });
            }
        }
        
        // Shuffle available pieces
        this.pieces.sort(() => Math.random() - 0.5);
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        
        window.addEventListener('resize', () => this.initializeCanvas());
    }

    startGame() {
        this.releaseBatch();
        this.gameLoop = setInterval(() => this.update(), 1000/60);
        this.timerLoop = setInterval(() => this.updateTimer(), 1000);
    }

    releaseBatch() {
        if (this.currentBatch >= this.batches.length) return;
        
        const piecesToRelease = Math.floor(this.totalPieces * this.batches[this.currentBatch]);
        let released = 0;
        
        for(let piece of this.pieces) {
            if (!piece.available && released < piecesToRelease) {
                piece.available = true;
                released++;
            }
        }
        
        this.currentBatch++;
        audioManager.playBatchArrival();
    }

    updateTimer() {
        this.timeRemaining--;
        this.nextBatchTime--;
        
        if (this.nextBatchTime <= 0) {
            this.releaseBatch();
            this.nextBatchTime = this.batchInterval;
        }
        
        if (this.timeRemaining <= 0) {
            this.gameOver();
        }
        
        // Update UI
        document.getElementById('timer').textContent = 
            `${Math.floor(this.timeRemaining/60)}:${(this.timeRemaining%60).toString().padStart(2, '0')}`;
        document.getElementById('batchProgress').style.width = 
            `${(1 - this.nextBatchTime/this.batchInterval) * 100}%`;
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for(let piece of this.pieces) {
            if (piece.available && !piece.placed &&
                x > piece.x && x < piece.x + piece.width &&
                y > piece.y && y < piece.y + piece.height) {
                this.draggedPiece = piece;
                break;
            }
        }
    }

    handleMouseMove(e) {
        if (!this.draggedPiece) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.draggedPiece.x = e.clientX - rect.left - this.pieceWidth/2;
        this.draggedPiece.y = e.clientY - rect.top - this.pieceHeight/2;
    }

    handleMouseUp() {
        if (!this.draggedPiece) return;
        
        // Check if piece is near its correct position
        if (Math.abs(this.draggedPiece.x - this.draggedPiece.correctX) < 30 &&
            Math.abs(this.draggedPiece.y - this.draggedPiece.correctY) < 30) {
            this.draggedPiece.x = this.draggedPiece.correctX;
            this.draggedPiece.y = this.draggedPiece.correctY;
            this.draggedPiece.placed = true;
            audioManager.playPieceSnap();
            this.moves++;
            document.getElementById('moves').textContent = this.moves;
            
            // Check if puzzle is complete
            if (this.pieces.every(p => p.placed)) {
                this.gameOver(true);
            }
            this.updateProgress();
        }
        
        this.draggedPiece = null;
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw puzzle grid
        this.ctx.strokeStyle = '#666';
        for(let i = 1; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.pieceWidth, 0);
            this.ctx.lineTo(i * this.pieceWidth, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.pieceHeight);
            this.ctx.lineTo(this.canvas.width, i * this.pieceHeight);
            this.ctx.stroke();
        }
        
        // Draw pieces
        for(let piece of this.pieces) {
            if (!piece.available) continue;
            
            this.ctx.fillStyle = piece.placed ? '#4CAF50' : '#2196F3';
            this.ctx.fillRect(piece.x, piece.y, piece.width - 2, piece.height - 2);
        }
    }

    gameOver(completed = false) {
        clearInterval(this.gameLoop);
        clearInterval(this.timerLoop);
        audioManager.playGameOver();
        
        const efficiency = completed ? 
            Math.round((1 - (this.moves / this.totalPieces)) * 100) : 0;
        
        const statsHtml = `
            <p>Time Remaining: ${Math.floor(this.timeRemaining/60)}:${(this.timeRemaining%60).toString().padStart(2, '0')}</p>
            <p>Moves Made: ${this.moves}</p>
            <p>Efficiency Rating: ${efficiency}%</p>
        `;
        
        const messageHtml = completed ?
            `You completed the puzzle! ${this.moves > this.totalPieces * 1.5 ? 
            'Starting before having all pieces led to extra moves and rework.' :
            'Waiting for more pieces before starting helped reduce rework.'}` :
            'Time ran out! Consider waiting for more pieces before starting next time.';
        
        document.getElementById('gameStats').innerHTML = statsHtml;
        document.getElementById('fullKitMessage').textContent = messageHtml;
        
        const modal = new bootstrap.Modal(document.getElementById('gameOverModal'));
        modal.show();
    updateProgress() {
        const placedPieces = this.pieces.filter(p => p.placed).length;
        const progress = (placedPieces / this.totalPieces) * 100;
        const progressBar = document.querySelector('#batchProgress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }
    }
}

// Initialize game when page loads
window.addEventListener('load', async () => {
    await audioManager.initialize();
    new PuzzleGame();
});
