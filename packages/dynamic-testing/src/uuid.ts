import { v4 as uuidV4 } from 'uuid';

/** Returns a UUID v4 string. Delegates to getUuidV4(). */
export const getUuid = (): string => getUuidV4();

/** Returns a UUID v4 string via the `uuid` package. */
export const getUuidV4 = (): string => uuidV4();
