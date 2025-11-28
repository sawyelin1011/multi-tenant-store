import { brand } from '../config/brand';

export function injectBrandTheme(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty('--brand-color', brand.primaryColor);
}
