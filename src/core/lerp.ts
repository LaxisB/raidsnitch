export function lerp(x: number, min: number, max: number) {
    return min + (max - min) * x;
}

export function ilerp(min: number, max: number, x: number) {
    return (x - min) / (max - min);
}
