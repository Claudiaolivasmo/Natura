/* Preserve the existing newsletter endpoint, with localized status messages. */
(() => {
  const form=document.querySelector('.newsletter-form');
  if(!form) return;
  const input=form.querySelector('.newsletter-input'), button=form.querySelector('.newsletter-btn');
  if(!input||!button) return;
  let status=document.querySelector('.newsletter-status');
  if(!status){status=document.createElement('p');status.className='newsletter-status';form.after(status);}
  status.setAttribute('aria-live','polite');
  const en=document.documentElement.lang.startsWith('en');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const original=button.textContent;button.disabled=true;
    button.textContent=en?'Sending…':'Enviando…';status.textContent='';
    try {
      const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({email:input.value.trim()})});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      input.value='';status.textContent=en?'Thank you! You have subscribed successfully.':'¡Gracias! Te suscribiste correctamente.';
    } catch(error) {status.textContent=en?'We could not submit your subscription. Please try again.':'No se pudo enviar tu suscripción. Intentá de nuevo.';}
    finally {button.disabled=false;button.textContent=original;}
  });
})();
