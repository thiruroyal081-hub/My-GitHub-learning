const dialog = document.querySelector('#storyDialog');
document.querySelector('#playStory').addEventListener('click', () => dialog.showModal());
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
const start = new Date(); start.setDate(start.getDate() + 9); start.setHours(18, 30, 0, 0);
function updateCountdown() { const remaining = Math.max(0, start - new Date()); const parts = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60]; ['days', 'hours', 'mins'].forEach((id, index) => document.querySelector('#' + id).textContent = String(parts[index]).padStart(2, '0')); }
updateCountdown(); setInterval(updateCountdown, 1000);
