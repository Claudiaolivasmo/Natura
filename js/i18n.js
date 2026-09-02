/* Pages contain their own ES/EN copy. Only shared form messages need a dictionary. */
(() => {
  const en=document.documentElement.lang.startsWith('en');
  const messages={
    formRequiredFields:en?'Please fill in all required fields.':'Por favor complete todos los campos obligatorios.',
    formSending:en?'Sending…':'Enviando…',
    formSuccess:en?'Thank you! Your request has been received. We will contact you soon.':'¡Gracias! Hemos recibido su solicitud. Nos pondremos en contacto pronto.',
    formGenericError:en?'There was an issue submitting the form. Please try again.':'Hubo un problema al enviar. Intente de nuevo.',
    formNetworkError:en?'Network error. Please check your connection and try again.':'Error de red. Revise su conexión e intente nuevamente.'
  };
  window.t=key=>messages[key]||key;
})();
