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

  abyss: {
    id: 'abyss',
    name: 'Abyss (Ultra Dark)',
    colors: {
      bg: '#000000',
      bgSecondary: '#0a0a0a',
      bgTertiary: '#000000',
      text: 'rgba(255, 255, 255, 0.95)',
      textSecondary: 'rgba(255, 255, 255, 0.75)',
      textMuted: 'rgba(255, 255, 255, 0.45)',
      border: 'rgba(255, 255, 255, 0.08)',
      borderLight: 'rgba(255, 255, 255, 0.04)',
      scrollbar: 'rgba(255, 255, 255, 0.12)',
      scrollbarTrack: 'rgba(255, 255, 255, 0.03)',
      columnBg: 'rgba(255, 255, 255, 0.03)',
      columnBgAlt: 'rgba(255, 255, 255, 0.05)',
      columnHover: 'rgba(255, 255, 255, 0.01)',
      headerBg: 'rgba(255, 255, 255, 0.04)',
      inputBg: 'rgba(255, 255, 255, 0.06)',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      inputFocus: 'rgba(255, 255, 255, 0.18)',
      codeBg: 'rgba(255, 255, 255, 0.06)',
      codeBlockBg: 'rgba(255, 255, 255, 0.08)',
      quoteBorder: 'rgba(255, 255, 255, 0.2)',
      link: '#60a5fa',
    }
  },

  darcula: {
    id: 'darcula',
    name: 'Darcula (JetBrains)',
    colors: {
      bg: '#2b2b2b',
      bgSecondary: '#3c3f41',
      bgTertiary: '#242424',
      text: 'rgba(169, 183, 198, 1)',
      textSecondary: 'rgba(169, 183, 198, 0.85)',
      textMuted: 'rgba(128, 128, 128, 0.8)',
      border: 'rgba(60, 63, 65, 1)',
      borderLight: 'rgba(60, 63, 65, 0.5)',
      scrollbar: 'rgba(79, 83, 84, 1)',
      scrollbarTrack: 'rgba(60, 63, 65, 0.5)',
      columnBg: 'rgba(60, 63, 65, 0.6)',
      columnBgAlt: 'rgba(60, 63, 65, 0.8)',
      columnHover: 'rgba(75, 110, 175, 0.1)',
      headerBg: 'rgba(60, 63, 65, 0.9)',
      inputBg: 'rgba(69, 73, 74, 1)',
      inputBorder: 'rgba(89, 93, 94, 1)',
      inputFocus: 'rgba(75, 110, 175, 0.5)',
      codeBg: 'rgba(48, 51, 53, 1)',
      codeBlockBg: 'rgba(36, 36, 36, 1)',
      quoteBorder: 'rgba(106, 135, 89, 0.6)',
      link: '#6897bb',
    }
  },

  dracula: {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      bg: '#282a36',
      bgSecondary: '#343746',
      bgTertiary: '#21222c',
      text: 'rgba(248, 248, 242, 1)',
      textSecondary: 'rgba(248, 248, 242, 0.85)',
      textMuted: 'rgba(98, 114, 164, 1)',
      border: 'rgba(68, 71, 90, 1)',
      borderLight: 'rgba(68, 71, 90, 0.5)',
      scrollbar: 'rgba(68, 71, 90, 1)',
      scrollbarTrack: 'rgba(40, 42, 54, 0.5)',
      columnBg: 'rgba(68, 71, 90, 0.3)',
      columnBgAlt: 'rgba(68, 71, 90, 0.5)',
      columnHover: 'rgba(98, 114, 164, 0.1)',
      headerBg: 'rgba(68, 71, 90, 0.6)',
      inputBg: 'rgba(68, 71, 90, 0.5)',
      inputBorder: 'rgba(98, 114, 164, 0.3)',
      inputFocus: 'rgba(139, 233, 253, 0.3)',
      codeBg: 'rgba(68, 71, 90, 0.4)',
      codeBlockBg: 'rgba(33, 34, 44, 1)',
      quoteBorder: 'rgba(255, 121, 198, 0.5)',
      link: '#8be9fd',
    }
  },

  nord: {
    id: 'nord',
    name: 'Nord',
    colors: {
      bg: '#2e3440',
      bgSecondary: '#3b4252',
      bgTertiary: '#2e3440',
      text: 'rgba(236, 239, 244, 1)',
      textSecondary: 'rgba(216, 222, 233, 0.9)',
      textMuted: 'rgba(76, 86, 106, 1)',
      border: 'rgba(59, 66, 82, 1)',
      borderLight: 'rgba(59, 66, 82, 0.5)',
      scrollbar: 'rgba(76, 86, 106, 1)',
      scrollbarTrack: 'rgba(59, 66, 82, 0.5)',
      columnBg: 'rgba(59, 66, 82, 0.5)',
      columnBgAlt: 'rgba(67, 76, 94, 0.6)',
      columnHover: 'rgba(136, 192, 208, 0.08)',
      headerBg: 'rgba(59, 66, 82, 0.8)',
      inputBg: 'rgba(59, 66, 82, 0.6)',
      inputBorder: 'rgba(76, 86, 106, 0.5)',
      inputFocus: 'rgba(136, 192, 208, 0.4)',
      codeBg: 'rgba(59, 66, 82, 0.5)',
      codeBlockBg: 'rgba(46, 52, 64, 1)',
      quoteBorder: 'rgba(143, 188, 187, 0.5)',
      link: '#88c0d0',
    }
  },

  gruvboxDark: {
    id: 'gruvboxDark',
    name: 'Gruvbox Dark',
    colors: {
      bg: '#282828',
      bgSecondary: '#3c3836',
      bgTertiary: '#1d2021',
      text: 'rgba(235, 219, 178, 1)',
      textSecondary: 'rgba(213, 196, 161, 0.9)',
      textMuted: 'rgba(168, 153, 132, 0.8)',
      border: 'rgba(80, 73, 69, 1)',
      borderLight: 'rgba(80, 73, 69, 0.5)',
      scrollbar: 'rgba(80, 73, 69, 1)',
      scrollbarTrack: 'rgba(60, 56, 54, 0.5)',
      columnBg: 'rgba(60, 56, 54, 0.5)',
      columnBgAlt: 'rgba(60, 56, 54, 0.7)',
      columnHover: 'rgba(184, 187, 38, 0.1)',
      headerBg: 'rgba(60, 56, 54, 0.8)',
      inputBg: 'rgba(60, 56, 54, 0.6)',
      inputBorder: 'rgba(102, 92, 84, 0.6)',
      inputFocus: 'rgba(184, 187, 38, 0.3)',
      codeBg: 'rgba(50, 48, 47, 1)',
      codeBlockBg: 'rgba(29, 32, 33, 1)',
      quoteBorder: 'rgba(184, 187, 38, 0.5)',
      link: '#83a598',
    }
  },

  monokai: {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      bg: '#272822',
      bgSecondary: '#3e3d32',
      bgTertiary: '#1e1f1c',
      text: 'rgba(248, 248, 242, 1)',
      textSecondary: 'rgba(248, 248, 242, 0.85)',
      textMuted: 'rgba(117, 113, 94, 1)',
      border: 'rgba(73, 72, 62, 1)',
      borderLight: 'rgba(73, 72, 62, 0.5)',
      scrollbar: 'rgba(117, 113, 94, 1)',
      scrollbarTrack: 'rgba(62, 61, 50, 0.5)',
      columnBg: 'rgba(62, 61, 50, 0.5)',
      columnBgAlt: 'rgba(62, 61, 50, 0.7)',
      columnHover: 'rgba(230, 219, 116, 0.08)',
      headerBg: 'rgba(62, 61, 50, 0.8)',
      inputBg: 'rgba(62, 61, 50, 0.6)',
      inputBorder: 'rgba(117, 113, 94, 0.5)',
      inputFocus: 'rgba(230, 219, 116, 0.3)',
      codeBg: 'rgba(39, 40, 34, 1)',
      codeBlockBg: 'rgba(30, 31, 28, 1)',
      quoteBorder: 'rgba(166, 226, 46, 0.5)',
      link: '#66d9ef',
    }
  },

  githubLight: {
    id: 'githubLight',
    name: 'GitHub Light',
    colors: {
      bg: '#ffffff',
      bgSecondary: '#f6f8fa',
      bgTertiary: '#ffffff',
      text: 'rgba(36, 41, 47, 1)',
      textSecondary: 'rgba(87, 96, 106, 1)',
      textMuted: 'rgba(101, 109, 118, 0.8)',
      border: 'rgba(208, 215, 222, 1)',
      borderLight: 'rgba(234, 238, 242, 1)',
      scrollbar: 'rgba(208, 215, 222, 1)',
      scrollbarTrack: 'rgba(246, 248, 250, 0.5)',
      columnBg: 'rgba(246, 248, 250, 0.7)',
      columnBgAlt: 'rgba(234, 238, 242, 0.5)',
      columnHover: 'rgba(208, 215, 222, 0.15)',
      headerBg: 'rgba(246, 248, 250, 1)',
      inputBg: 'rgba(246, 248, 250, 1)',
      inputBorder: 'rgba(208, 215, 222, 1)',
      inputFocus: 'rgba(9, 105, 218, 0.3)',
      codeBg: 'rgba(246, 248, 250, 1)',
      codeBlockBg: 'rgba(246, 248, 250, 1)',
      quoteBorder: 'rgba(208, 215, 222, 1)',
      link: '#0969da',
    }
  },

  solarizedLight: {
    id: 'solarizedLight',
    name: 'Solarized Light',
    colors: {
      bg: '#fdf6e3',
      bgSecondary: '#eee8d5',
      bgTertiary: '#fdf6e3',
      text: 'rgba(101, 123, 131, 1)',
      textSecondary: 'rgba(88, 110, 117, 1)',
      textMuted: 'rgba(147, 161, 161, 0.8)',
      border: 'rgba(238, 232, 213, 1)',
      borderLight: 'rgba(253, 246, 227, 1)',
      scrollbar: 'rgba(147, 161, 161, 0.4)',
      scrollbarTrack: 'rgba(238, 232, 213, 0.3)',
      columnBg: 'rgba(238, 232, 213, 0.5)',
      columnBgAlt: 'rgba(238, 232, 213, 0.7)',
      columnHover: 'rgba(147, 161, 161, 0.08)',
      headerBg: 'rgba(238, 232, 213, 0.8)',
      inputBg: 'rgba(238, 232, 213, 0.6)',
      inputBorder: 'rgba(147, 161, 161, 0.3)',
      inputFocus: 'rgba(38, 139, 210, 0.3)',
      codeBg: 'rgba(238, 232, 213, 0.6)',
      codeBlockBg: 'rgba(238, 232, 213, 1)',
      quoteBorder: 'rgba(133, 153, 0, 0.4)',
      link: '#268bd2',
    }
  },

  gruvboxLight: {
    id: 'gruvboxLight',
    name: 'Gruvbox Light',
    colors: {
      bg: '#fbf1c7',
      bgSecondary: '#ebdbb2',
      bgTertiary: '#f9f5d7',
      text: 'rgba(60, 56, 54, 1)',
      textSecondary: 'rgba(80, 73, 69, 1)',
      textMuted: 'rgba(124, 111, 100, 0.8)',
      border: 'rgba(213, 196, 161, 1)',
      borderLight: 'rgba(235, 219, 178, 1)',
      scrollbar: 'rgba(168, 153, 132, 0.5)',
      scrollbarTrack: 'rgba(235, 219, 178, 0.3)',
      columnBg: 'rgba(235, 219, 178, 0.5)',
      columnBgAlt: 'rgba(213, 196, 161, 0.5)',
      columnHover: 'rgba(152, 151, 26, 0.08)',
      headerBg: 'rgba(235, 219, 178, 0.8)',
      inputBg: 'rgba(235, 219, 178, 0.6)',
      inputBorder: 'rgba(168, 153, 132, 0.4)',
      inputFocus: 'rgba(152, 151, 26, 0.3)',
      codeBg: 'rgba(235, 219, 178, 0.6)',
      codeBlockBg: 'rgba(235, 219, 178, 1)',
      quoteBorder: 'rgba(152, 151, 26, 0.5)',
      link: '#076678',
    }
  },
};

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });
}
