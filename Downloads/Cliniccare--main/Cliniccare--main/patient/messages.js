/* messages.js */
document.addEventListener('DOMContentLoaded', function () {

  /* ── INBOX SWITCHING ── */
  var inboxItems = document.querySelectorAll('.inbox-item');
  var messages = document.querySelectorAll('.message-bubble');
  var threadAvatar = document.getElementById('threadAvatar');
  var threadSender = document.getElementById('threadSender');
  var threadDate = document.getElementById('threadDate');

  var avatarMap = { clinic: 'CL', 'dr-chen': 'EC', billing: 'BL', lab: 'LB' };
  var senderMap = { clinic: 'Clinic', 'dr-chen': 'Dr. Emily Chen', billing: 'Billing', lab: 'Lab Team' };
  var dateMap = { clinic: 'Today', 'dr-chen': 'Yesterday', billing: 'Jun 30', lab: 'Jun 15' };

  inboxItems.forEach(function (item) {
    item.addEventListener('click', function () {
      inboxItems.forEach(function (i) { i.classList.remove('active'); });
      item.classList.add('active');
      item.querySelector('.unread-dot')?.remove();

      var msgId = item.dataset.msg;
      messages.forEach(function (msg) { msg.classList.add('hidden'); });
      var activeMsg = document.getElementById('msg-' + msgId);
      if (activeMsg) activeMsg.classList.remove('hidden');

      if (threadAvatar) threadAvatar.textContent = avatarMap[msgId];
      if (threadSender) threadSender.textContent = senderMap[msgId];
      if (threadDate) threadDate.textContent = dateMap[msgId];
    });
  });

  /* ── REPLY ── */
  var replyText = document.getElementById('replyText');
  var sendReply = document.getElementById('sendReply');
  var threadBody = document.getElementById('threadBody');

  if (sendReply) {
    sendReply.addEventListener('click', function () {
      var text = replyText.value.trim();
      if (!text) return;

      var bubble = document.createElement('div');
      bubble.className = 'message-bubble sent';
      bubble.innerHTML = '<p>' + text + '</p><span class="msg-time">Just now</span>';
      threadBody.appendChild(bubble);
      replyText.value = '';
      threadBody.scrollTop = threadBody.scrollHeight;
    });
  }

  if (replyText) {
    replyText.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendReply.click();
      }
    });
  }

  /* ── COMPOSE MODAL ── */
  var modal = document.getElementById('composeModal');
  var openBtn = document.getElementById('openComposeModal');
  var closeBtn = document.getElementById('closeComposeModal');
  var cancelBtn = document.getElementById('cancelCompose');
  var form = document.getElementById('composeForm');

  function openModal() { modal.classList.add('open'); }
  function closeModal() { modal.classList.remove('open'); form.reset(); }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      closeModal();
      // In real app, send message to server
    });
  }

  /* ── SEARCH ── */
  var search = document.getElementById('msgSearch');
  if (search) {
    search.addEventListener('input', function () {
      var q = this.value.toLowerCase();
      inboxItems.forEach(function (item) {
        var text = item.textContent.toLowerCase();
        item.style.display = (q.length > 0 && !text.includes(q)) ? 'none' : 'flex';
      });
    });
  }
});