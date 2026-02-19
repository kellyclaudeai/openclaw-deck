export interface Theme {
  id: string;
  name: string;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    scrollbar: string;
    scrollbarTrack: string;
    columnBg: string;
    columnBgAlt: string;
    columnHover: string;
    headerBg: string;
    inputBg: string;
    inputBorder: string;
    inputFocus: string;
    codeBg: string;
    codeBlockBg: string;
    quoteBorder: string;
    link: string;
  };
}

export const themes: Record<string, Theme> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: '#12151d',
      bgSecondary: '#1a1e2e',
      bgTertiary: '#0f1119',
      text: 'rgba(255, 255, 255, 0.9)',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textMuted: 'rgba(255, 255, 255, 0.5)',
      border: 'rgba(255, 255, 255, 0.1)',
      borderLight: 'rgba(255, 255, 255, 0.07)',
      scrollbar: 'rgba(255, 255, 255, 0.16)',
      scrollbarTrack: 'rgba(255, 255, 255, 0.05)',
      columnBg: 'rgba(255, 255, 255, 0.06)',
      columnBgAlt: 'rgba(255, 255, 255, 0.08)',
      columnHover: 'rgba(255, 255, 255, 0.01)',
      headerBg: 'rgba(255, 255, 255, 0.07)',
      inputBg: 'rgba(255, 255, 255, 0.1)',
      inputBorder: 'rgba(255, 255, 255, 0.14)',
      inputFocus: 'rgba(255, 255, 255, 0.24)',
      codeBg: 'rgba(255, 255, 255, 0.08)',
      codeBlockBg: 'rgba(0, 0, 0, 0.28)',
      quoteBorder: 'rgba(255, 255, 255, 0.25)',
      link: '#7dd3fc',
    }
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean Depths',
    colors: {
      bg: '#0a1929',
      bgSecondary: '#132f4c',
      bgTertiary: '#051622',
      text: 'rgba(255, 255, 255, 0.92)',
      textSecondary: 'rgba(187, 222, 251, 0.8)',
      textMuted: 'rgba(176, 190, 197, 0.7)',
      border: 'rgba(66, 165, 245, 0.2)',
      borderLight: 'rgba(66, 165, 245, 0.1)',
      scrollbar: 'rgba(66, 165, 245, 0.3)',
      scrollbarTrack: 'rgba(66, 165, 245, 0.08)',
      columnBg: 'rgba(33, 150, 243, 0.08)',
      columnBgAlt: 'rgba(33, 150, 243, 0.12)',
      columnHover: 'rgba(33, 150, 243, 0.03)',
      headerBg: 'rgba(25, 118, 210, 0.15)',
      inputBg: 'rgba(33, 150, 243, 0.12)',
      inputBorder: 'rgba(66, 165, 245, 0.2)',
      inputFocus: 'rgba(66, 165, 245, 0.4)',
      codeBg: 'rgba(33, 150, 243, 0.15)',
      codeBlockBg: 'rgba(13, 71, 161, 0.2)',
      quoteBorder: 'rgba(66, 165, 245, 0.4)',
      link: '#4fc3f7',
    }
  },

  forest: {
    id: 'forest',
    name: 'Forest Night',
    colors: {
      bg: '#0d1b0f',
      bgSecondary: '#1a2f1e',
      bgTertiary: '#050a06',
      text: 'rgba(255, 255, 255, 0.92)',
      textSecondary: 'rgba(200, 230, 201, 0.85)',
      textMuted: 'rgba(165, 214, 167, 0.7)',
      border: 'rgba(102, 187, 106, 0.2)',
      borderLight: 'rgba(102, 187, 106, 0.1)',
      scrollbar: 'rgba(102, 187, 106, 0.3)',
      scrollbarTrack: 'rgba(102, 187, 106, 0.08)',
      columnBg: 'rgba(76, 175, 80, 0.08)',
      columnBgAlt: 'rgba(76, 175, 80, 0.12)',
      columnHover: 'rgba(76, 175, 80, 0.03)',
      headerBg: 'rgba(56, 142, 60, 0.15)',
      inputBg: 'rgba(76, 175, 80, 0.12)',
      inputBorder: 'rgba(102, 187, 106, 0.2)',
      inputFocus: 'rgba(102, 187, 106, 0.4)',
      codeBg: 'rgba(76, 175, 80, 0.15)',
      codeBlockBg: 'rgba(27, 94, 32, 0.2)',
      quoteBorder: 'rgba(102, 187, 106, 0.4)',
      link: '#69f0ae',
    }
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    colors: {
      bg: '#1a0e13',
      bgSecondary: '#2e1821',
      bgTertiary: '#100509',
      text: 'rgba(255, 255, 255, 0.93)',
      textSecondary: 'rgba(255, 224, 178, 0.85)',
      textMuted: 'rgba(255, 183, 77, 0.7)',
      border: 'rgba(255, 138, 101, 0.2)',
      borderLight: 'rgba(255, 138, 101, 0.1)',
      scrollbar: 'rgba(255, 138, 101, 0.3)',
      scrollbarTrack: 'rgba(255, 138, 101, 0.08)',
      columnBg: 'rgba(255, 112, 67, 0.08)',
      columnBgAlt: 'rgba(255, 112, 67, 0.12)',
      columnHover: 'rgba(255, 112, 67, 0.03)',
      headerBg: 'rgba(244, 81, 30, 0.15)',
      inputBg: 'rgba(255, 112, 67, 0.12)',
      inputBorder: 'rgba(255, 138, 101, 0.2)',
      inputFocus: 'rgba(255, 138, 101, 0.4)',
      codeBg: 'rgba(255, 112, 67, 0.15)',
      codeBlockBg: 'rgba(191, 54, 12, 0.2)',
      quoteBorder: 'rgba(255, 138, 101, 0.4)',
      link: '#ffab91',
    }
  },

  slate: {
    id: 'slate',
    name: 'Slate Gray',
    colors: {
      bg: '#1e293b',
      bgSecondary: '#334155',
      bgTertiary: '#0f172a',
      text: 'rgba(248, 250, 252, 0.95)',
      textSecondary: 'rgba(226, 232, 240, 0.85)',
      textMuted: 'rgba(148, 163, 184, 0.8)',
      border: 'rgba(100, 116, 139, 0.3)',
      borderLight: 'rgba(100, 116, 139, 0.15)',
      scrollbar: 'rgba(148, 163, 184, 0.3)',
      scrollbarTrack: 'rgba(100, 116, 139, 0.1)',
      columnBg: 'rgba(51, 65, 85, 0.5)',
      columnBgAlt: 'rgba(51, 65, 85, 0.7)',
      columnHover: 'rgba(71, 85, 105, 0.3)',
      headerBg: 'rgba(30, 41, 59, 0.8)',
      inputBg: 'rgba(51, 65, 85, 0.6)',
      inputBorder: 'rgba(100, 116, 139, 0.4)',
      inputFocus: 'rgba(148, 163, 184, 0.5)',
      codeBg: 'rgba(71, 85, 105, 0.4)',
      codeBlockBg: 'rgba(15, 23, 42, 0.6)',
      quoteBorder: 'rgba(148, 163, 184, 0.4)',
      link: '#94a3b8',
    }
  },

  purple: {
    id: 'purple',
    name: 'Purple Haze',
    colors: {
      bg: '#1a0d2e',
      bgSecondary: '#2d1b4e',
      bgTertiary: '#0f0820',
      text: 'rgba(255, 255, 255, 0.93)',
      textSecondary: 'rgba(225, 190, 231, 0.85)',
      textMuted: 'rgba(186, 104, 200, 0.7)',
      border: 'rgba(171, 71, 188, 0.25)',
      borderLight: 'rgba(171, 71, 188, 0.12)',
      scrollbar: 'rgba(171, 71, 188, 0.35)',
      scrollbarTrack: 'rgba(171, 71, 188, 0.1)',
      columnBg: 'rgba(156, 39, 176, 0.1)',
      columnBgAlt: 'rgba(156, 39, 176, 0.15)',
      columnHover: 'rgba(156, 39, 176, 0.05)',
      headerBg: 'rgba(123, 31, 162, 0.18)',
      inputBg: 'rgba(156, 39, 176, 0.12)',
      inputBorder: 'rgba(171, 71, 188, 0.25)',
      inputFocus: 'rgba(171, 71, 188, 0.45)',
      codeBg: 'rgba(156, 39, 176, 0.15)',
      codeBlockBg: 'rgba(74, 20, 140, 0.25)',
      quoteBorder: 'rgba(171, 71, 188, 0.4)',
      link: '#ce93d8',
    }
  },

  cyber: {
    id: 'cyber',
    name: 'Cyberpunk',
    colors: {
      bg: '#0a0e27',
      bgSecondary: '#1a1f3a',
      bgTertiary: '#050712',
      text: 'rgba(0, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 0, 255, 0.85)',
      textMuted: 'rgba(138, 43, 226, 0.7)',
      border: 'rgba(0, 255, 255, 0.3)',
      borderLight: 'rgba(0, 255, 255, 0.15)',
      scrollbar: 'rgba(255, 0, 255, 0.4)',
      scrollbarTrack: 'rgba(0, 255, 255, 0.1)',
      columnBg: 'rgba(0, 255, 255, 0.05)',
      columnBgAlt: 'rgba(255, 0, 255, 0.05)',
      columnHover: 'rgba(0, 255, 255, 0.08)',
      headerBg: 'rgba(0, 255, 255, 0.08)',
      inputBg: 'rgba(0, 255, 255, 0.08)',
      inputBorder: 'rgba(0, 255, 255, 0.3)',
      inputFocus: 'rgba(255, 0, 255, 0.4)',
      codeBg: 'rgba(138, 43, 226, 0.15)',
      codeBlockBg: 'rgba(75, 0, 130, 0.3)',
      quoteBorder: 'rgba(255, 0, 255, 0.4)',
      link: '#ff00ff',
    }
  },

  rose: {
    id: 'rose',
    name: 'Rose Garden',
    colors: {
      bg: '#1f0d15',
      bgSecondary: '#3d1a27',
      bgTertiary: '#150509',
      text: 'rgba(255, 255, 255, 0.93)',
      textSecondary: 'rgba(255, 209, 220, 0.85)',
      textMuted: 'rgba(244, 143, 177, 0.7)',
      border: 'rgba(236, 64, 122, 0.25)',
      borderLight: 'rgba(236, 64, 122, 0.12)',
      scrollbar: 'rgba(236, 64, 122, 0.35)',
      scrollbarTrack: 'rgba(236, 64, 122, 0.1)',
      columnBg: 'rgba(233, 30, 99, 0.08)',
      columnBgAlt: 'rgba(233, 30, 99, 0.12)',
      columnHover: 'rgba(233, 30, 99, 0.05)',
      headerBg: 'rgba(194, 24, 91, 0.15)',
      inputBg: 'rgba(233, 30, 99, 0.12)',
      inputBorder: 'rgba(236, 64, 122, 0.25)',
      inputFocus: 'rgba(236, 64, 122, 0.45)',
      codeBg: 'rgba(233, 30, 99, 0.15)',
      codeBlockBg: 'rgba(136, 14, 79, 0.2)',
      quoteBorder: 'rgba(236, 64, 122, 0.4)',
      link: '#f48fb1',
    }
  },
};

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
}
