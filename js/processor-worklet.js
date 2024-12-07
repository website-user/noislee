class NoisleeProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            {name: 'freqShift', defaultValue: 100, minValue: 0, maxValue: 500},
            {name: 'dissonanceFactor', defaultValue: 1.2, minValue: 1, maxValue: 2},
            {name: 'inputGain', defaultValue: 1.0, minValue: 0.1, maxValue: 5},
            {name: 'outputVolume', defaultValue: 0.5, minValue: 0, maxValue: 1},
            {name: 'rejectionBandwidth', defaultValue: 20, minValue: 5, maxValue: 50}
        ];
    }

    constructor() {
        super();
        console.log('NoisleeProcessor constructor called');
        
        // FFT setup
        this.fftSize = 2048;
        this.buffer = new Float32Array(this.fftSize);
        this.bufferIndex = 0;
        this.hannWindow = this.createHannWindow(this.fftSize);
        this.sampleCount = 0;
        
        // Frequency tracking
        this.frequencyHistory = [];
        this.historyLength = 3; // Number of frames to average
        
        // Phase accumulators for each harmonic
        this.phases = new Float32Array(3); // For three harmonics
        
        // Previous output tracking
        this.previousOutputs = new Float32Array(this.fftSize);
    }

    createHannWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
        }
        return window;
    }

    updateEnvelope(input) {
        const inputAbs = Math.abs(input);
        if (inputAbs > this.envelopeFollower) {
            this.envelopeFollower += (inputAbs - this.envelopeFollower) * this.envelopeAttack;
        } else {
            this.envelopeFollower += (inputAbs - this.envelopeFollower) * this.envelopeRelease;
        }
        return this.envelopeFollower;
    }

    detectMultipleFrequencies(buffer) {
        // Apply Hann window
        const windowedBuffer = new Float32Array(this.fftSize);
        for (let i = 0; i < this.fftSize; i++) {
            windowedBuffer[i] = buffer[i] * this.hannWindow[i];
        }

        // Compute FFT
        const real = new Float32Array(this.fftSize);
        const imag = new Float32Array(this.fftSize);
        real.set(windowedBuffer);
        this.fft(real, imag);
        
        // Compute magnitude spectrum
        const magnitudes = new Float32Array(this.fftSize / 2);
        for (let i = 0; i < this.fftSize / 2; i++) {
            magnitudes[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
        }
        
        // Find multiple peaks
        const peaks = [];
        const minBin = Math.floor(20 * this.fftSize / sampleRate);  // 20Hz minimum
        const maxBin = Math.floor(2000 * this.fftSize / sampleRate); // 2000Hz maximum
        const peakThreshold = Math.max(...magnitudes) * 0.1; // 10% of maximum magnitude
        
        for (let i = minBin + 1; i < maxBin - 1; i++) {
            // Check if this is a local maximum
            if (magnitudes[i] > magnitudes[i-1] && 
                magnitudes[i] > magnitudes[i+1] && 
                magnitudes[i] > peakThreshold) {
                
                // Quadratic interpolation for more accurate frequency
                const alpha = magnitudes[i-1];
                const beta = magnitudes[i];
                const gamma = magnitudes[i+1];
                const p = 0.5 * (alpha - gamma) / (alpha - 2*beta + gamma);
                
                const interpolatedBin = i + p;
                const frequency = interpolatedBin * sampleRate / this.fftSize;
                
                peaks.push({
                    frequency: frequency,
                    magnitude: magnitudes[i]
                });
            }
        }
        
        // Sort peaks by magnitude and take top 3
        peaks.sort((a, b) => b.magnitude - a.magnitude);
        return peaks.slice(0, 3);
    }

    // Simplified FFT implementation
    fft(real, imag) {
        const n = real.length;
        
        // Bit reversal
        for (let i = 0; i < n; i++) {
            const j = this.reverseBits(i, Math.log2(n));
            if (j > i) {
                // Swap real components
                const tempReal = real[i];
                real[i] = real[j];
                real[j] = tempReal;
                
                // Swap imaginary components
                const tempImag = imag[i];
                imag[i] = imag[j];
                imag[j] = tempImag;
            }
        }
        
        // FFT computation
        for (let size = 2; size <= n; size *= 2) {
            const halfsize = size / 2;
            const tablestep = n / size;
            
            for (let i = 0; i < n; i += size) {
                for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
                    const l = j + halfsize;
                    const tr = real[l] * Math.cos(2 * Math.PI * k / n) + 
                              imag[l] * Math.sin(2 * Math.PI * k / n);
                    const ti = imag[l] * Math.cos(2 * Math.PI * k / n) - 
                              real[l] * Math.sin(2 * Math.PI * k / n);
                    
                    real[l] = real[j] - tr;
                    imag[l] = imag[j] - ti;
                    real[j] += tr;
                    imag[j] += ti;
                }
            }
        }
    }

    reverseBits(x, bits) {
        let y = 0;
        for (let i = 0; i < bits; i++) {
            y = (y << 1) | (x & 1);
            x >>= 1;
        }
        return y;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        
        if (!input || !input[0]) return true;

        const inputChannel = input[0];
        const outputChannel = output[0];
        
        // Get current parameters
        const freqShift = parameters.freqShift[0];
        const dissonanceFactor = parameters.dissonanceFactor[0];
        const inputGain = parameters.inputGain[0];
        const outputVolume = parameters.outputVolume[0];
        
        for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.bufferIndex] = inputChannel[i] * inputGain;
            
            // Detect frequencies every buffer size samples
            if (this.sampleCount % (this.fftSize/4) === 0) {
                try {
                    const peaks = this.detectMultipleFrequencies(this.buffer);
                    
                    // Send frequency data to main thread
                    this.port.postMessage({
                        type: 'frequencyData',
                        frequencies: peaks || [] // Ensure we always send an array
                    });
                    
                    // Generate dissonant frequencies
                    (peaks || []).forEach((peak, index) => {
                        const dissonantFreq = peak.frequency * dissonanceFactor + freqShift;
                        const freqStep = 2 * Math.PI * dissonantFreq / sampleRate;
                        this.phases[index] += freqStep;
                        this.phases[index] %= 2 * Math.PI;
                    });
                } catch (error) {
                    console.error('Error in frequency detection:', error);
                }
            }
            
            // Generate output
            let outputSample = 0;
            for (let j = 0; j < this.phases.length; j++) {
                outputSample += Math.sin(this.phases[j]) * (0.5 / (j + 1));
            }
            
            // Apply envelope and output volume
            outputSample *= Math.abs(this.buffer[this.bufferIndex]) * outputVolume;
            
            // Feedback prevention
            const feedbackCancellation = this.previousOutputs[this.bufferIndex] * 0.6;
            outputSample -= feedbackCancellation;
            
            // Store and output
            this.previousOutputs[this.bufferIndex] = outputSample;
            outputChannel[i] = outputSample;
            
            this.bufferIndex = (this.bufferIndex + 1) % this.fftSize;
            this.sampleCount++;
        }

        return true;
    }
}

registerProcessor('noislee-processor', NoisleeProcessor); 