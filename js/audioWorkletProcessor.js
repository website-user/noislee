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
        
        // FFT setup
        this.fftSize = 2048;
        this.buffer = new Float32Array(this.fftSize);
        this.bufferIndex = 0;
        
        // Frequency memory for feedback prevention
        this.lastGeneratedFreqs = [];
        this.freqMemorySize = 5;
        
        // High frequency attenuation
        this.rolloffStart = 3000;
        this.rolloffEnd = 5000;
    }

    applyHighFreqAttenuation(fftData, freqs) {
        const attenuation = new Float32Array(freqs.length);
        
        for (let i = 0; i < freqs.length; i++) {
            const freq = Math.abs(freqs[i]);
            if (freq <= this.rolloffStart) {
                attenuation[i] = 1;
            } else if (freq >= this.rolloffEnd) {
                attenuation[i] = 0;
            } else {
                const ratio = (freq - this.rolloffStart) / (this.rolloffEnd - this.rolloffStart);
                attenuation[i] = Math.cos(ratio * Math.PI/2) ** 2;
            }
        }
        
        return fftData.map((val, i) => val * attenuation[i]);
    }

    rejectOwnFrequencies(fftData, freqs) {
        for (const freq of this.lastGeneratedFreqs) {
            const bandwidth = this.parameters.get('rejectionBandwidth').value;
            for (let i = 0; i < freqs.length; i++) {
                if (Math.abs(freqs[i] - freq) < bandwidth) {
                    fftData[i] *= 0.1; // Reduce but don't completely eliminate
                }
            }
        }
        return fftData;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        
        if (!input || !input[0]) {
            console.log('No input received');
            return true;
        }
        
        // Log occasionally to avoid console spam
        if (Math.random() < 0.01) {
            console.log('Processing audio:', {
                inputChannels: input.length,
                outputChannels: output.length,
                bufferSize: input[0].length
            });
        }
        
        // Get current parameters
        const freqShift = parameters.freqShift[0];
        const dissonanceFactor = parameters.dissonanceFactor[0];
        const inputGain = parameters.inputGain[0];
        const outputVolume = parameters.outputVolume[0];
        
        // Fill buffer with new samples
        const inputChannel = input[0];
        for (let i = 0; i < inputChannel.length; i++) {
            this.buffer[this.bufferIndex] = inputChannel[i] * inputGain;
            this.bufferIndex = (this.bufferIndex + 1) % this.fftSize;
        }
        
        // When buffer is full, process it
        if (this.bufferIndex === 0) {
            // Perform FFT
            const fft = new Float32Array(this.fftSize);
            for (let i = 0; i < this.fftSize; i++) {
                fft[i] = this.buffer[i];
            }
            
            // Create frequency array
            const freqs = new Float32Array(this.fftSize);
            for (let i = 0; i < this.fftSize; i++) {
                freqs[i] = i * sampleRate / this.fftSize;
            }
            
            // Apply processing
            let processedFFT = this.rejectOwnFrequencies(fft, freqs);
            processedFFT = this.applyHighFreqAttenuation(processedFFT, freqs);
            
            // Find dominant frequency
            let maxMagnitude = 0;
            let dominantFreq = 0;
            for (let i = 0; i < this.fftSize/2; i++) {
                const magnitude = Math.abs(processedFFT[i]);
                if (magnitude > maxMagnitude) {
                    maxMagnitude = magnitude;
                    dominantFreq = freqs[i];
                }
            }
            
            // Generate dissonant frequency
            const dissonantFreq = dominantFreq * dissonanceFactor;
            this.lastGeneratedFreqs.push(dissonantFreq);
            if (this.lastGeneratedFreqs.length > this.freqMemorySize) {
                this.lastGeneratedFreqs.shift();
            }
            
            // Generate output signal
            for (let channel = 0; channel < output.length; channel++) {
                const outputChannel = output[channel];
                for (let i = 0; i < outputChannel.length; i++) {
                    const t = i / sampleRate;
                    outputChannel[i] = Math.sin(2 * Math.PI * dissonantFreq * t) * 
                                     Math.abs(inputChannel[i]) * // Envelope following
                                     outputVolume;
                }
            }
        }
        
        return true;
    }
}

registerProcessor('noislee-processor', NoisleeProcessor); 