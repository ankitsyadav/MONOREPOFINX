import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import CampaignIcon from '@mui/icons-material/Campaign';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getDashboardStats } from '../api/dashboard.js';
import { useSnackbar } from '../context/SnackbarContext.jsx';
import { formatDate, statusColor } from '../utils/formatters.js';

const COLORS = { delivered: '#25D366', read: '#128C7E', failed: '#f44336', pending: '#ff9800' };

export default function Dashboard() {
  const { showSnackbar } = useSnackbar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(({ data }) => setStats(data))
      .catch(() => showSnackbar('Failed to load statistics', 'error'))
      .finally(() => setLoading(false));
  }, [showSnackbar]);

  const statCards = stats
    ? [
        { title: 'Total Campaigns', value: stats.totalCampaigns, icon: <CampaignIcon />, color: '#3f51b5' },
        { title: 'Total Messages', value: stats.totalMessages, icon: <MessageIcon />, color: '#9c27b0' },
        { title: 'Delivery Rate', value: `${stats.deliveryRate}%`, icon: <CheckCircleIcon />, color: '#25D366' },
        { title: 'Read Rate', value: `${stats.readRate}%`, icon: <DoneAllIcon />, color: '#128C7E' },
        { title: 'Failed Rate', value: `${stats.failedRate}%`, icon: <ErrorIcon />, color: '#f44336' },
      ]
    : [];

  const pieData = stats
    ? [
        { name: 'Delivered', value: stats.deliveredCount },
        { name: 'Read', value: stats.readCount },
        { name: 'Failed', value: stats.failedCount },
        { name: 'Sent (Pending)', value: Math.max(0, stats.sentCount - stats.deliveredCount) },
      ].filter((d) => d.value > 0)
    : [];

  const barData = stats?.recentCampaigns?.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    Sent: c.sentCount,
    Delivered: c.deliveredCount,
    Read: c.readCount,
    Failed: c.failedCount,
  })) ?? [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Campaign performance overview
      </Typography>

      <Grid container spacing={3} mb={3}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
              </Grid>
            ))
          : statCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.title}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {card.title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ color: card.color }}>
                          {card.value}
                        </Typography>
                      </Box>
                      <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: `${card.color}22` }}>
                        <Box sx={{ color: card.color }}>{card.icon}</Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: 340 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Message Breakdown</Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={260} />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[entry.name.toLowerCase().split(' ')[0]] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                  <Typography color="text.secondary">No data yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: 340 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Campaign Performance</Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={260} />
              ) : barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Sent" fill="#9c27b0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Delivered" fill="#25D366" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Read" fill="#128C7E" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Failed" fill="#f44336" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                  <Typography color="text.secondary">No campaigns yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent Campaigns</Typography>
          {loading ? (
            <Skeleton variant="rectangular" height={200} />
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>Sent</strong></TableCell>
                    <TableCell align="right"><strong>Delivered</strong></TableCell>
                    <TableCell align="right"><strong>Read</strong></TableCell>
                    <TableCell align="right"><strong>Failed</strong></TableCell>
                    <TableCell><strong>Created</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.recentCampaigns?.length ? (
                    stats.recentCampaigns.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>
                          <Chip label={c.status} size="small" color={statusColor(c.status)} />
                        </TableCell>
                        <TableCell align="right">{c.totalRecipients}</TableCell>
                        <TableCell align="right">{c.sentCount}</TableCell>
                        <TableCell align="right">{c.deliveredCount}</TableCell>
                        <TableCell align="right">{c.readCount}</TableCell>
                        <TableCell align="right">{c.failedCount}</TableCell>
                        <TableCell>{formatDate(c.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No campaigns yet. Create your first one!</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
