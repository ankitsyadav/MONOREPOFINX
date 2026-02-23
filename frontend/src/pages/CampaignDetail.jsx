import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Grid, Divider,
  LinearProgress, Skeleton, Button, IconButton, Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getCampaignById } from '../api/campaigns.js';
import { useSnackbar } from '../context/SnackbarContext.jsx';
import { formatDate, statusColor, recipientStatusColor } from '../utils/formatters.js';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = () => {
    setLoading(true);
    getCampaignById(id)
      .then(({ data }) => setCampaign(data))
      .catch(() => showSnackbar('Failed to load campaign', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaign(); }, [id]);

  const deliveryRate = campaign?.totalRecipients
    ? ((campaign.deliveredCount / campaign.totalRecipients) * 100).toFixed(1)
    : 0;

  const recipientColumns = [
    { field: 'phoneNumber', headerName: 'Phone Number', flex: 1, minWidth: 150 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: ({ value }) => <Chip label={value} size="small" color={recipientStatusColor(value)} />,
    },
    { field: 'whatsappMessageId', headerName: 'Message ID', flex: 1, minWidth: 200 },
    {
      field: 'errorMessage', headerName: 'Error', flex: 1,
      renderCell: ({ value }) => value ? <Tooltip title={value}><span style={{ color: '#f44336' }}>{value.slice(0, 40)}…</span></Tooltip> : '—',
    },
    { field: 'updatedAt', headerName: 'Updated At', width: 180, renderCell: ({ value }) => formatDate(value) },
  ];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!campaign) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate('/campaigns')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">{campaign.name}</Typography>
          <Typography variant="body2" color="text.secondary">Campaign Details & Recipients</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchCampaign}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Campaign Info</Typography>
                <Chip label={campaign.status} color={statusColor(campaign.status)} />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="body2">{formatDate(campaign.createdAt)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Scheduled At</Typography>
                  <Typography variant="body2">{formatDate(campaign.scheduledAt)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Message</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, whiteSpace: 'pre-wrap' }}>
                    {campaign.message}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Delivery Stats</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'Total Recipients', value: campaign.totalRecipients, color: '#9c27b0' },
                { label: 'Sent', value: campaign.sentCount, color: '#2196f3' },
                { label: 'Delivered', value: campaign.deliveredCount, color: '#25D366' },
                { label: 'Read', value: campaign.readCount, color: '#128C7E' },
                { label: 'Failed', value: campaign.failedCount, color: '#f44336' },
              ].map((stat) => (
                <Box key={stat.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2 }}>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="caption" color="text.secondary">Delivery Rate</Typography>
              <LinearProgress
                variant="determinate"
                value={parseFloat(deliveryRate)}
                sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
              />
              <Typography variant="body2" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>{deliveryRate}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recipients ({campaign.recipients?.length})</Typography>
          <Box sx={{ mt: 1 }}>
            <DataGrid
              rows={campaign.recipients || []}
              columns={recipientColumns}
              autoHeight
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
              sx={{ border: 'none' }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
