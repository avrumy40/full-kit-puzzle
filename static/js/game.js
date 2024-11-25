class PuzzleGame {
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
        this.knobSize = 20; // Size of the jigsaw knobs
        
        this.initializeCanvas();
        this.setupEventListeners();
        this.startGame();
    }

    // Helper method to determine if an edge should have a knob or indent
    getEdgeType(row, col, edge) {
        const pattern = {
            top: row % 2 === 0,
            right: col % 2 === 0,
            bottom: row % 2 === 1,
            left: col % 2 === 1
        };
        return pattern[edge];
    }

    // Draw a single edge with optional knob/indent
    drawPieceEdge(x, y, width, height, hasKnob) {
        const kSize = this.knobSize;
        
        if (width !== 0) { // Horizontal edge
            const midPoint = x + width / 2;
            const ctrl1 = midPoint - kSize;
            const ctrl2 = midPoint + kSize;
            
            if (hasKnob) {
                this.ctx.quadraticCurveTo(ctrl1, y, midPoint, y + (height > 0 ? -kSize : kSize));
                this.ctx.quadraticCurveTo(ctrl2, y, x + width, y);
            } else {
                this.ctx.quadraticCurveTo(ctrl1, y, midPoint, y + (height > 0 ? kSize : -kSize));
                this.ctx.quadraticCurveTo(ctrl2, y, x + width, y);
            }
        } else { // Vertical edge
            const midPoint = y + height / 2;
            const ctrl1 = midPoint - kSize;
            const ctrl2 = midPoint + kSize;
            
            if (hasKnob) {
                this.ctx.quadraticCurveTo(x, ctrl1, x + (width > 0 ? -kSize : kSize), midPoint);
                this.ctx.quadraticCurveTo(x, ctrl2, x, y + height);
            } else {
                this.ctx.quadraticCurveTo(x, ctrl1, x + (width > 0 ? kSize : -kSize), midPoint);
                this.ctx.quadraticCurveTo(x, ctrl2, x, y + height);
            }
        }
    }

    drawPiece(piece) {
        this.ctx.beginPath();
        this.ctx.moveTo(piece.x, piece.y);
        
        // Draw top edge
        this.drawPieceEdge(piece.x, piece.y, piece.width, 0, piece.topEdge);
        
        // Draw right edge
        this.drawPieceEdge(piece.x + piece.width, piece.y, 0, piece.height, piece.rightEdge);
        
        // Draw bottom edge
        this.drawPieceEdge(piece.x + piece.width, piece.y + piece.height, -piece.width, 0, piece.bottomEdge);
        
        // Draw left edge
        this.drawPieceEdge(piece.x, piece.y + piece.height, 0, -piece.height, piece.leftEdge);
        
        this.ctx.closePath();
        this.ctx.fillStyle = piece.placed ? '#4CAF50' : '#2196F3';
        this.ctx.fill();
        this.ctx.strokeStyle = '#666';
        this.ctx.stroke();
    }

    initializeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.pieceWidth = (this.canvas.width/2) / 4;  // Frame is half the canvas width
        this.pieceHeight = (this.canvas.height/2) / 4; // Frame is half the canvas height
        
        // Create puzzle pieces
        for(let row = 0; row < 4; row++) {
            for(let col = 0; col < 4; col++) {
                // Position pieces on the right side of the frame
                const startX = this.canvas.width/2 + 20 + (col % 2) * this.pieceWidth;
                const startY = 20 + row * this.pieceHeight;
                
                this.pieces.push({
                    x: startX,
                    y: startY,
                    correctX: col * this.pieceWidth,
                    correctY: row * this.pieceHeight,
                    width: this.pieceWidth,
                    height: this.pieceHeight,
                    available: false,
                    placed: false,
                    topEdge: this.getEdgeType(row, col, 'top'),
                    rightEdge: this.getEdgeType(row, col, 'right'),
                    bottomEdge: this.getEdgeType(row, col, 'bottom'),
                    leftEdge: this.getEdgeType(row, col, 'left')
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
        
        // Draw puzzle frame
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#888';
        this.ctx.strokeRect(0, 0, this.canvas.width/2, this.canvas.height/2);
        
        // Draw grid lines
        this.ctx.lineWidth = 1;
        for(let i = 1; i < 4; i++) {
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo((this.canvas.width/2/4) * i, 0);
            this.ctx.lineTo((this.canvas.width/2/4) * i, this.canvas.height/2);
            this.ctx.stroke();
            
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, (this.canvas.height/2/4) * i);
            this.ctx.lineTo(this.canvas.width/2, (this.canvas.height/2/4) * i);
            this.ctx.stroke();
        }
        
        // Reset line width for pieces
        this.ctx.lineWidth = 1;
        
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

    updateProgress() {
        const placedPieces = this.pieces.filter(p => p.placed).length;
        const progress = (placedPieces / this.totalPieces) * 100;
        const progressBar = document.querySelector('#batchProgress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
        
        // Update batch progress bar
        const batchProgress = ((this.currentBatch - 1) / this.batches.length) * 100;
        const nextBatchBar = document.querySelector('#batchProgress');
        if (nextBatchBar) {
            nextBatchBar.style.width = `${batchProgress}%`;
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', async () => {
    await audioManager.initialize();
    new PuzzleGame();
});
