document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("propertyManagementForm");
  const status = document.getElementById("form-status");

  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn ? submitBtn.textContent : "Send Inquiry";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = window.t("formSending");
    }

    status.textContent = "";
    status.style.color = "";

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: new FormData(form),
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        form.reset();
        status.textContent = window.t("formSuccess");
        status.style.color = "#1A2E35";
      } else {
        const data = await response.json();
        if (data.errors && data.errors.length > 0) {
          status.textContent = data.errors.map(error => error.message).join(", ");
        } else {
          status.textContent = window.t("formGenericError");
        }
        status.style.color = "#b00020";
      }
    } catch (error) {
      status.textContent = window.t("formNetworkError");
      status.style.color = "#b00020";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
});