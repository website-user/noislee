class NoisleeProcessor extends AudioWorkletProcessor {
    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];

        // Process each channel
        for (let channel = 0; channel < input.length; channel++) {
            const inputChannel = input[channel];
            const outputChannel = output[channel];

            // Invert the signal for noise cancellation
            for (let i = 0; i < inputChannel.length; i++) {
                outputChannel[i] = -inputChannel[i];
            }
        }

        // Return true to keep the processor running
        return true;
    }
}

registerProcessor('noislee-processor', NoisleeProcessor); 