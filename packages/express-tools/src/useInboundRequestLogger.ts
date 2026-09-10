import { inboundRequestLogger } from './middlewares/inboundRequestLogger';

import type { Logger } from '@couimet/logger-contract';
import type { Application } from 'express';

export const useInboundRequestLogger = (app: Application, logger: Logger): void => {
  app.use(inboundRequestLogger(logger));
};
