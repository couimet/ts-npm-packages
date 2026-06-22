import type { ErrorOptions } from '@couimet/detailed-error';

export type ExpectedDetailedError = Omit<ErrorOptions<string>, 'code'>;
