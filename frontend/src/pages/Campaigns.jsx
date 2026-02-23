import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, LinearProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import dayjs from 'dayjs';
import * as campaignApi from '../api/campaigns.js';
import { useSnackbar } from '../context/SnackbarContext.jsx';
import { formatDate, statusColor } from '../utils/formatters.js';

const DEFAULT_FORM = { name: '', message: '', scheduledAt: null, recipientsText: '' };

export default function Campaigns() {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = useCallback(() => {
    setLoading(true);
    campaignApi.getCampaigns()
      .then(({ data }) => setCampaigns(data))
      .catch(() => showSnackbar('Failed to load campaigns', 'error'))
      .finally(() => setLoading(false));
  }, [showSnackbar]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleFormChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const recipients = form.recipientsText.split('\n').map((r) => r.trim()).filter(Boolean);
    if (!recipients.length) {
      showSnackbar('At least one recipient phone number is required', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await campaignApi.createCampaign({
        name: form.name,
        message: form.message,
        scheduledAt: form.scheduledAt ? form.scheduledAt.toISOString() : null,
        recipients,
      });
      showSnackbar('Campaign created successfully!', 'success');
      setModalOpen(false);
      setForm(DEFAULT_FORM);
      fetchCampaigns();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to create campaign', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await campaignApi.deleteCampaign(deleteId);
      showSnackbar('Campaign deleted', 'success');
      setDeleteId(null);
      fetchCampaigns();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to delete campaign', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    { field: 'name', headerName: 'Campaign Name', flex: 1, minWidth: 180 },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: ({ value }) => <Chip label={value} size="small" color={statusColor(value)} />,
    },
    { field: 'totalRecipients', headerName: 'Recipients', width: 110, type: 'number' },
    { field: 'sentCount', headerName: 'Sent', width: 90, type: 'number' },
    { field: 'deliveredCount', headerName: 'Delivered', width: 110, type: 'number' },
    { field: 'readCount', headerName: 'Read', width: 90, type: 'number' },
    { field: 'failedCount', headerName: 'Failed', width: 90, type: 'number' },
    {
      field: 'scheduledAt', headerName: 'Scheduled At', width: 180,
      renderCell: ({ value }) => formatDate(value),
    },
    {
      field: 'createdAt', headerName: 'Created At', width: 180,
      renderCell: ({ value }) => formatDate(value),
    },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => navigate(`/campaign/${row.id}`)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteId(row.id)} disabled={row.status === 'PROCESSING'}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4">Campaigns</Typography>
          <Typography variant="body2" color="text.secondary">Manage your WhatsApp broadcast campaigns</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
          New Campaign
        </Button>
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, overflow: 'hidden' }}>
        <DataGrid
          rows={campaigns}
          columns={columns}
          autoHeight
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ border: 'none', '& .MuiDataGrid-cell': { borderColor: 'divider' } }}
        />
      </Box>

      {/* Create Campaign Modal */}
      <Dialog open={modalOpen} onClose={() => !submitting && setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
            <TextField
              label="Campaign Name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Message"
              name="message"
              value={form.message}
              onChange={handleFormChange}
              required
              fullWidth
              multiline
              rows={4}
              helperText={`${form.message.length} characters`}
            />
            <DateTimePicker
              label="Schedule At (optional)"
              value={form.scheduledAt}
              onChange={(val) => setForm((p) => ({ ...p, scheduledAt: val }))}
              minDateTime={dayjs()}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              label="Recipients (one phone per line)"
              name="recipientsText"
              value={form.recipientsText}
              onChange={handleFormChange}
              required
              fullWidth
              multiline
              rows={5}
              placeholder="+919876543210&#10;+918765432109&#10;+917654321098"
              helperText={`${form.recipientsText.split('\n').filter((r) => r.trim()).length} recipients`}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : form.scheduledAt ? 'Schedule Campaign' : 'Create Draft'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => !deleting && setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Campaign?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone. All recipients and data will be deleted.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
