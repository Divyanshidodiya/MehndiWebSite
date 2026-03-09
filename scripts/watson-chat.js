/**
 * Watson Assistant Chatbot Widget
 * Self-contained widget for Diya Mehndi Arts
 * Direct frontend API calls to IBM Watson Assistant v2
 */
(function () {
  // ── Watson Configuration ──
  const WATSON_BASE_URL = 'https://api.au-syd.assistant.watson.cloud.ibm.com';
  const ASSISTANT_ID = 'c5fbef5e-fb21-4063-b796-361813dcf85f';
  const API_KEY = 'DlMVLHo1qUB_TWooYkwp1zqUtpPBucCu0Pu01YgLSW_5';
  const API_VERSION = '2023-06-15';

  let sessionId = null;
  let chatOpen = false;

  // ── Inject CSS ──
  const style = document.createElement('style');
  style.textContent = `
    /* Watson Chat Toggle Button */
    #watson-chat-toggle {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6b1210, #470604);
      border: 2px solid #fff;
      color: #fff;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    #watson-chat-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 24px rgba(0,0,0,0.45);
    }
    #watson-chat-toggle svg {
      width: 30px;
      height: 30px;
      fill: #fff;
    }

    /* Chat Window */
    #watson-chat-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 370px;
      max-width: calc(100vw - 32px);
      height: 520px;
      max-height: calc(100vh - 120px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10001;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    #watson-chat-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    /* Chat Header */
    #watson-chat-header {
      background: linear-gradient(135deg, #6b1210, #470604);
      color: #fff;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #watson-chat-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #watson-chat-header-info .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    #watson-chat-header-info .name {
      font-weight: 600;
      font-size: 15px;
    }
    #watson-chat-header-info .status {
      font-size: 12px;
      opacity: 0.8;
    }
    #watson-chat-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 22px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    #watson-chat-close:hover {
      opacity: 1;
    }

    /* Messages Area */
    #watson-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f7f3f0;
    }
    #watson-chat-messages::-webkit-scrollbar {
      width: 5px;
    }
    #watson-chat-messages::-webkit-scrollbar-thumb {
      background: #c4a394;
      border-radius: 3px;
    }

    .watson-msg {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.45;
      word-wrap: break-word;
      animation: watsonMsgIn 0.25s ease;
    }
    @keyframes watsonMsgIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .watson-msg.bot {
      background: #fff;
      color: #333;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .watson-msg.user {
      background: linear-gradient(135deg, #6b1210, #470604);
      color: #fff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .watson-msg.bot a {
      color: #6b1210;
      text-decoration: underline;
    }

    /* Typing Indicator */
    .watson-typing {
      display: flex;
      gap: 4px;
      padding: 10px 16px;
      align-self: flex-start;
      background: #fff;
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .watson-typing span {
      width: 7px;
      height: 7px;
      background: #999;
      border-radius: 50%;
      animation: watsonBounce 1.4s infinite;
    }
    .watson-typing span:nth-child(2) { animation-delay: 0.2s; }
    .watson-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes watsonBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* Input Area */
    #watson-chat-input-area {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border-top: 1px solid #e8e0dc;
      background: #fff;
      flex-shrink: 0;
    }
    #watson-chat-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 24px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      font-family: Arial, sans-serif;
      color: #333;
    }
    #watson-chat-input:focus {
      border-color: #6b1210;
    }
    #watson-chat-input::placeholder {
      color: #aaa;
    }
    #watson-chat-send {
      background: linear-gradient(135deg, #6b1210, #470604);
      border: none;
      color: #fff;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      margin-left: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, opacity 0.2s;
      flex-shrink: 0;
    }
    #watson-chat-send:hover {
      transform: scale(1.08);
    }
    #watson-chat-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    #watson-chat-send svg {
      width: 18px;
      height: 18px;
      fill: #fff;
    }

    /* Welcome message */
    .watson-welcome {
      text-align: center;
      color: #888;
      font-size: 13px;
      padding: 8px 0 4px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      #watson-chat-window {
        width: calc(100vw - 16px);
        height: calc(100vh - 100px);
        right: 8px;
        bottom: 80px;
        border-radius: 12px;
      }
      #watson-chat-toggle {
        width: 52px;
        height: 52px;
        bottom: 16px;
        right: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  // ── Build DOM ──
  // Toggle Button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'watson-chat-toggle';
  toggleBtn.title = 'Chat with us';
  toggleBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>`;
  document.body.appendChild(toggleBtn);

  // Chat Window
  const chatWindow = document.createElement('div');
  chatWindow.id = 'watson-chat-window';
  chatWindow.innerHTML = `
    <div id="watson-chat-header">
      <div id="watson-chat-header-info">
        <div class="avatar">🪷</div>
        <div>
          <div class="name">Diya Mehndi Arts</div>
          <div class="status">Online • Ask me anything!</div>
        </div>
      </div>
      <button id="watson-chat-close">&times;</button>
    </div>
    <div id="watson-chat-messages">
      <div class="watson-welcome">Powered by IBM Watson Assistant</div>
    </div>
    <div id="watson-chat-input-area">
      <input id="watson-chat-input" type="text" placeholder="Type your message..." autocomplete="off" />
      <button id="watson-chat-send" title="Send">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(chatWindow);

  // ── DOM References ──
  const messagesDiv = document.getElementById('watson-chat-messages');
  const inputField = document.getElementById('watson-chat-input');
  const sendBtn = document.getElementById('watson-chat-send');
  const closeBtn = document.getElementById('watson-chat-close');

  // ── Toggle Chat ──
  toggleBtn.addEventListener('click', function () {
    chatOpen = !chatOpen;
    if (chatOpen) {
      chatWindow.classList.add('open');
      inputField.focus();
      if (!sessionId) {
        createSession();
      }
    } else {
      chatWindow.classList.remove('open');
    }
  });

  closeBtn.addEventListener('click', function () {
    chatOpen = false;
    chatWindow.classList.remove('open');
  });

  // ── Send Message ──
  sendBtn.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    inputField.value = '';
    sendBtn.disabled = true;

    showTyping();
    sendToWatson(text);
  }

  // ── Append Message to Chat ──
  function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'watson-msg ' + sender;
    // Support basic HTML from Watson responses
    if (sender === 'bot') {
      msgDiv.innerHTML = text;
    } else {
      msgDiv.textContent = text;
    }
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return msgDiv;
  }

  // ── Typing Indicator ──
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'watson-typing';
    typing.id = 'watson-typing-indicator';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesDiv.appendChild(typing);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('watson-typing-indicator');
    if (el) el.remove();
  }

  // ── Watson API Helpers (direct calls) ──

  function getAuthHeader() {
    return 'Basic ' + btoa('apikey:' + API_KEY);
  }

  function createSession() {
    showTyping();

    fetch(WATSON_BASE_URL + '/v2/assistants/' + ASSISTANT_ID + '/sessions?version=' + API_VERSION, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Session creation failed: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        sessionId = data.session_id;
        removeTyping();
        // Send empty message to get the initial greeting
        showTyping();
        sendToWatson('');
      })
      .catch(function (err) {
        removeTyping();
        console.error('Watson session error:', err);
        appendMessage('Welcome to Diya Mehndi Arts! 🪷 I\'m here to help you with mehndi designs, pricing, bookings, and more. How can I assist you today?', 'bot');
        sendBtn.disabled = false;
      });
  }

  function sendToWatson(text) {
    if (!sessionId) {
      removeTyping();
      appendMessage(getFallbackResponse(text), 'bot');
      sendBtn.disabled = false;
      return;
    }

    const body = {
      input: {
        message_type: 'text',
        text: text
      }
    };

    fetch(WATSON_BASE_URL + '/v2/assistants/' + ASSISTANT_ID + '/sessions/' + sessionId + '/message?version=' + API_VERSION, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Message failed: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        removeTyping();
        var responses = data.output && data.output.generic ? data.output.generic : [];
        if (responses.length === 0) {
          appendMessage('I\'m sorry, I didn\'t quite understand that. Could you please rephrase?', 'bot');
        } else {
          responses.forEach(function (resp) {
            if (resp.response_type === 'text' && resp.text) {
              appendMessage(resp.text, 'bot');
            } else if (resp.response_type === 'option') {
              var optionsHTML = '';
              if (resp.title) {
                optionsHTML += '<strong>' + resp.title + '</strong><br>';
              }
              if (resp.description) {
                optionsHTML += '<span style="font-size:13px;color:#666;">' + resp.description + '</span><br>';
              }
              if (resp.options && resp.options.length > 0) {
                resp.options.forEach(function (opt) {
                  var optValue = (opt.value && opt.value.input && opt.value.input.text) ? opt.value.input.text : opt.label;
                  optionsHTML += '<a href="#" class="watson-option-btn" data-value="' +
                    optValue.replace(/"/g, '&quot;') +
                    '" style="display:inline-block;margin:4px 4px 0 0;padding:8px 16px;background:#470604;color:#fff;border-radius:16px;text-decoration:none;font-size:13px;cursor:pointer;">' +
                    opt.label + '</a>';
                });
              }
              var msgEl = appendMessage(optionsHTML, 'bot');
              // Attach click handlers only to buttons in THIS message
              if (msgEl) {
                var optionBtns = msgEl.querySelectorAll('.watson-option-btn');
                optionBtns.forEach(function (btn) {
                  btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    var val = this.getAttribute('data-value');
                    appendMessage(val, 'user');
                    showTyping();
                    sendToWatson(val);
                  });
                });
              }
            } else if (resp.response_type === 'image' && resp.source) {
              appendMessage('<img src="' + resp.source + '" alt="' + (resp.title || '') + '" style="max-width:100%;border-radius:8px;" />', 'bot');
            } else if (resp.response_type === 'pause') {
              // Watson pause — do nothing visible
            }
          });
        }
        sendBtn.disabled = false;
      })
      .catch(function (err) {
        removeTyping();
        console.error('Watson message error:', err);
        appendMessage(getFallbackResponse(text), 'bot');
        sendBtn.disabled = false;
      });
  }

  // ── Fallback responses if API is unreachable ──
  function getFallbackResponse(text) {
    var lower = (text || '').toLowerCase();

    if (lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('charge')) {
      return 'Here are our price ranges:<br>• <strong>Arabic Mehndi:</strong> ₹200 - ₹250<br>• <strong>Designer/Pattern:</strong> ₹400 - ₹600<br>• <strong>Bharma Mehndi:</strong> ₹1,000<br>• <strong>Bridal:</strong> ₹5,100<br>• <strong>Groom:</strong> ₹2,100<br>• <strong>Portrait:</strong> ₹600 - ₹650/figure<br>• <strong>Tattoo:</strong> ₹100 - ₹150<br><br>For exact pricing, please contact us at +91 7869547331.';
    }
    if (lower.includes('book') || lower.includes('appointment') || lower.includes('order')) {
      return 'You can book your mehndi session through our <a href="booking.html">Booking Page</a>. Fill in your name, phone, address, date, and preferred mehndi type. We\'ll confirm your appointment soon!';
    }
    if (lower.includes('contact') || lower.includes('phone') || lower.includes('email') || lower.includes('address') || lower.includes('location')) {
      return '📍 <strong>Address:</strong> 15 Arya Samaj Marg Malipura, Ujjain<br>📞 <strong>Phone:</strong> +91 7869547331<br>✉️ <strong>Email:</strong> divyanshidodiya2@gmail.com<br>📸 <strong>Instagram:</strong> @divya_dodiya_02';
    }
    if (lower.includes('bridal') || lower.includes('bride') || lower.includes('wedding') || lower.includes('dulhan')) {
      return 'Our bridal mehndi packages start at ₹5,100. We offer:<br>• The Classic Bridal Package<br>• The Elegant Bridal Package (with gems)<br>• The Star Bridal Package 1 (intricate art)<br>• The Star Bridal Package 2 (with figurines)<br>• The Royal Bridal Package<br><br>Check our <a href="bridegroom.html">Bridal Gallery</a> for designs!';
    }
    if (lower.includes('groom') || lower.includes('dulha')) {
      return 'Groom mehndi is priced at ₹2,100. View designs in our <a href="bridegroom.html">Bride & Groom Gallery</a>!';
    }
    if (lower.includes('basic') || lower.includes('arabic') || lower.includes('simple')) {
      return 'Our basic/Arabic mehndi starts at just ₹200. Check out the <a href="Basic.html">Basic Gallery</a> for designs!';
    }
    if (lower.includes('portrait') || lower.includes('tattoo')) {
      return 'Portrait mehndi starts at ₹600/figure and tattoos from ₹100. See our <a href="protrait.html">Portrait & Tattoo Gallery</a>!';
    }
    if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('namaste')) {
      return 'Namaste! 🪷 Welcome to Diya Mehndi Arts. How can I help you today? You can ask about:<br>• Our mehndi designs & pricing<br>• Booking an appointment<br>• Bridal packages<br>• Contact information';
    }
    if (lower.includes('thank')) {
      return 'You\'re welcome! 🪷 Feel free to reach out anytime. We look forward to making your occasion special with beautiful mehndi art!';
    }

    return 'Thank you for your message! For detailed assistance, please contact us at <strong>+91 7869547331</strong> or email <strong>divyanshidodiya2@gmail.com</strong>. You can also ask me about pricing, bookings, bridal packages, or our designs!';
  }

})();
