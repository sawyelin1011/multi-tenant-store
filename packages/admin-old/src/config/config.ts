import { devConfig } from './environments/dev';
import { stagingConfig } from './environments/staging';
import { prodConfig } from './environments/prod';

const env = (import.meta.env.VITE_ENV as 'development' | 'staging' | 'production') || 'development';

const configs = {
  development: devConfig,
  staging: stagingConfig,
  production: prodConfig,
};

export const runtimeConfig = configs[env];
