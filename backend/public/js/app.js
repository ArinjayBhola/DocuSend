// DocuSend client-side utilities
document.addEventListener('DOMContentLoaded', () => {
  // Auto-dismiss alerts after 5 seconds
  document.querySelectorAll('[data-dismiss]').forEach(el => {
    setTimeout(() => el.remove(), 5000);
  });
});
