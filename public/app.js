document.addEventListener("click", async (event) => {
  const button = event.target instanceof HTMLElement ? event.target.closest("[data-copy-url]") : null;

  if (!(button instanceof HTMLElement)) {
    return;
  }

  const url = button.dataset.copyUrl;
  if (!url) {
    return;
  }

  try {
    const absoluteUrl = new URL(url, window.location.origin).toString();
    await navigator.clipboard.writeText(absoluteUrl);
    const originalText = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = originalText ?? "Copy API Link";
    }, 1800);
  } catch {
    button.textContent = "Copy failed";
  }
});
