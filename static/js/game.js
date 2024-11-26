class PuzzleGame {
    constructor() {
        this.canvas = document.getElementById('puzzleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pieces = [];
        this.totalPieces = 16; // 4x4 puzzle
        this.timeRemaining = 150; // 2:30 minutes
        this.moves = 0;
        this.batchInterval = 15; // seconds
        this.nextBatchTime = this.batchInterval;
        this.draggedPiece = null;
        this.batches = [0.3, 0.3, 0.4]; // 30%, 30%, 40% of pieces
        this.currentBatch = 0;
        this.selectedFrame = null;
        
        this.setupFrameSelection();
    }

    setupFrameSelection() {
        const buttons = document.querySelectorAll('.frame-select');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                this.selectedFrame = button.dataset.frame;
                this.loadPuzzleImage();
            });
        });
    }

    loadPuzzleImage() {
        this.puzzleImage = new Image();
        this.frameMask = new Image();
        
        Promise.all([
            new Promise(resolve => {
                this.puzzleImage.onload = resolve;
                this.puzzleImage.src = `/static/images/${this.selectedFrame}_puzzle.png`;
            }),
            new Promise(resolve => {
                this.frameMask.onload = resolve;
                this.frameMask.src = `/static/images/${this.selectedFrame}.svg`;
            })
        ]).then(() => {
            this.pieces = [];
            this.initializeCanvas();
            this.setupEventListeners();
            this.startGame();
        });
    }

    initializeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        const frameWidth = this.canvas.width/2;
        const frameHeight = this.canvas.height/2;
        this.pieceWidth = frameWidth / 4;
        this.pieceHeight = frameHeight / 4;
        
        // Create puzzle pieces
        for(let row = 0; row < 4; row++) {
            for(let col = 0; col < 4; col++) {
                // Position pieces in staging area (right side)
                const startX = frameWidth + 20 + (col % 2) * this.pieceWidth;
                const startY = 20 + row * this.pieceHeight;
                
                this.pieces.push({
                    x: startX,  // Initial position in staging area
                    y: startY,
                    correctX: col * this.pieceWidth,  // Target position in frame
                    correctY: row * this.pieceHeight,
                    width: this.pieceWidth,
                    height: this.pieceHeight,
                    available: false,
                    placed: false,
                    row: row,
                    col: col
                });
            }
        }
        
        // Shuffle available pieces
        this.pieces.sort(() => Math.random() - 0.5);
    }

    drawPiece(piece) {
        this.ctx.save();
        
        // Create mask path for the piece
        this.ctx.beginPath();
        
        // Draw the piece content at its current position
        this.ctx.drawImage(
            this.puzzleImage,
            piece.correctX, piece.correctY,  // Source position (from image)
            piece.width, piece.height,       // Source dimensions
            piece.x, piece.y,               // Destination position (current position)
            piece.width, piece.height       // Destination dimensions
        );
        
        // Draw piece border
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(piece.x, piece.y, piece.width, piece.height);
        
        this.ctx.restore();
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
        }
        
        this.draggedPiece = null;
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw puzzle frame area
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width/2, this.canvas.height/2);
        
        if (this.selectedFrame && this.frameMask) {
            // Draw the frame outline
            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(0, 0, this.canvas.width/2, this.canvas.height/2);
        }
        
        // Draw pieces
        for(let piece of this.pieces) {
            if (!piece.available) continue;
            this.drawPiece(piece);
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
    }
}

// Initialize game when page loads
window.addEventListener('load', async () => {
    await audioManager.initialize();
    new PuzzleGame();
});