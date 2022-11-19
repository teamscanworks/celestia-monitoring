export abstract class Rule {
    constructor() { }

    abstract getRuleName(): string;
    abstract getRuleDescription(): string;

}