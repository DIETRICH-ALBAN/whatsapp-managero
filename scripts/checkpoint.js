const { execSync } = require('child_process');
const winston = require('winston');

// Configuration du Logger pour le script
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console()
    ],
});

// Récupérer le message de commit depuis les arguments
const message = process.argv[2] || 'Checkpoint automatique';

try {
    logger.info('Démarrage du checkpoint Git...');

    // 1. Ajouter tous les fichiers
    logger.info('Ajout des fichiers (git add .)...');
    execSync('git add .', { stdio: 'inherit' });

    // 2. Commiter
    logger.info(`Création du commit avec le message : "${message}"`);
    try {
        execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        logger.info('✅ Checkpoint réussi ! Les changements sont enregistrés localement.');
    } catch (err) {
        // Ignorer l'erreur si rien à commiter
        if (err.status === 1) {
            logger.warn('Aucun changement à enregistrer.');
        } else {
            throw err;
        }
    }

} catch (error) {
    logger.error(`❌ Erreur lors du checkpoint : ${error.message}`);
    process.exit(1);
}
