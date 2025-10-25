// web/app/chat/page.tsx
import Connect from '../../components/Connect';
import ChatPanel from '../../components/ChatPanel';

// MUI
import {
  Container,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
  Box,
} from '@mui/material';

export default function ChatPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ gap: 2 }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            PQC Chat (E2EE)
          </Typography>
          <Box>
            <Connect />
          </Box>
        </Stack>

        <Card>
          <CardContent sx={{ py: 1.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                End-to-end encrypted via ML-KEM (Kyber) key exchange + AES-GCM. Only ciphertext is stored server-side.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip size="small" variant="outlined" label="ML-KEM (Kyber)" />
                <Chip size="small" variant="outlined" label="AES-GCM" />
                <Chip size="small" variant="outlined" label="E2EE" />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <ChatPanel />
      </Stack>
    </Container>
  );
}
