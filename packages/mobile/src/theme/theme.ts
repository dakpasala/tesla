export const theme = {
  colors: {
    primary: '#007AFF',
    background: '#FCFCFC',
    backgroundAlt: '#F2F2F7',
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
    header: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: '#000000',
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: '#8E8E93',
      textTransform: 'uppercase' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#000000',
    },
    sub: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: '#8E8E93',
    },
    caption: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: '#8E8E93',
    },
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 16,
    xl: 22,
  },
};
