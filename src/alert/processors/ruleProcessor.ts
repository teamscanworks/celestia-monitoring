import { AlertRule } from '../model/alert-rule';

export interface RuleProcessor {
    process(alertRule: AlertRule): Promise<void>;
}
