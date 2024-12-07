// Initialize audio processor
const audioProcessor = new AudioProcessor();
let isProcessing = false;

// UI Elements
const toggleButton = document.getElementById('toggleButton');
const sliders = {
    freqShift: {
        input: document.getElementById('freqShift'),
        value: document.getElementById('freqShiftValue')
    },
    dissonanceFactor: {
        input: document.getElementById('dissonanceFactor'),
        value: document.getElementById('dissonanceValue')
    },
    inputGain: {
        input: document.getElementById('inputGain'),
        value: document.getElementById('inputGainValue')
    },
    outputVolume: {
        input: document.getElementById('outputVolume'),
        value: document.getElementById('outputVolumeValue')
    },
    rejectionBandwidth: {
        input: document.getElementById('rejectionBandwidth'),
        value: document.getElementById('rejectionBandwidthValue')
    }
};

// Start/Stop button handler
toggleButton.addEventListener('click', async () => {
    if (!isProcessing) {
        // First time clicking - initialize audio
        if (!audioProcessor.audioContext) {
            const initialized = await audioProcessor.initialize();
            if (!initialized) {
                alert('Failed to initialize audio. Please check microphone permissions.');
                return;
            }
        }
        
        audioProcessor.start();
        isProcessing = true;
        toggleButton.textContent = 'Stop Processing';
        toggleButton.classList.add('active');
    } else {
        audioProcessor.stop();
        isProcessing = false;
        toggleButton.textContent = 'Start Processing';
        toggleButton.classList.remove('active');
    }
});

// Slider update handler
function updateParameters() {
    const params = {
        freqShift: parseFloat(sliders.freqShift.input.value),
        dissonanceFactor: parseFloat(sliders.dissonanceFactor.input.value),
        inputGain: parseFloat(sliders.inputGain.input.value),
        outputVolume: parseFloat(sliders.outputVolume.input.value),
        rejectionBandwidth: parseFloat(sliders.rejectionBandwidth.input.value)
    };

    // Update display values
    for (const [key, slider] of Object.entries(sliders)) {
        slider.value.textContent = params[key];
    }

    // Update audio processor
    audioProcessor.updateParameters(params);
}

// Add event listeners to all sliders
Object.values(sliders).forEach(slider => {
    slider.input.addEventListener('input', updateParameters);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isProcessing) {
        audioProcessor.stop();
    } else if (!document.hidden && isProcessing) {
        audioProcessor.start();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (audioProcessor) {
        audioProcessor.stop();
    }
});

// Add error handling for audio context
window.addEventListener('error', (event) => {
    if (event.message.includes('audio') || event.message.includes('AudioContext')) {
        alert('Audio error occurred. Please refresh the page.');
        if (audioProcessor) {
            audioProcessor.stop();
        }
        isProcessing = false;
        toggleButton.textContent = 'Start Processing';
        toggleButton.classList.remove('active');
    }
});
