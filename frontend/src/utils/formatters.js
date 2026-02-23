export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const statusColor = (status) => {
  const map = {
    DRAFT: 'default',
    SCHEDULED: 'info',
    PROCESSING: 'warning',
    COMPLETED: 'success',
    FAILED: 'error',
    PENDING: 'default',
    SENT: 'info',
    DELIVERED: 'success',
    READ: 'success',
  };
  return map[status] || 'default';
};

export const recipientStatusColor = (status) => {
  const map = {
    PENDING: 'default',
    SENT: 'info',
    DELIVERED: 'success',
    READ: 'success',
    FAILED: 'error',
  };
  return map[status] || 'default';
};
