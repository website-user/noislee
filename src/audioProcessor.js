export class AudioProcessor {
    constructor(modules = []) {
        this.audioContext = null;
        this.micStream = null;
        this.workletNode = null;
        this.outputGain = null;
        this.modules = modules;
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.audioContext.audioWorklet.addModule('/src/noisleeProcessor.js');

            this.micStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    latency: 0,
                    channelCount: 1
                } 
            });
            
            // Create initial source
            const source = this.audioContext.createMediaStreamSource(this.micStream);
            
            // Chain all modules together
            let currentNode = source;
            for (const module of this.modules) {
                const nextNode = module.connect(this.audioContext, currentNode, this.audioContext.destination);
                if (nextNode) {
                    currentNode = nextNode;
                }
            }
            
            // Create and connect worklet node
            this.workletNode = new AudioWorkletNode(this.audioContext, 'noislee-processor');
            currentNode.connect(this.workletNode);

            // Create and connect output gain node
            this.outputGain = this.audioContext.createGain();
            this.outputGain.gain.value = 1.0; // Default value
            this.workletNode.connect(this.outputGain);
            this.outputGain.connect(this.audioContext.destination);
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error;
        }
    }

    setOutputGain(value) {
        if (this.outputGain) {
            this.outputGain.gain.value = value;
        }
    }

    stop() {
        this.modules.forEach(module => module.disconnect());
        if (this.workletNode) {
            this.workletNode.disconnect();
            this.workletNode = null;
        }
        if (this.outputGain) {
            this.outputGain.disconnect();
            this.outputGain = null;
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