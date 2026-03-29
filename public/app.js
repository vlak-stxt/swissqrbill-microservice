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
