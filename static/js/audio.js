class AudioManager {
    constructor() {
        this.synth = new Tone.Synth().toDestination();
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await Tone.start();
            this.initialized = true;
        }
    }

    playPieceSnap() {
        this.synth.triggerAttackRelease("C5", "32n", undefined, 0.1);
    }

    playBatchArrival() {
        this.synth.triggerAttackRelease("G4", "8n", undefined, 0.2);
    }

    playGameOver() {
        this.synth.triggerAttackRelease("C4", "4n", undefined, 0.3);
    }
}

const audioManager = new AudioManager();
