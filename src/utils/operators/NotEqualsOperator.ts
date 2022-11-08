import { BiOperator } from './BiOperator';

export class NotEqualsOperator implements BiOperator<number, number, boolean> {
    apply(a: number, b: number): boolean {
        return a !== b;
    }
}
