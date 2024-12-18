import { AudioModule } from './AudioModule.js';

export class InputGainModule extends AudioModule {
    constructor() {
        super('inputGain', 'Input Sensitivity', 1, 0, 4, 0.1);
        this.gainNode = null;
    }

    connect(audioContext, source, destination) {
        this.gainNode = audioContext.createGain();
        this.gainNode.gain.value = this.value;
        
        source.connect(this.gainNode);
        this.gainNode.connect(destination);
        
        return this.gainNode;  // Return the gainNode instead of destination
    }

    updateValue(value) {
        super.updateValue(value);
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }

    disconnect() {
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }
} 