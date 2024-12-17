export class UIController {
    constructor() {
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.statusText = document.getElementById('statusText');
        
        // Add gain controls
        this.inputGain = document.getElementById('inputGain');
        this.outputGain = document.getElementById('outputGain');
        this.inputGainValue = document.getElementById('inputGainValue');
        this.outputGainValue = document.getElementById('outputGainValue');

        // Initialize gain display updates
        this.inputGain.addEventListener('input', () => {
            this.inputGainValue.textContent = parseFloat(this.inputGain.value).toFixed(1);
        });
        
        this.outputGain.addEventListener('input', () => {
            this.outputGainValue.textContent = parseFloat(this.outputGain.value).toFixed(1);
        });
    }

    setProcessingState(isProcessing) {
        this.startBtn.disabled = isProcessing;
        this.stopBtn.disabled = !isProcessing;
        this.statusText.textContent = isProcessing ? 
            'Processing audio...' : 'Waiting to start...';
        
        // Disable gain controls when not processing
        this.inputGain.disabled = !isProcessing;
        this.outputGain.disabled = !isProcessing;
    }

    setErrorState(error) {
        this.statusText.textContent = `Error: ${error}`;
        this.setProcessingState(false);
    }
} 