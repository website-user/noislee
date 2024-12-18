import { AudioModule } from './AudioModule.js';

export class AnalyzerModule extends AudioModule {
    constructor() {
        super('analyzer', 'Frequency Analyzer', 1, 0, 1, 1);
        this.analyzerNode = null;
        this.canvasCtx = null;
        this.isAnalyzing = false;
        this.audioContext = null;
    }

    createHTML() {
        const container = document.createElement('div');
        container.className = 'analyzer-container';
        
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 200;
        canvas.style.backgroundColor = '#f0f0f0';
        this.canvasCtx = canvas.getContext('2d');
        
        container.appendChild(canvas);
        this.element = container;
        return container;
    }

    connect(audioContext, source, destination) {
        this.audioContext = audioContext;
        this.analyzerNode = audioContext.createAnalyser();
        this.analyzerNode.fftSize = 2048;
        
        source.connect(this.analyzerNode);
        this.analyzerNode.connect(destination);
        
        this.startAnalyzing();
        return this.analyzerNode;
    }

    startAnalyzing() {
        if (!this.analyzerNode || !this.canvasCtx || !this.audioContext) return;
        
        this.isAnalyzing = true;
        const bufferLength = this.analyzerNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = this.canvasCtx.canvas;
        
        const draw = () => {
            if (!this.isAnalyzing) return;
            
            requestAnimationFrame(draw);
            
            this.analyzerNode.getByteFrequencyData(dataArray);
            
            this.canvasCtx.fillStyle = '#f0f0f0';
            this.canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for(let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 255 * canvas.height;
                
                // Calculate frequency for this bin
                const frequency = i * this.audioContext.sampleRate / (this.analyzerNode.fftSize * 2);
                
                // Color based on frequency range
                if (frequency < 60) {
                    this.canvasCtx.fillStyle = '#FF4136'; // Low
                } else if (frequency < 250) {
                    this.canvasCtx.fillStyle = '#FF851B'; // Low-Mid
                } else if (frequency < 2000) {
                    this.canvasCtx.fillStyle = '#FFDC00'; // Mid
                } else {
                    this.canvasCtx.fillStyle = '#2ECC40'; // High
                }
                
                this.canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
            
            // Draw frequency markers
            this.canvasCtx.fillStyle = '#000';
            this.canvasCtx.font = '12px Arial';
            this.canvasCtx.fillText('60Hz', 20, 20);
            this.canvasCtx.fillText('250Hz', canvas.width * 0.2, 20);
            this.canvasCtx.fillText('2kHz', canvas.width * 0.5, 20);
            this.canvasCtx.fillText('20kHz', canvas.width - 40, 20);
        };
        
        draw();
    }

    disconnect() {
        this.isAnalyzing = false;
        if (this.analyzerNode) {
            this.analyzerNode.disconnect();
            this.analyzerNode = null;
        }
        this.audioContext = null;
    }
} 