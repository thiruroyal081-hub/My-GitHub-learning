const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menu.classList.toggle('is-open', !open);
});

document.querySelectorAll('.nav-links a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
}));

const openingAarti = new Date();
openingAarti.setDate(openingAarti.getDate() + 9);
openingAarti.setHours(18, 30, 0, 0);
function updateCountdown() {
  const remaining = Math.max(0, openingAarti - new Date());
  const values = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60];
  ['days', 'hours', 'minutes'].forEach((id, index) => {
    document.getElementById(id).textContent = String(values[index]).padStart(2, '0');
  });
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

document.querySelector('#join-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const details = new FormData(form);
  const name = details.get('name').trim();
  const help = details.get('help');
  const subject = encodeURIComponent(`Ganesh Utsav participation — ${name}`);
  const body = encodeURIComponent(`Namaste!\n\nMy name is ${name}.\nI would like to: ${help}.\n\nThank you.`);
  document.querySelector('#form-message').textContent = 'Opening your email app to send your request.';
  window.location.href = `mailto:ganeshutsav@example.com?subject=${subject}&body=${body}`;
});

const donationStorageKey = 'ganesh-utsav-donations';
const initialDonations = [
  { id: 'seed-1', date: '2026-09-02', donorName: 'Lakshmi Family', purpose: 'Festival fund', reference: 'Cash receipt #001', amount: 5000 },
  { id: 'seed-2', date: '2026-09-04', donorName: 'Ravi Kumar', purpose: 'Decoration', reference: 'UPI', amount: 2500 },
  { id: 'seed-3', date: '2026-09-06', donorName: 'Village Youth Club', purpose: 'Annadanam', reference: 'Bank transfer', amount: 10000 },
];

function getDonations() {
  const saved = localStorage.getItem(donationStorageKey);
  return saved ? JSON.parse(saved) : initialDonations;
}

function saveDonations(donations) {
  localStorage.setItem(donationStorageKey, JSON.stringify(donations));
}

function formatRupees(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderDonations() {
  const donations = getDonations().sort((first, second) => new Date(second.date) - new Date(first.date));
  const total = donations.reduce((sum, donation) => sum + donation.amount, 0);
  const latest = donations[0];
  document.querySelector('#total-donations').textContent = formatRupees(total);
  document.querySelector('#donation-count').textContent = donations.length;
  document.querySelector('#latest-donation').textContent = latest ? formatRupees(latest.amount) : '—';
  document.querySelector('#latest-date').textContent = latest ? `${latest.donorName} · ${formatDate(latest.date)}` : 'No donation recorded yet';
  document.querySelector('#donation-records').innerHTML = donations.map((donation) => `
    <tr><td>${formatDate(donation.date)}</td><td>${escapeHtml(donation.donorName)}</td><td>${escapeHtml(donation.purpose)}</td><td>${escapeHtml(donation.reference || '—')}</td><td class="amount">${formatRupees(donation.amount)}</td></tr>
  `).join('');
}

document.querySelector('#donation-date').valueAsDate = new Date();
document.querySelector('#donation-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const donations = getDonations();
  donations.push({ id: crypto.randomUUID(), donorName: form.get('donorName').trim(), amount: Number(form.get('amount')), date: form.get('date'), purpose: form.get('purpose'), reference: form.get('reference').trim() });
  saveDonations(donations);
  event.currentTarget.reset();
  document.querySelector('#donation-date').valueAsDate = new Date();
  document.querySelector('#donation-message').textContent = 'Donation record saved successfully.';
  renderDonations();
});

