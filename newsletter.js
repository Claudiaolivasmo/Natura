// === ✉️ NEWSLETTER.JS (upgrade) ===
document.addEventListener('DOMContentLoaded', () => {
  const form   = document.querySelector('.newsletter-form');
  const input  = document.querySelector('.newsletter-input');
  const btn    = document.querySelector('.newsletter-btn');
  const status = document.querySelector('.newsletter-status');

  if (!form || !input || !btn) return;

  const setStatus = (msg, ok = true) => {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? 'green' : 'crimson';
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = input.value.trim();
    if (!email) {
      setStatus('Por favor ingrese su email.', false);
      input.focus();
      return;
    }
    if (!validateEmail(email)) {
      setStatus('Por favor ingrese un email válido.', false);
      input.focus();
      return;
    }

    const originalText = btn.textContent;
    btn.textContent = 'Enviando…';
    btn.disabled = true;
    setStatus('');

    try {
      // Puedes enviar como JSON:
      const resp = await fetch('https://formspree.io/f/mjkabpze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (resp.ok) {
        input.value = '';
        setStatus('¡Gracias! Te has suscrito correctamente.', true);
      } else {
        // Extrae detalle si lo hay
        let msg = 'Hubo un error al suscribirte. Intenta de nuevo.';
        try {
          const data = await resp.json();
          if (data && data.error) msg = data.error;
        } catch {}
        setStatus(msg, false);
      }
    } catch (err) {
      setStatus('Error de conexión. Por favor intenta más tarde.', false);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
});

