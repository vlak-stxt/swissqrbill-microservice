import type { PaymentInput, ValidationIssue } from "../types/payment.js";
import { escapeHtml } from "../utils/html.js";
import type { RenderedBillLinks } from "../services/qr-bill.js";

export type UiLanguage = "de" | "en";

interface Copy {
  actionLanguage: string;
  actionCopyApiLink: string;
  actionCopyEmbedCode: string;
  actionDownloadPdf: string;
  actionDownloadSvg: string;
  actionGenerateQr: string;
  actionResetForm: string;
  embedWebsiteLead: string;
  embedWebsiteTitle: string;
  eyebrow: string;
  fieldAdditionalAddress: string;
  fieldAmount: string;
  fieldCity: string;
  fieldCountry: string;
  fieldCurrency: string;
  fieldIban: string;
  fieldMessage: string;
  fieldName: string;
  fieldNumber: string;
  fieldPersonalNote: string;
  fieldPostcode: string;
  fieldReference: string;
  fieldStreet: string;
  headingCreate: string;
  headingPreview: string;
  headingSummary: string;
  heroLead: string;
  heroTitle: string;
  hintAddress: string;
  hintReference: string;
  hintPersonalNote: string;
  noteMetadata: string;
  previewLead: string;
  summaryLead: string;
  uiLead: string;
  validationFailed: string;
}

interface HomePageModel {
  assetVersion: string;
  errors?: ValidationIssue[];
  formValues: Partial<Record<keyof PaymentInput, string>>;
  language: UiLanguage;
  links?: RenderedBillLinks;
  metadataNote?: string;
  publicBaseUrl?: string;
  resetLink: string;
  switchLinks: Record<UiLanguage, string>;
  svgMarkup?: string;
  summary?: Array<{ label: string; value: string }>;
}

const copyByLanguage: Record<UiLanguage, Copy> = {
  de: {
    actionLanguage: "Sprache",
    actionCopyApiLink: "API-Link kopieren",
    actionCopyEmbedCode: "Code kopieren",
    actionDownloadPdf: "PDF herunterladen",
    actionDownloadSvg: "SVG herunterladen",
    actionGenerateQr: "QR generieren",
    actionResetForm: "Formular zurücksetzen",
    embedWebsiteLead: "Direkte Einbindung auf einer Website per externem SVG.",
    embedWebsiteTitle: "Einbettung auf Websites",
    eyebrow: "Open Source • Fastify • TypeScript",
    fieldAdditionalAddress: "Zusätzliche Adresse",
    fieldAmount: "Betrag",
    fieldCity: "Ort",
    fieldCountry: "Land",
    fieldCurrency: "Währung",
    fieldIban: "IBAN",
    fieldMessage: "Mitteilung an Empfänger",
    fieldName: "Name des Zahlungsempfängers",
    fieldNumber: "Nummer",
    fieldPersonalNote: "Persönliche Notiz",
    fieldPostcode: "PLZ",
    fieldReference: "Referenz",
    fieldStreet: "Strasse",
    headingCreate: "QR-Rechnung erstellen",
    headingPreview: "Vorschau",
    headingSummary: "Zusammenfassung",
    heroLead: "Swiss QR Bill Vorschau, SVG und PDF per Formular oder stateless HTTP API erzeugen.",
    heroTitle: "Swiss QR Bill Generator für Menschen und Systeme.",
    hintAddress: "Optionales UI- / Metadata-Feld.",
    hintReference: "Optional, aber bei QR-IBAN erforderlich.",
    hintPersonalNote: "Sichtbar in UI-Zusammenfassung und JSON-Metadata.",
    noteMetadata:
      "Zusätzliche Adresse und persönliche Notiz bleiben in Metadata/Zusammenfassung erhalten und werden nicht zwingend in den QR-Payload codiert.",
    previewLead: "SVG-Zahlteil, gerendert von `swissqrbill`.",
    summaryLead: "Stateless Output. Es werden keine generierten Dateien auf dem Server gespeichert.",
    uiLead: "Formular absenden oder die Seite über Query-Parameter vorausfüllen.",
    validationFailed: "Validierung fehlgeschlagen"
  },
  en: {
    actionLanguage: "Language",
    actionCopyApiLink: "Copy API Link",
    actionCopyEmbedCode: "Copy code",
    actionDownloadPdf: "Download PDF",
    actionDownloadSvg: "Download SVG",
    actionGenerateQr: "Generate QR",
    actionResetForm: "Reset form",
    embedWebsiteLead: "Direct website embed using the external SVG endpoint.",
    embedWebsiteTitle: "Website embed",
    eyebrow: "Open-source • Fastify • TypeScript",
    fieldAdditionalAddress: "Additional address",
    fieldAmount: "Amount",
    fieldCity: "City",
    fieldCountry: "Country",
    fieldCurrency: "Currency",
    fieldIban: "IBAN",
    fieldMessage: "Message for payee",
    fieldName: "Payee Name",
    fieldNumber: "Number",
    fieldPersonalNote: "Personal note",
    fieldPostcode: "Postcode",
    fieldReference: "Reference",
    fieldStreet: "Street",
    headingCreate: "Create a bill",
    headingPreview: "Preview",
    headingSummary: "Summary",
    heroLead: "Generate Swiss QR Bill previews, SVG, and PDF output from a simple form or the stateless HTTP API.",
    heroTitle: "Swiss QR Bill generator for humans and machines.",
    hintAddress: "Optional UI / metadata field.",
    hintReference: "Optional, but required when using a QR-IBAN.",
    hintPersonalNote: "Visible in UI summary and JSON metadata.",
    noteMetadata:
      "Additional address and personal note are preserved in metadata/summary and may not be encoded into the QR payload.",
    previewLead: "SVG payment part rendered by `swissqrbill`.",
    summaryLead: "Stateless output. No generated files are stored on disk.",
    uiLead: "Submit the form or prefill the page via query parameters.",
    validationFailed: "Validation failed"
  }
};

