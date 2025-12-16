import winston from 'winston';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Format personnalisé pour le développement (lisible par un humain)
const devFormat = printf(({ level, message, timestamp, ...metadata }: any) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    if (metadata.stack) {
        msg += `\n${metadata.stack}`;
    }
    return msg;
});

// Création du Logger
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
    ),
    defaultMeta: { service: 'whatsapp-manager' },
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'development'
                ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat)
                : json(),
        }),
    ],
});

/**
 * Log une action utilisateur
 */
export function logUserAction(userId: string, action: string, details?: Record<string, any>) {
    logger.info(`User Action: ${action}`, { userId, ...details });
}

/**
 * Log une erreur API
 */
export function logApiError(endpoint: string, error: Error, context?: Record<string, any>) {
    logger.error(`API Error: ${endpoint}`, {
        error: error.message,
        stack: error.stack,
        ...context
    });
}

/**
 * Log une requête WhatsApp
 */
export function logWhatsAppEvent(event: string, phoneNumber: string, details?: Record<string, any>) {
    logger.info(`WhatsApp: ${event}`, { phoneNumber, ...details });
}

/**
 * Middleware wrapper pour logger les requêtes API
 */
export function withLogging(handler: Function) {
    return async (req: Request, ...args: any[]) => {
        const start = Date.now();
        const method = req.method;
        const url = req.url;

        try {
            const response = await handler(req, ...args);
            const duration = Date.now() - start;

            logger.info(`HTTP ${method}`, {
                url,
                status: response.status,
                duration: `${duration}ms`,
            });

            return response;
        } catch (error: any) {
            const duration = Date.now() - start;

            logger.error(`Unhandled API Error`, {
                method,
                url,
                duration: `${duration}ms`,
                error: error.message,
                stack: error.stack
            });

            throw error;
        }
    };
}
