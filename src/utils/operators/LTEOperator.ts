import { BiOperator } from './BiOperator';

export class LTEOperator implements BiOperator<number, number, boolean> {
    apply(a: number, b: number): boolean {
        return a <= b;
    }
}
