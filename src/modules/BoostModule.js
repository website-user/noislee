import { AudioModule } from './AudioModule.js';

export class BoostModule extends AudioModule {
    constructor() {
        // Set a higher max value (10 = 1000% boost) and default to 2 (200%)
        super('boost', 'Signal Boost', 2, 0, 10, 0.1);
        this.boostNode = null;
    }

    connect(audioContext, source, destination) {
        // Create a gain node for boosting
        this.boostNode = audioContext.createGain();
        
        // Set initial boost value
        this.boostNode.gain.value = this.value;
        
        // Connect the nodes
        source.connect(this.boostNode);
        this.boostNode.connect(destination);
        
        return this.boostNode;
    }

    updateValue(value) {
        super.updateValue(value);
        if (this.boostNode) {
            // Apply an exponential curve to make the control more natural
            this.boostNode.gain.value = value;
        }
    }

    disconnect() {
        if (this.boostNode) {
            this.boostNode.disconnect();
            this.boostNode = null;
        }
    }
} 