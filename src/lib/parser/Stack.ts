export class Stack {
    private values: any[] = [[]];

    pushValue(val: any) {
        if (this.values.length) {
            this.values[0].push(val);
        }
    }
    addLayer(val: any[] = []) {
        this.values.unshift(val);
    }
    popLayer() {
        return this.values.pop() ?? [];
    }

    get value() {
        return this.values;
    }
}
