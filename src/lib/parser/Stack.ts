export class Stack {
    private values: any[] = [[]];

    addVal(val: any) {
        this.head.push(val);
    }
    addLayer() {
        this.values.push([]);
    }
    collapseLayer() {
        const head = this.values.pop();
        this.addVal(head);
    }

    pull() {
        return this;
    }

    get value() {
        return this.values[0];
    }

    get head() {
        return this.values[this.values.length - 1];
    }
}
