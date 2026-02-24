const { nanoid } = require('nanoid');

function generateSlug(length = 10) {
  return nanoid(length);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
  if (!seconds || seconds < 1) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

const PLAN_LIMITS = {
  free: { documents: 5, viewsPerMonth: 100, workspaces: 0, teamSeats: 1, deals: 0, sessions: 0 },
  pro: { documents: 50, viewsPerMonth: Infinity, workspaces: 5, teamSeats: 1, deals: 5, sessions: 10 },
  business: { documents: Infinity, viewsPerMonth: Infinity, workspaces: Infinity, teamSeats: 10, deals: Infinity, sessions: Infinity },
};

function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

module.exports = {
  generateSlug,
  formatBytes,
  formatDuration,
  formatDate,
  timeAgo,
  getPlanLimits,
  PLAN_LIMITS,
};
