import { BiOperator } from './BiOperator';

export class EqualsOperator implements BiOperator<number, number, boolean> {
    apply(a: number, b: number): boolean {
        return a === b;
    }
}
