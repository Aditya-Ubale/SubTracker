// Format currency to INR
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Calculate days until date
export const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Get status color based on days remaining
export const getStatusColor = (daysRemaining) => {
  if (daysRemaining === null) return 'default';
  if (daysRemaining <= 3) return 'error';
  if (daysRemaining <= 7) return 'warning';
  return 'success';
};

// Get category icon
export const getCategoryIcon = (category) => {
  const icons = {
    Streaming: '🎬',
    Music: '🎵',
    AI: '🤖',
    Productivity: '💼',
    Gaming: '🎮',
    News: '📰',
    Fitness: '💪',
    Education: '📚',
  };
  return icons[category] || '📦';
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};