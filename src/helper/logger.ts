import * as winston from 'winston';
import 'winston-daily-rotate-file';

// levels (we use winston's defaults)
// const levels = {
//   error: 0,    // for urgent errors that need immediate attention
//   warn: 1,     // for issues that need attention, but are not urgent
//   info: 2,     // e. g. for analytics, stuff that might be interesting
//   verbose: 3,  // e. g. for troubleshooting errors that have happened on a per-request basis
//   debug: 4,    // only relevant while reproducing bugs or developing the application
//   silly: 5,    // ;)
// }

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: `${__dirname}/../../logs/%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    level: 'silly',
});

export const logger = winston.createLogger({
    levels: winston.config.npm.levels,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [fileRotateTransport],
});

if (process.env.NODE_ENV === 'development') {
    logger.add(
        new winston.transports.Console({
            level: 'silly',
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        }),
    );
}

export function globalErrorHandler(error: any) {
    if (error instanceof Error) {
        logger.error(error.message, { error });
    } else {
        logger.error(typeof error === 'object' ? error?.message : JSON.stringify(error), { error });
    }

    // give the logger backend some time to report this error to a logging server
    // (Application exits as soon as there are no events on the stack anymore)
    setTimeout(() => null, 1000);
}

process.on('uncaughtException', globalErrorHandler);
process.on('unhandledRejection', globalErrorHandler);