function field(
  name: keyof PaymentInput,
  label: string,
  value: string | undefined,
  options?: {
    hint?: string;
    inputMode?: "decimal" | "numeric" | "text";
    min?: string;
    placeholder?: string;
    step?: string;
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
        ${options?.inputMode ? `inputmode="${escapeHtml(options.inputMode)}"` : ""}
        ${options?.min ? `min="${escapeHtml(options.min)}"` : ""}
        ${options?.step ? `step="${escapeHtml(options.step)}"` : ""}
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
  const copy = copyByLanguage[model.language];
  const svgAbsoluteUrl =
    model.links && model.publicBaseUrl ? new URL(model.links.embedSvgUrl, model.publicBaseUrl).toString() : "";
  const websiteEmbedCode = `<img src="${svgAbsoluteUrl}" alt="Swiss QR Bill" />`;

  return `<!doctype html>
<html lang="${escapeHtml(model.language)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Swiss QR Bill Microservice</title>
    <link rel="stylesheet" href="/public/styles.css?v=${escapeHtml(model.assetVersion)}" />
    <script defer src="/public/app.js?v=${escapeHtml(model.assetVersion)}"></script>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="hero-top">
          <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
          <label class="lang-switch" aria-label="${escapeHtml(copy.actionLanguage)}">
            <select data-lang-select>
              <option value="${escapeHtml(model.switchLinks.en)}" ${model.language === "en" ? "selected" : ""}>English</option>
              <option value="${escapeHtml(model.switchLinks.de)}" ${model.language === "de" ? "selected" : ""}>Deutsch</option>
            </select>
          </label>
        </div>
        <h1>${escapeHtml(copy.heroTitle)}</h1>
        <p class="lead">${escapeHtml(copy.heroLead)}</p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(copy.headingCreate)}</h2>
            <p>${escapeHtml(copy.uiLead)}</p>
          </div>
          <div class="actions">
            <a class="button button-ghost" href="${escapeHtml(model.resetLink)}">${escapeHtml(copy.actionResetForm)}</a>
          </div>
        </div>

        ${
          errors.length > 0
            ? `<div class="alert">
                <strong>${escapeHtml(copy.validationFailed)}</strong>
                <ul>
                  ${errors
                    .map((error) => `<li><span>${escapeHtml(error.field)}</span>: ${escapeHtml(error.message)}</li>`)
                    .join("")}
                </ul>
              </div>`
            : ""
        }

        <form class="form-grid" method="get" action="/">
          <input type="hidden" name="lang" value="${escapeHtml(model.language)}" />
          ${field("name", copy.fieldName, model.formValues.name, { placeholder: "" })}
          ${field("iban", "IBAN", model.formValues.iban, { placeholder: "CH12 3456 0000 7890 1234 5" })}
          ${field("street", copy.fieldStreet, model.formValues.street, { placeholder: "" })}
          ${field("number", copy.fieldNumber, model.formValues.number, { placeholder: "" })}
          ${field("postcode", copy.fieldPostcode, model.formValues.postcode, { placeholder: "" })}
          ${field("city", copy.fieldCity, model.formValues.city, { placeholder: "" })}
          ${field("amount", copy.fieldAmount, model.formValues.amount, {
            inputMode: "decimal",
            min: "0",
            placeholder: "",
            step: "0.01",
            type: "text"
          })}
          ${field("currency", copy.fieldCurrency, model.formValues.currency ?? "CHF", { placeholder: "CHF" })}
          ${field("reference", copy.fieldReference, model.formValues.reference, {
            hint: copy.hintReference
          })}
          ${textArea("message", copy.fieldMessage, model.formValues.message)}
          ${field("address", copy.fieldAdditionalAddress, model.formValues.address, {
            hint: copy.hintAddress
          })}
          ${textArea("personalNote", copy.fieldPersonalNote, model.formValues.personalNote, copy.hintPersonalNote)}
          ${field("country", copy.fieldCountry, model.formValues.country ?? "CH")}

          <div class="form-footer">
            <button class="button" type="submit">${escapeHtml(copy.actionGenerateQr)}</button>
            ${
              hasResult && model.links
                ? `<button class="button button-ghost" type="button" data-copy-url="${escapeHtml(model.links.apiJsonUrl)}">
                    ${escapeHtml(copy.actionCopyApiLink)}
                  </button>`
                : ""
            }
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
                    <h2>${escapeHtml(copy.headingPreview)}</h2>
                    <p>${escapeHtml(copy.previewLead).replace(/`([^`]+)`/g, "<code>$1</code>")}</p>
                  </div>
                  <div class="actions">
                    <a class="button" href="${escapeHtml(model.links?.pdfUrl)}">${escapeHtml(copy.actionDownloadPdf)}</a>
                    <a class="button button-ghost" href="${escapeHtml(model.links?.svgUrl)}">${escapeHtml(copy.actionDownloadSvg)}</a>
                  </div>
                </div>
                <div class="preview-canvas">${model.svgMarkup ?? ""}</div>
              </article>

              <article class="panel summary-panel">
                <div class="panel-head">
                  <div>
                    <h2>${escapeHtml(copy.headingSummary)}</h2>
                    <p>${escapeHtml(copy.summaryLead)}</p>
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
            <section class="panel embed-panel">
              <div class="embed-help embed-help-wide">
                <h3>${escapeHtml(copy.embedWebsiteTitle)}</h3>
                <p>${escapeHtml(copy.embedWebsiteLead)}</p>
                <pre class="code-block"><code>${escapeHtml(websiteEmbedCode)}</code></pre>
                <button class="button button-ghost" type="button" data-copy-text="${escapeHtml(websiteEmbedCode)}">
                  ${escapeHtml(copy.actionCopyEmbedCode)}
                </button>
              </div>
            </section>
          `
          : ""
      }
    </main>
  </body>
</html>`;
}
