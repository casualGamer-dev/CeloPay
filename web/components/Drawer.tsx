'use client';

import { Drawer as MUIDrawer, AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <MUIDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>{children}</Box>
    </MUIDrawer>
  );
}
