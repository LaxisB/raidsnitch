export function lerp(x: number, min: number, max: number) {
    return min + (max - min) * x;
}

export function ilerp(min: number, max: number, x: number) {
    return (x - min) / (max - min);
}

export function remap(inMin: number, inMax: number, outMin: number, outMax: number, x: number) {
    const t = ilerp(inMin, inMax, x);
    return lerp(outMin, outMax, t);
}
