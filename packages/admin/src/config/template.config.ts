import { defaultColors } from '@/templates/default/colors';
import { defaultLayout } from '@/templates/default/layout';

export type TemplateName = 'default' | 'dark' | 'light' | 'custom';

export const templateConfig = {
  name: (import.meta.env.VITE_TEMPLATE as TemplateName) || 'default',
  colors: defaultColors,
  layout: defaultLayout,
  components: {
    button: {
      radius: 9999,
      weight: 'medium',
    },
  },
};
