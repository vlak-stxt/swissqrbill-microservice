import type { PaymentInput, ValidationIssue } from "../types/payment.js";
import { escapeHtml } from "../utils/html.js";
import type { RenderedBillLinks } from "../services/qr-bill.js";

interface HomePageModel {
  errors?: ValidationIssue[];
  formValues: Partial<Record<keyof PaymentInput, string>>;
  links?: RenderedBillLinks;
  metadataNote?: string;
  svgMarkup?: string;
  summary?: Array<{ label: string; value: string }>;
}

function field(
  name: keyof PaymentInput,
  label: string,
  value: string | undefined,
  options?: {
    hint?: string;
    placeholder?: string;
    type?: "number" | "text";
  }
): string {
  const type = options?.type ?? "text";

  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input
        name="${escapeHtml(name)}"
        type="${escapeHtml(type)}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(options?.placeholder)}"
      />
      ${options?.hint ? `<small>${escapeHtml(options.hint)}</small>` : ""}
    </label>
  `;
}

function textArea(name: keyof PaymentInput, label: string, value: string | undefined, hint?: string): string {
  return `
    <label class="field field-wide">
      <span>${escapeHtml(label)}</span>
      <textarea name="${escapeHtml(name)}" rows="3">${escapeHtml(value)}</textarea>
      ${hint ? `<small>${escapeHtml(hint)}</small>` : ""}
    </label>
  `;
}

export function renderHomePage(model: HomePageModel): string {
  const errors = model.errors ?? [];
  const hasResult = model.svgMarkup !== undefined;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Swiss QR Bill Microservice</title>
    <link rel="stylesheet" href="/public/styles.css" />
    <script defer src="/public/app.js"></script>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <p class="eyebrow">Open-source • Fastify • TypeScript</p>
        <h1>Swiss QR Bill generator for humans and machines.</h1>
        <p class="lead">
          Generate Swiss QR Bill previews, SVG, and PDF output from a simple form or the stateless HTTP API.
        </p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>Create a bill</h2>
            <p>Submit the form or prefill the page via query parameters.</p>
          </div>
          <div class="actions">
            <a class="button button-ghost" href="/">Reset form</a>
          </div>
        </div>

        ${
          errors.length > 0
            ? `<div class="alert">
                <strong>Validation failed</strong>
                <ul>
                  ${errors
                    .map((error) => `<li><span>${escapeHtml(error.field)}</span>: ${escapeHtml(error.message)}</li>`)
                    .join("")}
                </ul>
              </div>`
            : ""
        }

        <form class="form-grid" method="get" action="/">
          ${field("name", "Payee Name", model.formValues.name, { placeholder: "Swiss Example GmbH" })}
          ${field("iban", "IBAN", model.formValues.iban, { placeholder: "CH8109000000853815289" })}
          ${field("street", "Street", model.formValues.street, { placeholder: "St. Gallerstrasse" })}
          ${field("number", "Number", model.formValues.number, { placeholder: "1" })}
          ${field("postcode", "Postcode", model.formValues.postcode, { placeholder: "8589" })}
          ${field("city", "City", model.formValues.city, { placeholder: "Sitterdorf" })}
          ${field("amount", "Amount", model.formValues.amount, { placeholder: "514.56", type: "number" })}
          ${field("currency", "Currency", model.formValues.currency ?? "CHF", { placeholder: "CHF" })}
          ${field("bic", "BIC", model.formValues.bic, { placeholder: "POFICHBEXXX", hint: "Stored in metadata and summary." })}
          ${field("reference", "Reference", model.formValues.reference, {
            hint: "Optional, but required when using a QR-IBAN."
          })}
          ${textArea("message", "Message for payee", model.formValues.message)}
          ${field("address", "Additional address", model.formValues.address, {
            hint: "Optional UI / metadata field."
          })}
          ${textArea("personalNote", "Personal note", model.formValues.personalNote, "Visible in UI summary and JSON metadata.")}
          ${field("country", "Country", model.formValues.country ?? "CH")}

          <div class="form-footer">
            <button class="button" type="submit">Generate QR</button>
          </div>
        </form>
      </section>

      ${
        hasResult
          ? `
            <section class="results">
              <article class="panel preview-panel">
                <div class="panel-head">
                  <div>
                    <h2>Preview</h2>
                    <p>SVG payment part rendered by <code>swissqrbill</code>.</p>
                  </div>
                  <div class="actions">
                    <a class="button" href="${escapeHtml(model.links?.pdfUrl)}">Download PDF</a>
                    <a class="button button-ghost" href="${escapeHtml(model.links?.svgUrl)}">Download SVG</a>
                    <button class="button button-ghost" type="button" data-copy-url="${escapeHtml(model.links?.apiJsonUrl)}">
                      Copy API Link
                    </button>
                  </div>
                </div>
                <div class="preview-canvas">${model.svgMarkup ?? ""}</div>
              </article>

              <article class="panel summary-panel">
                <div class="panel-head">
                  <div>
                    <h2>Summary</h2>
                    <p>Stateless output. No generated files are stored on disk.</p>
                  </div>
                </div>
                <dl class="summary-list">
                  ${(model.summary ?? [])
                    .map(
                      (row) => `
                        <div>
                          <dt>${escapeHtml(row.label)}</dt>
                          <dd>${escapeHtml(row.value)}</dd>
                        </div>
                      `
                    )
                    .join("")}
                </dl>
                ${
                  model.metadataNote
                    ? `<p class="meta-note">${escapeHtml(model.metadataNote)}</p>`
                    : ""
                }
              </article>
            </section>
          `
          : ""
      }
    </main>
  </body>
</html>`;
}
