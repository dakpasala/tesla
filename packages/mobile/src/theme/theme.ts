const sharedSpacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

const sharedBorderRadius = {
  s: 8,
  m: 12,
  l: 16,
  xl: 22,
};

const sharedTypographySizes = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  header: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  listItem: {
    fontSize: 17,
    fontWeight: '400' as const,
  },
  sub: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
};

export const lightTheme = {
  colors: {
    primary: '#007AFF',
    background: '#FCFCFC',
    backgroundAlt: '#F2F2F7',
    card: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#8E8E93',
      light: '#A0A0A0',
    },
    status: {
      success: '#34C759',
      warning: '#FFCC00',
      error: '#FF3B30',
    },
    border: '#E5E5E5',
    white: '#FFFFFF',
  },
  typography: {
    display: { ...sharedTypographySizes.display, color: '#000000' },
    header: { ...sharedTypographySizes.header, color: '#000000' },
    sectionHeader: { ...sharedTypographySizes.sectionHeader, color: '#8E8E93' },
    body: { ...sharedTypographySizes.body, color: '#000000' },
    listItem: { ...sharedTypographySizes.listItem, color: '#000000' },
    sub: { ...sharedTypographySizes.sub, color: '#8E8E93' },
    caption: { ...sharedTypographySizes.caption, color: '#8E8E93' },
  },
  spacing: sharedSpacing,
  borderRadius: sharedBorderRadius,
  gradients: {
    darkCard: ['#000000', '#222222'],
  },
  components: {
    rewards: {
      iconBg: 'rgba(255,255,255,0.15)',
    },
    icon: '#C7C7CC',
  },
};

export const darkTheme = {
  colors: {
    primary: '#0A84FF',
    background: '#1C1C1E',
    backgroundAlt: '#2C2C2E',
    card: '#3A3A3C',
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
      light: '#636366',
    },
    status: {
      success: '#30D158',
      warning: '#FFD60A',
      error: '#FF453A',
    },
    border: '#38383A',
    white: '#FFFFFF',
  },
  typography: {
    display: { ...sharedTypographySizes.display, color: '#FFFFFF' },
    header: { ...sharedTypographySizes.header, color: '#FFFFFF' },
    sectionHeader: { ...sharedTypographySizes.sectionHeader, color: '#8E8E93' },
    body: { ...sharedTypographySizes.body, color: '#FFFFFF' },
    listItem: { ...sharedTypographySizes.listItem, color: '#FFFFFF' },
    sub: { ...sharedTypographySizes.sub, color: '#8E8E93' },
    caption: { ...sharedTypographySizes.caption, color: '#8E8E93' },
  },
  spacing: sharedSpacing,
  borderRadius: sharedBorderRadius,
  gradients: {
    darkCard: ['#000000', '#222222'],
  },
  components: {
    rewards: {
      iconBg: 'rgba(255,255,255,0.15)',
    },
    icon: '#636366',
  },
};

// Keep this for any components not yet migrated to dark mode
export const theme = lightTheme;

export type AppTheme = typeof lightTheme;