document.querySelector('#export-donations').addEventListener('click', () => {
  const rows = [['Date', 'Donor', 'Purpose', 'Reference', 'Amount (INR)'], ...getDonations().map((donation) => [donation.date, donation.donorName, donation.purpose, donation.reference, donation.amount])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'ganesh-utsav-donations.csv';
  link.click();
  URL.revokeObjectURL(link.href);
});

renderDonations();

// Temple donation repository: replace these localStorage functions with Flask/SQLite API calls later.
const templeDonationStorageKey = 'sri-ganapathi-temple-donations-v1';
const templeDonationSeeds = [
  { receiptNumber: 'TEMP-2026-0001', donorName: 'Srinivas Family', amount: 5100, purpose: 'General temple fund', date: '2026-01-14', time: '09:30', paymentMethod: 'UPI', transactionId: 'UPIREF20264821', notes: '', status: 'Verified' },
  { receiptNumber: 'TEMP-2026-0002', donorName: 'Anitha Devi', amount: 2500, purpose: 'Daily pooja', date: '2026-02-02', time: '18:15', paymentMethod: 'Cash', transactionId: 'CASHREC0202', notes: 'Cash received at temple office', status: 'Verified' },
  { receiptNumber: 'TEMP-2026-0003', donorName: 'Ramesh Kumar', amount: 10000, purpose: 'Temple renovation', date: '2026-03-11', time: '11:45', paymentMethod: 'Bank transfer', transactionId: 'BANKTXN5689', notes: '', status: 'Pending' },
  { receiptNumber: 'TEMP-2025-0001', donorName: 'Village Devotees Group', amount: 15000, purpose: 'Festival seva', date: '2025-09-05', time: '16:00', paymentMethod: 'UPI', transactionId: 'UPI2025GROUP7418', notes: '', status: 'Verified' },
];

const templeDonationRepository = {
  getAll() {
    try {
      const saved = localStorage.getItem(templeDonationStorageKey);
      return saved ? JSON.parse(saved) : templeDonationSeeds;
    } catch {
      return templeDonationSeeds;
    }
  },
  save(records) {
    localStorage.setItem(templeDonationStorageKey, JSON.stringify(records));
  },
};

function maskTransactionId(transactionId) {
  const value = String(transactionId || '');
  return value.length > 4 ? `XXXX${value.slice(-4)}` : 'XXXX';
}

function templeDateTime(record) {
  return `${formatDate(record.date)} · ${record.time}`;
}

function nextReceiptNumber(date, records) {
  const year = new Date(`${date}T00:00:00`).getFullYear();
  const prefix = `TEMP-${year}-`;
  const lastNumber = records.reduce((highest, record) => {
    if (!record.receiptNumber.startsWith(prefix)) return highest;
    return Math.max(highest, Number(record.receiptNumber.slice(prefix.length)) || 0);
  }, 0);
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
}

function templeStatusClass(status) {
  return status.toLowerCase();
}

function getTempleFilters() {
  return { search: document.querySelector('#temple-search').value.trim().toLowerCase(), year: document.querySelector('#temple-year-filter').value };
}

function filteredTempleDonations() {
  const filters = getTempleFilters();
  return templeDonationRepository.getAll().filter((record) => {
    const searchable = [record.receiptNumber, record.donorName, record.date, record.transactionId].join(' ').toLowerCase();
    return (filters.year === 'all' || record.date.startsWith(filters.year)) && (!filters.search || searchable.includes(filters.search));
  }).sort((first, second) => `${second.date}${second.time}`.localeCompare(`${first.date}${first.time}`));
}

function renderTempleYearFilter(records) {
  const selector = document.querySelector('#temple-year-filter');
  const currentValue = selector.value || 'all';
  const years = [...new Set([...['2026', '2027', '2028', '2029'], ...records.map((record) => record.date.slice(0, 4))])].sort();
  selector.innerHTML = `<option value="all">All years</option>${years.map((year) => `<option value="${year}">${year}</option>`).join('')}`;
  selector.value = years.includes(currentValue) || currentValue === 'all' ? currentValue : 'all';
}

function renderTempleDashboard(records) {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const verified = records.filter((record) => record.status === 'Verified');
  const sum = (list) => list.reduce((total, record) => total + Number(record.amount), 0);
  document.querySelector('#temple-total').textContent = formatRupees(sum(verified));
  document.querySelector('#temple-count').textContent = records.length;
  document.querySelector('#temple-month').textContent = formatRupees(sum(verified.filter((record) => record.date.startsWith(currentMonth))));
  document.querySelector('#temple-year').textContent = formatRupees(sum(verified.filter((record) => record.date.startsWith(currentYear))));
  document.querySelector('#temple-pending').textContent = records.filter((record) => record.status === 'Pending').length;
  document.querySelector('#temple-verified').textContent = verified.length;
}

function renderTempleRecords() {
  const allRecords = templeDonationRepository.getAll();
  renderTempleYearFilter(allRecords);
  const records = filteredTempleDonations();
  renderTempleDashboard(allRecords);
  document.querySelector('#temple-admin-records').innerHTML = records.length ? records.map((record) => `
    <tr><td>${escapeHtml(record.receiptNumber)}</td><td><strong>${escapeHtml(record.donorName)}</strong><br><small>${templeDateTime(record)}</small></td><td>${escapeHtml(record.purpose)}</td><td>${escapeHtml(record.paymentMethod)}<br><small>${maskTransactionId(record.transactionId)}</small></td><td><span class="status ${templeStatusClass(record.status)}">${escapeHtml(record.status)}</span></td><td class="amount">${formatRupees(record.amount)}</td><td><div class="record-actions">${record.status !== 'Verified' ? `<button class="record-action verify" data-action="verify" data-receipt="${record.receiptNumber}" type="button">Verify</button>` : ''}${record.status === 'Pending' ? `<button class="record-action reject" data-action="reject" data-receipt="${record.receiptNumber}" type="button">Reject</button>` : ''}${record.status === 'Verified' ? `<button class="record-action receipt" data-action="receipt" data-receipt="${record.receiptNumber}" type="button">Receipt</button>` : ''}</div></td></tr>
  `).join('') : '<tr><td colspan="7">No donation records match this search.</td></tr>';
  const verifiedRecords = allRecords.filter((record) => record.status === 'Verified').sort((first, second) => `${second.date}${second.time}`.localeCompare(`${first.date}${first.time}`));
  document.querySelector('#temple-public-records').innerHTML = verifiedRecords.length ? verifiedRecords.map((record) => `
    <tr><td>${escapeHtml(record.receiptNumber)}</td><td>${escapeHtml(record.donorName)}</td><td>${escapeHtml(record.purpose)}</td><td>${templeDateTime(record)}</td><td>${escapeHtml(record.paymentMethod)}</td><td>${maskTransactionId(record.transactionId)}</td><td><span class="status verified">Verified</span></td><td class="amount">${formatRupees(record.amount)}</td></tr>
  `).join('') : '<tr><td colspan="8">Verified temple donations will appear here.</td></tr>';
  renderTempleReports(allRecords);
}

function renderTempleReports(records) {
  const years = ['2026', '2027', '2028', '2029'];
  records.forEach((record) => { if (!years.includes(record.date.slice(0, 4))) years.push(record.date.slice(0, 4)); });
  const activeYear = document.querySelector('#temple-year-filter').value === 'all' ? String(new Date().getFullYear()) : document.querySelector('#temple-year-filter').value;
  const verified = records.filter((record) => record.status === 'Verified');
  document.querySelector('#temple-year-cards').innerHTML = years.sort().map((year) => {
    const total = verified.filter((record) => record.date.startsWith(year)).reduce((sum, record) => sum + record.amount, 0);
    return `<button class="year-card ${year === activeYear ? 'active' : ''}" data-year="${year}" type="button"><strong>${year}</strong><span>${formatRupees(total)} verified</span></button>`;
  }).join('');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  document.querySelector('#monthly-totals').innerHTML = monthNames.map((month, index) => {
    const prefix = `${activeYear}-${String(index + 1).padStart(2, '0')}`;
    const total = verified.filter((record) => record.date.startsWith(prefix)).reduce((sum, record) => sum + record.amount, 0);
    return `<article><span>${month} ${activeYear}</span><strong>${formatRupees(total)}</strong></article>`;
  }).join('');
}

function openReceipt(receiptNumber) {
  const record = templeDonationRepository.getAll().find((item) => item.receiptNumber === receiptNumber && item.status === 'Verified');
  if (!record) return;
  const details = [['Receipt Number', record.receiptNumber], ['Donor Name', record.donorName], ['Amount', formatRupees(record.amount)], ['Purpose', record.purpose], ['Date', formatDate(record.date)], ['Time', record.time], ['Payment Method', record.paymentMethod], ['Masked Transaction ID', maskTransactionId(record.transactionId)], ['Status', 'PAYMENT VERIFIED']];
  document.querySelector('#receipt-details').innerHTML = details.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
  document.querySelector('#donation-receipt').showModal();
}

const templeDate = document.querySelector('#temple-date');
const templeTime = document.querySelector('#temple-time');
templeDate.valueAsDate = new Date();
templeTime.value = new Date().toTimeString().slice(0, 5);
document.querySelector('#temple-donation-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const records = templeDonationRepository.getAll();
  records.push({ receiptNumber: nextReceiptNumber(form.get('date'), records), donorName: form.get('donorName').trim(), amount: Number(form.get('amount')), purpose: form.get('purpose'), date: form.get('date'), time: form.get('time'), paymentMethod: form.get('paymentMethod'), transactionId: form.get('transactionId').trim(), notes: form.get('notes').trim(), status: 'Pending' });
  templeDonationRepository.save(records);
  event.currentTarget.reset();
  templeDate.valueAsDate = new Date();
  templeTime.value = new Date().toTimeString().slice(0, 5);
  document.querySelector('#temple-form-message').textContent = 'Donation added as pending. Verify the payment before publishing it.';
  renderTempleRecords();
});

