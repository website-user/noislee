class AudioProcessor {
    constructor() {
        console.log('AudioProcessor constructor called');
        this.audioContext = null;
        this.inputNode = null;
        this.processorNode = null;
        
        // Parameters
        this.freqShift = 100;
        this.dissonanceFactor = 1.2;
        this.inputGain = 1.0;
        this.outputVolume = 0.5;
        this.rejectionBandwidth = 20;
        
        // Add visualization canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 200;
        this.canvas.style.backgroundColor = '#f0f0f0';
        this.canvas.style.border = '1px solid #ccc';
        this.canvas.style.borderRadius = '4px';
        this.canvas.style.marginTop = '20px';
        
        document.querySelector('.controls').appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.frequencyData = [];
        this.maxFrequencyDataPoints = 100;
    }

    async initialize() {
        try {
            console.log('Initializing audio context...');
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sinkId: 'mixing'  // Experimental attempt at audio mixing
            });
            
            // Set audio session for better iOS handling
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'Nature Sounds',
                    artist: 'Noislee',
                    album: 'Background Sounds'
                });
            }
    
            console.log('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            
            console.log('Microphone access granted, creating input node...');
            this.inputNode = this.audioContext.createMediaStreamSource(stream);
            
            console.log('Creating audio processor...');
            await this.createAudioProcessor();
            
            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            return false;
        }
    }

    async createAudioProcessor() {
        try {
            console.log('Loading audio worklet module...');
            await this.audioContext.audioWorklet.addModule('./js/processor-worklet.js');
            
            console.log('Creating AudioWorkletNode...');
            this.processorNode = new AudioWorkletNode(this.audioContext, 'noislee-processor');
            
            console.log('Setting up message handling...');
            this.processorNode.port.onmessage = (event) => {
                if (event.data.type === 'frequencyData') {
                    console.log('Received frequency data:', event.data);
                    this.updateVisualization(event.data);
                }
            };
            
            console.log('Connecting audio nodes...');
            this.inputNode.connect(this.processorNode);
            this.processorNode.connect(this.audioContext.destination);
            
            console.log('Audio processor created successfully');
        } catch (error) {
            console.error('Error creating audio processor:', error);
            throw error;
        }
    }

    updateParameters(params) {
        if (!this.processorNode) return;
        
        Object.entries(params).forEach(([key, value]) => {
            const param = this.processorNode.parameters.get(key);
            if (param) {
                param.setValueAtTime(value, this.audioContext.currentTime);
            }
        });
    }

    start() {
        if (this.audioContext) {
            console.log('Starting audio processing...');
            this.audioContext.resume();
        }
    }

    stop() {
        if (this.audioContext) {
            console.log('Stopping audio processing...');
            this.audioContext.suspend();
        }
    }

    updateVisualization(frequencyData) {
        // Check if we have valid frequency data
        if (!frequencyData || !frequencyData.frequencies) {
            console.log('No frequency data received');
            return;
        }

        const frequencies = frequencyData.frequencies;

        // Add new frequency data
        this.frequencyData.push(frequencies);
        if (this.frequencyData.length > this.maxFrequencyDataPoints) {
            this.frequencyData.shift();
        }

        // Clear canvas
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Define colors for different frequencies
        const colors = ['#007bff', '#28a745', '#dc3545'];

        // Draw frequency graphs
        const xStep = this.canvas.width / this.maxFrequencyDataPoints;
        const yScale = this.canvas.height / 2000; // Scale for frequencies up to 2000Hz

        // Draw each frequency line
        frequencies.forEach((freq, index) => {
            if (!freq) return; // Skip if frequency data is missing

            this.ctx.beginPath();
            this.ctx.strokeStyle = colors[index];
            this.ctx.lineWidth = 2;

            this.frequencyData.forEach((freqSet, i) => {
                if (!freqSet[index]) return; // Skip invalid data points
                
                const x = i * xStep;
                const y = this.canvas.height - (freqSet[index].frequency || 0) * yScale;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });

            this.ctx.stroke();
        });

        // Draw frequency values
        this.ctx.fillStyle = '#333';
        this.ctx.font = '14px Arial';
        frequencies.forEach((freq, index) => {
            if (!freq) return; // Skip if frequency data is missing
            
            this.ctx.fillStyle = colors[index];
            this.ctx.fillText(
                `Frequency ${index + 1}: ${Math.round(freq.frequency)}Hz (${Math.round(freq.magnitude * 100)}%)`, 
                10, 
                20 + (index * 20)
            );
        });
    }
}