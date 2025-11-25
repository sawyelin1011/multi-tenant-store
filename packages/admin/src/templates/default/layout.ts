export const defaultLayout = {
  sidebar: {
    width: 256,
    collapsedWidth: 80,
    position: 'left' as const,
  },
  header: {
    height: 64,
    sticky: true,
  },
  content: {
    maxWidth: 1440,
    padding: {
      mobile: 16,
      desktop: 32,
    },
  },
};
