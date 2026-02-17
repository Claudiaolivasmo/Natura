// === 📋 FORM-HANDLER.JS (multilenguaje) ===
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('appointmentForm');
  if (!form) return;

  // Pequeño wrapper para usar t(...) si existe, o texto por defecto si no
  const hasT = typeof window !== 'undefined' && typeof window.t === 'function';
  const translate = (key, fallback) => (hasT ? window.t(key) : fallback);

  // Elementos auxiliares
  const submitBtn = form.querySelector('.submit-btn') || form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('form-status') || (() => {
    // si no existe, lo creamos al vuelo
    const p = document.createElement('p');
    p.id = 'form-status';
    p.className = 'text-sm mt-2';
    p.setAttribute('aria-live', 'polite');
    form.appendChild(p);
    return p;
  })();

  // 1) Fecha mínima = hoy
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('preferredDate');
  if (dateInput) dateInput.setAttribute('min', today);

  // 2) Envío a Formspree
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validación simple
    const formData = new FormData(form);
    const requiredFields = ['firstName', 'lastName', 'email']; // phone no obligatorio
    for (const field of requiredFields) {
      if (!String(formData.get(field) || '').trim()) {
        alert(
          translate(
            'formRequiredFields',
            'Por favor complete todos los campos obligatorios.'
          )
        );
        return;
      }
    }

    // UX: estado y botón
    const originalHTML = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
      submitBtn.innerHTML = '<span>' +
        translate('formSending', 'Enviando…') +
        '</span><div class="btn-icon">⏳</div>';
      submitBtn.disabled = true;
    }
    statusEl.textContent = translate('formSending', 'Enviando…');

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        form.reset();
        statusEl.textContent = translate(
          'formSuccess',
          '¡Gracias! Hemos recibido su solicitud. Nos pondremos en contacto pronto.'
        );
      } else {
        const err = await res.json().catch(() => ({}));
        const fallbackMsg = translate(
          'formGenericError',
          'Hubo un problema al enviar. Intente de nuevo.'
        );
        const msg = err?.errors?.[0]?.message || fallbackMsg;
        statusEl.textContent = msg;
      }
    } catch (err) {
      statusEl.textContent = translate(
        'formNetworkError',
        'Error de red. Revise su conexión e intente nuevamente.'
      );
    } finally {
      if (submitBtn && originalHTML !== null) {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
      }
    }
  });

  // 3) Efecto focus (adaptado: tu HTML no usa .form-group)
  const fields = form.querySelectorAll('input, select, textarea');
  fields.forEach((field) => {
    field.addEventListener('focus', function () {
      const wrapper = this.parentElement;
      if (!wrapper) return;
      wrapper.style.transform = 'scale(1.02)';
      wrapper.style.transition = 'transform 0.2s ease';
    });
    field.addEventListener('blur', function () {
      const wrapper = this.parentElement;
      if (!wrapper) return;
      wrapper.style.transform = 'scale(1)';
    });
  });
});
