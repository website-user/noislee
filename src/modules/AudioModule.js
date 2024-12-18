export class AudioModule {
    constructor(id, label, defaultValue = 1, min = 0, max = 2, step = 0.1) {
        this.id = id;
        this.label = label;
        this.value = defaultValue;
        this.min = min;
        this.max = max;
        this.step = step;
        this.element = null;
    }

    createHTML() {
        const div = document.createElement('div');
        div.className = 'gain-control';
        
        const label = document.createElement('label');
        label.htmlFor = this.id;
        label.textContent = this.label;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.id = this.id;
        input.min = this.min;
        input.max = this.max;
        input.step = this.step;
        input.value = this.value;
        
        const span = document.createElement('span');
        span.id = `${this.id}Value`;
        span.textContent = this.value.toFixed(1);
        
        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(span);
        
        this.element = div;
        return div;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
        if (this.element) {
            const input = this.element.querySelector('input');
            const span = this.element.querySelector('span');
            if (input && span) {
                input.value = value;
                span.textContent = value.toFixed(1);
            }
        }
    }

    updateValue(value) {
        this.setValue(value);
    }

    setEnabled(enabled) {
        if (this.element) {
            const input = this.element.querySelector('input');
            if (input) {
                input.disabled = !enabled;
            }
        }
    }
} 