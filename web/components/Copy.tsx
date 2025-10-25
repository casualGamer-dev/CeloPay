'use client';

import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

export default function Copy({ value }: { value: string }) {
  const [ok, setOk] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setOk(true);
    setTimeout(() => setOk(false), 1200);
  };

  return (
    <Tooltip title={ok ? 'Copied' : 'Copy'} arrow>
      <IconButton
        size="small"
        onClick={handleCopy}
        sx={{
          transition: '0.2s',
        }}
      >
        {ok ? (
          <CheckCircleRoundedIcon fontSize="inherit" />
        ) : (
          <ContentCopyRoundedIcon fontSize="inherit" />
        )}
      </IconButton>
    </Tooltip>
  );
}