document.querySelector('#temple-search').addEventListener('input', renderTempleRecords);
document.querySelector('#temple-year-filter').addEventListener('change', renderTempleRecords);
document.querySelector('#temple-admin-records').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'receipt') return openReceipt(button.dataset.receipt);
  const records = templeDonationRepository.getAll();
  const record = records.find((item) => item.receiptNumber === button.dataset.receipt);
  if (record) { record.status = button.dataset.action === 'verify' ? 'Verified' : 'Rejected'; templeDonationRepository.save(records); renderTempleRecords(); }
});
document.querySelector('#temple-year-cards').addEventListener('click', (event) => {
  const card = event.target.closest('[data-year]');
  if (!card) return;
  document.querySelector('#temple-year-filter').value = card.dataset.year;
  renderTempleRecords();
});
document.querySelector('#export-temple-donations').addEventListener('click', () => {
  const rows = [['Receipt Number', 'Donor Name', 'Amount (INR)', 'Purpose', 'Date', 'Time', 'Payment Method', 'Masked Transaction ID', 'Verification Status'], ...templeDonationRepository.getAll().map((record) => [record.receiptNumber, record.donorName, record.amount, record.purpose, record.date, record.time, record.paymentMethod, maskTransactionId(record.transactionId), record.status])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = 'sri-ganapathi-temple-donations.csv';
  link.click();
  URL.revokeObjectURL(link.href);
});
document.querySelector('#close-receipt').addEventListener('click', () => document.querySelector('#donation-receipt').close());
document.querySelector('#print-receipt').addEventListener('click', () => window.print());
document.querySelector('#save-receipt').addEventListener('click', () => window.print());
renderTempleRecords();

document.querySelector('a[href="#donation-receipt"]').addEventListener('click', (event) => {
  event.preventDefault();
  const latestVerified = templeDonationRepository.getAll().filter((record) => record.status === 'Verified').sort((first, second) => `${second.date}${second.time}`.localeCompare(`${first.date}${first.time}`))[0];
  if (latestVerified) openReceipt(latestVerified.receiptNumber);
});
