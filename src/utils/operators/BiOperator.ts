import { EqualsOperator } from './EqualsOperator';
import { GTEOperator } from './GTEOperator';
import { GTOperator } from './GTOperator';
import { LTEOperator } from './LTEOperator';
import { LTOperator } from './LTOperator';
import { NotEqualsOperator } from './NotEqualsOperator';

export interface BiOperator<A, B, R> {
    apply(a: A, b: B): R;
}

export function getBiOperator(symbol: string): BiOperator<any, any, any> {
    switch (symbol) {
        case '=':
            return new EqualsOperator();
        case '!=':
            return new NotEqualsOperator();
        case '>':
            return new GTOperator();
        case '<':
            return new LTOperator();
        case '<=':
            return new LTEOperator();
        case '>=':
            return new GTEOperator();
        default:
            throw new Error(`operator not supported ${symbol}`);
    }
}
