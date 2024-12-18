import { AudioModule } from './AudioModule.js';

export class DelayModule extends AudioModule {
    constructor() {
        super('delay', 'Echo Delay', 0, 0, 2, 0.1);
        this.delayNode = null;
        this.feedbackNode = null;
        this.dryNode = null;
        this.wetNode = null;
        this.outputNode = null;
        this.filterNode = null;
        this.modulationNode = null;
        
        // Additional controls
        this.controls = {
            feedback: {
                id: 'delayFeedback',
                label: 'Feedback Amount',
                value: 0.4,
                min: 0,
                max: 0.9,
                step: 0.1
            },
            wetDry: {
                id: 'delayWetDry',
                label: 'Wet/Dry Mix',
                value: 0.5,
                min: 0,
                max: 1,
                step: 0.1
            },
            filterFreq: {
                id: 'delayFilter',
                label: 'Filter Frequency',
                value: 2000,
                min: 20,
                max: 20000,
                step: 100
            },
            modRate: {
                id: 'delayModRate',
                label: 'Modulation Rate',
                value: 0,
                min: 0,
                max: 10,
                step: 0.1
            },
            modDepth: {
                id: 'delayModDepth',
                label: 'Modulation Depth',
                value: 0,
                min: 0,
                max: 0.02,
                step: 0.001
            }
        };
    }

    createHTML() {
        const container = document.createElement('div');
        container.className = 'module-container';
        
        // Main delay time control
        container.appendChild(super.createHTML());
        
        // Additional controls
        for (const [key, control] of Object.entries(this.controls)) {
            const div = document.createElement('div');
            div.className = 'gain-control';
            
            const label = document.createElement('label');
            label.htmlFor = control.id;
            label.textContent = control.label;
            
            const input = document.createElement('input');
            input.type = 'range';
            input.id = control.id;
            input.min = control.min;
            input.max = control.max;
            input.step = control.step;
            input.value = control.value;
            
            const span = document.createElement('span');
            span.id = `${control.id}Value`;
            span.textContent = control.value;
            
            // Add input listener
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                control.value = value;
                span.textContent = value.toFixed(2);
                this.updateControl(key, value);
            });
            
            div.appendChild(label);
            div.appendChild(input);
            div.appendChild(span);
            container.appendChild(div);
        }
        
        this.element = container;
        return container;
    }

    connect(audioContext, source, destination) {
        // Create nodes
        this.delayNode = audioContext.createDelay(2.0);
        this.feedbackNode = audioContext.createGain();
        this.dryNode = audioContext.createGain();
        this.wetNode = audioContext.createGain();
        this.outputNode = audioContext.createGain();
        this.filterNode = audioContext.createBiquadFilter();
        
        // Configure filter
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = this.controls.filterFreq.value;
        
        // Set up modulation oscillator
        this.modulationNode = audioContext.createOscillator();
        const modulationGain = audioContext.createGain();
        this.modulationNode.frequency.value = this.controls.modRate.value;
        modulationGain.gain.value = this.controls.modDepth.value;
        
        // Start modulation
        this.modulationNode.connect(modulationGain);
        modulationGain.connect(this.delayNode.delayTime);
        this.modulationNode.start();

        // Set initial values
        this.delayNode.delayTime.value = this.value;
        this.feedbackNode.gain.value = this.controls.feedback.value;
        this.dryNode.gain.value = 1 - this.controls.wetDry.value;
        this.wetNode.gain.value = this.controls.wetDry.value;

        // Connect nodes:
        // Input -> Dry -> Output
        source.connect(this.dryNode);
        this.dryNode.connect(this.outputNode);

        // Input -> Delay -> Filter -> Wet -> Output
        source.connect(this.delayNode);
        this.delayNode.connect(this.filterNode);
        this.filterNode.connect(this.wetNode);
        this.wetNode.connect(this.outputNode);

        // Feedback loop with filter
        this.filterNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.delayNode);

        // Connect output node to destination
        this.outputNode.connect(destination);

        return this.outputNode;
    }

    updateControl(control, value) {
        if (control === this.id) {
            this.updateValue(value);
            return;
        }
        
        switch(control) {
            case 'feedback':
                if (this.feedbackNode) {
                    this.feedbackNode.gain.value = value;
                }
                break;
            case 'wetDry':
                if (this.wetNode && this.dryNode) {
                    this.wetNode.gain.value = value;
                    this.dryNode.gain.value = 1 - value;
                }
                break;
            case 'filterFreq':
                if (this.filterNode) {
                    this.filterNode.frequency.value = value;
                }
                break;
            case 'modRate':
                if (this.modulationNode) {
                    this.modulationNode.frequency.value = value;
                }
                break;
            case 'modDepth':
                if (this.modulationNode) {
                    const modulationGain = this.modulationNode.connect.gain;
                    if (modulationGain) {
                        modulationGain.value = value;
                    }
                }
                break;
        }
    }

    disconnect() {
        if (this.modulationNode) {
            this.modulationNode.stop();
            this.modulationNode.disconnect();
            this.modulationNode = null;
        }
        if (this.filterNode) {
            this.filterNode.disconnect();
            this.filterNode = null;
        }
        if (this.delayNode) {
            this.delayNode.disconnect();
            this.delayNode = null;
        }
        if (this.feedbackNode) {
            this.feedbackNode.disconnect();
            this.feedbackNode = null;
        }
        if (this.dryNode) {
            this.dryNode.disconnect();
            this.dryNode = null;
        }
        if (this.wetNode) {
            this.wetNode.disconnect();
            this.wetNode = null;
        }
        if (this.outputNode) {
            this.outputNode.disconnect();
            this.outputNode = null;
        }
    }

    updateValue(value) {
        super.updateValue(value);
        if (this.delayNode) {
            this.delayNode.delayTime.value = value;
        }
    }
} 