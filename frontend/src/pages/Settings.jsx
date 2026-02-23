import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, Divider, Alert, Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import * as credentialApi from '../api/credentials.js';
import { useSnackbar } from '../context/SnackbarContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [form, setForm] = useState({ wabaId: '', phoneNumberId: '', accessToken: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCredential, setHasCredential] = useState(false);

  useEffect(() => {
    credentialApi.getCredential()
      .then(({ data }) => {
        setForm((prev) => ({ ...prev, wabaId: data.wabaId, phoneNumberId: data.phoneNumberId }));
        setHasCredential(true);
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          showSnackbar('Failed to load credentials', 'error');
        }
      })
      .finally(() => setLoading(false));
  }, [showSnackbar]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.accessToken && !hasCredential) {
      showSnackbar('Access token is required', 'warning');
      return;
    }
    setSaving(true);
    try {
      await credentialApi.upsertCredential({
        wabaId: form.wabaId,
        phoneNumberId: form.phoneNumberId,
        accessToken: form.accessToken || undefined,
      });
      showSnackbar('Credentials saved successfully!', 'success');
      setHasCredential(true);
      setForm((prev) => ({ ...prev, accessToken: '' }));
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to save credentials', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage your WhatsApp Business API credentials
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Account Info</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight={500}>{user?.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{user?.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Role</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{user?.role}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>WhatsApp API Credentials</Typography>
              <Divider sx={{ mb: 2 }} />

              {!loading && (
                <Alert severity={hasCredential ? 'success' : 'info'} sx={{ mb: 2 }}>
                  {hasCredential
                    ? 'Credentials are configured. Enter a new access token only to update it.'
                    : 'No credentials configured yet. Add your WABA credentials to start sending campaigns.'}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="WABA ID"
                  name="wabaId"
                  value={form.wabaId}
                  onChange={handleChange}
                  required
                  fullWidth
                  placeholder="e.g. 123456789012345"
                  helperText="Your WhatsApp Business Account ID from Meta Business Manager"
                />
                <TextField
                  label="Phone Number ID"
                  name="phoneNumberId"
                  value={form.phoneNumberId}
                  onChange={handleChange}
                  required
                  fullWidth
                  placeholder="e.g. 987654321098765"
                  helperText="The Phone Number ID from your WhatsApp Business API setup"
                />
                <TextField
                  label={hasCredential ? 'New Access Token (leave blank to keep existing)' : 'Access Token'}
                  name="accessToken"
                  value={form.accessToken}
                  onChange={handleChange}
                  required={!hasCredential}
                  fullWidth
                  type="password"
                  placeholder="Your permanent or temporary access token"
                  helperText="Token is encrypted at rest using AES-256"
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || loading}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {saving ? 'Saving...' : 'Save Credentials'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Webhook Configuration</Typography>
              <Divider sx={{ mb: 2 }} />
              <Alert severity="info">
                Configure this webhook URL in your Meta App Dashboard to receive delivery status updates:
              </Alert>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, fontFamily: 'monospace', fontSize: 14 }}>
                POST {import.meta.env.VITE_API_URL || 'http://localhost:5000'}/webhook/meta
              </Box>
              <Typography variant="body2" color="text.secondary" mt={1.5}>
                Set the <strong>Verify Token</strong> in your backend <code>WEBHOOK_VERIFY_TOKEN</code> env variable and match it in your Meta App settings.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
