// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true, // allows easy theming with CSS vars
  palette: {
    mode: 'dark',
    primary: { main: '#22c55e' }, // emerald accent
    secondary: { main: '#94a3b8' }, // slate-ish
    background: {
      default: '#0b0f14', // near-black blue
      paper: '#0f141a',
    },
    divider: 'rgba(255,255,255,0.08)',
    text: {
      primary: '#e5e7eb',
      secondary: '#94a3b8',
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: `"Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial`,
    h1: { fontWeight: 700, letterSpacing: -0.5 },
    h2: { fontWeight: 700, letterSpacing: -0.4 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.2 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(1200px 600px at 0% 0%, rgba(34,197,94,0.06), transparent 60%), radial-gradient(800px 400px at 100% 0%, rgba(34,197,94,0.05), transparent 60%)',
        },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': {
          background: '#22c55e',
          borderRadius: 999,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00))',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12 },
        containedPrimary: {
          boxShadow: '0 6px 16px rgba(34,197,94,0.25)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.03)',
          '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
          '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
        },
        input: { paddingTop: 12, paddingBottom: 12 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
        },
      },
    },
  },
});

export default theme;
