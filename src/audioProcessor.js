export class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.micStream = null;
        this.workletNode = null;
        this.inputGainNode = null;
        this.outputGainNode = null;
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            await this.audioContext.audioWorklet.addModule('/src/noisleeProcessor.js');
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create nodes
            const source = this.audioContext.createMediaStreamSource(this.micStream);
            this.inputGainNode = this.audioContext.createGain();
            this.workletNode = new AudioWorkletNode(this.audioContext, 'noislee-processor');
            this.outputGainNode = this.audioContext.createGain();
            
            // Connect nodes
            source
                .connect(this.inputGainNode)
                .connect(this.workletNode)
                .connect(this.outputGainNode)
                .connect(this.audioContext.destination);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    setInputGain(value) {
        if (this.inputGainNode) {
            this.inputGainNode.gain.value = value;
        }
    }

    setOutputGain(value) {
        if (this.outputGainNode) {
            this.outputGainNode.gain.value = value;
        }
    }

    stop() {
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }
        if (this.inputGainNode) {
            this.inputGainNode.disconnect();
            this.inputGainNode = null;
        }
        if (this.outputGainNode) {
            this.outputGainNode.disconnect();
            this.outputGainNode = null;
        }
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
} 