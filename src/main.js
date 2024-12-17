import { UIController } from './ui.js';
import { AudioProcessor } from './audioProcessor.js';

const ui = new UIController();
const processor = new AudioProcessor();

document.getElementById('startBtn').addEventListener('click', async () => {
    try {
        await processor.initialize();
        ui.setProcessingState(true);
        
        // Set initial gain values
        processor.setInputGain(ui.inputGain.value);
        processor.setOutputGain(ui.outputGain.value);
    } catch (error) {
        ui.setErrorState(error.message);
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    processor.stop();
    ui.setProcessingState(false);
});

// Add gain control listeners
ui.inputGain.addEventListener('input', (e) => {
    processor.setInputGain(parseFloat(e.target.value));
});

ui.outputGain.addEventListener('input', (e) => {
    processor.setOutputGain(parseFloat(e.target.value));
});
