const PREFIX = '[dynamic-testing]';

export const pkgError = (message: string): Error => new Error(`${PREFIX} ${message}`);
