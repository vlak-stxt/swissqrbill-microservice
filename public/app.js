document.addEventListener("change", (event) => {
  const select = event.target instanceof HTMLSelectElement && event.target.dataset.langSelect !== undefined
    ? event.target
    : null;

  if (select) {
    try {
      const target = new URL(select.value, window.location.origin);
      if (target.origin === window.location.origin) {
        window.location.href = target.href;
      }
    } catch {
      // invalid URL, ignore
    }
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target instanceof HTMLElement ? event.target.closest("[data-copy-url]") : null;
  const copyTextButton = event.target instanceof HTMLElement ? event.target.closest("[data-copy-text]") : null;

  try {
    if (button instanceof HTMLElement) {
      const url = button.dataset.copyUrl;
      if (!url) {
        return;
      }

      const absoluteUrl = new URL(url, window.location.origin).toString();
      const originalText = button.textContent;
      await navigator.clipboard.writeText(absoluteUrl);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = originalText ?? "Copy API Link";
      }, 1800);
      return;
    }

    if (copyTextButton instanceof HTMLElement) {
      const text = copyTextButton.dataset.copyText;
      if (!text) {
        return;
      }

      const originalText = copyTextButton.textContent;
      await navigator.clipboard.writeText(text);
      copyTextButton.textContent = "Copied";
      window.setTimeout(() => {
        copyTextButton.textContent = originalText ?? "Copy code";
      }, 1800);
    }
  } catch {
    if (button instanceof HTMLElement) {
      button.textContent = "Copy failed";
    }
    if (copyTextButton instanceof HTMLElement) {
      copyTextButton.textContent = "Copy failed";
    }
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;

  if (target instanceof HTMLSelectElement && target.hasAttribute("data-lang-select")) {
    try {
      const url = new URL(target.value, window.location.origin);
      if (url.origin === window.location.origin) {
        window.location.href = url.href;
      }
    } catch {
      // invalid URL, ignore
    }
    return;
  }

  if (target instanceof HTMLInputElement && target.hasAttribute("data-debtor-toggle")) {
    const form = target.form;
    const fields = form?.querySelector("[data-debtor-fields]");

    if (!(fields instanceof HTMLElement)) {
      return;
    }

    fields.hidden = !target.checked;
    fields.classList.toggle("is-visible", target.checked);
    for (const input of fields.querySelectorAll("input, textarea, select")) {
      input.disabled = !target.checked;
    }
  }
});
