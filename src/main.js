import { AudioProcessor } from './audioProcessor.js';
import { InputGainModule } from './modules/InputGainModule.js';
import { BoostModule } from './modules/BoostModule.js';
import { DelayModule } from './modules/DelayModule.js';
import { AnalyzerModule } from './modules/AnalyzerModule.js';

// Create modules (without OutputGainModule)
const modules = [
    new AnalyzerModule(),
    new InputGainModule(),
    new BoostModule(),
    new DelayModule()
];

// Create processor with modules
const processor = new AudioProcessor(modules);

// Create output gain control
const outputControl = document.createElement('div');
outputControl.className = 'gain-control';

const outputLabel = document.createElement('label');
outputLabel.htmlFor = 'outputGain';
outputLabel.textContent = 'Noislee Volume';

const outputSlider = document.createElement('input');
outputSlider.type = 'range';
outputSlider.id = 'outputGain';
outputSlider.min = '0';
outputSlider.max = '2';
outputSlider.step = '0.1';
outputSlider.value = '1';

const outputValue = document.createElement('span');
outputValue.id = 'outputGainValue';
outputValue.textContent = '1.0';

outputControl.appendChild(outputLabel);
outputControl.appendChild(outputSlider);
outputControl.appendChild(outputValue);

// Add output control to page
const moduleControls = document.getElementById('moduleControls');
moduleControls.appendChild(outputControl);

// Add output gain listener
outputSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    outputValue.textContent = value.toFixed(1);
    processor.setOutputGain(value);
});

// Render module controls
modules.forEach(module => {
    const element = module.createHTML();
    moduleControls.appendChild(element);
    
    // Add listeners for each module's input if it exists
    const input = element.querySelector('input');
    if (input) {
        input.addEventListener('input', (e) => {
            module.updateValue(parseFloat(e.target.value));
        });
    }
});

// Start/Stop button handlers
document.getElementById('startBtn').addEventListener('click', async () => {
    try {
        await processor.initialize();
        setProcessingState(true);
    } catch (error) {
        setErrorState(error.message);
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    processor.stop();
    setProcessingState(false);
});

// UI state management
function setProcessingState(isProcessing) {
    document.getElementById('startBtn').disabled = isProcessing;
    document.getElementById('stopBtn').disabled = !isProcessing;
    document.getElementById('statusText').textContent = 
        isProcessing ? 'Processing audio...' : 'Waiting to start...';
    
    modules.forEach(module => module.setEnabled(isProcessing));
}

function setErrorState(error) {
    document.getElementById('statusText').textContent = `Error: ${error}`;
    setProcessingState(false);
}
