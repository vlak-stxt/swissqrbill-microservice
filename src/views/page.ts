import type { PaymentInput, ValidationIssue } from "../types/payment.js";
import { escapeHtml } from "../utils/html.js";
import type { RenderedBillLinks } from "../services/qr-bill.js";
import type { AppVersion } from "../utils/version.js";

export type UiLanguage = "de" | "en";

interface Copy {
  actionLanguage: string;
  actionCopyApiLink: string;
  actionCopyEmbedCode: string;
  actionDownloadPdf: string;
  actionDownloadSvg: string;
  actionGenerateQr: string;
  actionResetForm: string;
  actionTogglePayableBy: string;
  sectionPayableBy: string;
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
  fieldPayableByCity: string;
  fieldPayableByCountry: string;
  fieldPayableByName: string;
  fieldPayableByNumber: string;
  fieldPayableByPostcode: string;
  fieldPayableByStreet: string;
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
  appVersion: AppVersion | undefined;
  swissqrbillVersion: string | undefined;
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
    actionTogglePayableBy: "Angaben zum Zahlenden hinzufügen",
    sectionPayableBy: "Angaben zum Zahlenden",
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
    fieldPayableByCity: "Ort",
    fieldPayableByCountry: "Land",
    fieldPayableByName: "Name",
    fieldPayableByNumber: "Nr.",
    fieldPayableByPostcode: "PLZ",
    fieldPayableByStreet: "Strasse",
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
    actionTogglePayableBy: "Add payer details",
    sectionPayableBy: "Payer details",
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
    fieldPayableByCity: "City",
    fieldPayableByCountry: "Country",
    fieldPayableByName: "Name",
    fieldPayableByNumber: "No.",
    fieldPayableByPostcode: "Postcode",
    fieldPayableByStreet: "Street",
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
    className?: string;
    disabled?: boolean;
    hint?: string;
    inputMode?: "decimal" | "numeric" | "text";
    min?: string;
    placeholder?: string;
    step?: string;
    type?: "number" | "text";
  }
): string {
  const type = options?.type ?? "text";
  const className = options?.className ? `field ${options.className}` : "field";

  return `
    <label class="${escapeHtml(className)}">
      <span>${escapeHtml(label)}</span>
      <input
        name="${escapeHtml(name)}"
        type="${escapeHtml(type)}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(options?.placeholder)}"
        ${options?.inputMode ? `inputmode="${escapeHtml(options.inputMode)}"` : ""}
        ${options?.min ? `min="${escapeHtml(options.min)}"` : ""}
        ${options?.step ? `step="${escapeHtml(options.step)}"` : ""}
        ${options?.disabled ? "disabled" : ""}
      />
      ${options?.hint ? `<small>${escapeHtml(options.hint)}</small>` : ""}
    </label>
  `;
}

function textArea(
  name: keyof PaymentInput,
  label: string,
  value: string | undefined,
  hint?: string,
  disabled?: boolean
): string {
  return `
    <label class="field field-wide">
      <span>${escapeHtml(label)}</span>
      <textarea name="${escapeHtml(name)}" rows="3" ${disabled ? "disabled" : ""}>${escapeHtml(value)}</textarea>
      ${hint ? `<small>${escapeHtml(hint)}</small>` : ""}
    </label>
  `;
}

function formSection(title: string): string {
  return `<div class="form-section">${escapeHtml(title)}</div>`;
}

function formDivider(): string {
  return `<div class="form-divider" aria-hidden="true"></div>`;
}

export function renderHomePage(model: HomePageModel): string {
  const errors = model.errors ?? [];
  const hasResult = model.svgMarkup !== undefined;
  const copy = copyByLanguage[model.language];
  const hasDebtorValues =
    model.formValues.debtorName !== undefined ||
    model.formValues.debtorStreet !== undefined ||
    model.formValues.debtorNumber !== undefined ||
    model.formValues.debtorPostcode !== undefined ||
    model.formValues.debtorCity !== undefined;
  const hasDebtorErrors = errors.some((error) =>
    [
      copy.fieldPayableByName,
      copy.fieldPayableByStreet,
      copy.fieldPayableByNumber,
      copy.fieldPayableByPostcode,
      copy.fieldPayableByCity,
      copy.fieldPayableByCountry
    ].includes(error.field)
  );
  const debtorExpanded = hasDebtorValues || hasDebtorErrors;
  const debtorFieldsDisabled = !debtorExpanded;
  const svgAbsoluteUrl =
    model.links && model.publicBaseUrl ? new URL(model.links.embedSvgUrl, model.publicBaseUrl).toString() : "";
  const websiteEmbedCode = `<img src="${svgAbsoluteUrl}" alt="Swiss QR Bill" />`;
  const assetCacheKey =
    model.appVersion === undefined ? "" :
    model.appVersion.kind === "tag" ? model.appVersion.ref : model.appVersion.sha;
  const appVersionLink =
    model.appVersion === undefined
      ? `<a class="site-footer-link" href="https://github.com/vlak-stxt/swissqrbill-microservice" target="_blank" rel="noopener">swissqrbill-microservice</a>`
      : model.appVersion.kind === "tag"
        ? `<a class="site-footer-link" href="https://github.com/vlak-stxt/swissqrbill-microservice/releases/tag/${escapeHtml(model.appVersion.ref)}" target="_blank" rel="noopener">swissqrbill-microservice ${escapeHtml(model.appVersion.ref)}</a>`
        : `<a class="site-footer-link" href="https://github.com/vlak-stxt/swissqrbill-microservice/commit/${escapeHtml(model.appVersion.sha)}" target="_blank" rel="noopener">swissqrbill-microservice ${escapeHtml(model.appVersion.sha)}</a>`;
  const swissqrbillLink =
    model.swissqrbillVersion === undefined
      ? `<a class="site-footer-link" href="https://github.com/schoero/swissqrbill" target="_blank" rel="noopener">swissqrbill</a>`
      : `<a class="site-footer-link" href="https://github.com/schoero/swissqrbill/releases/tag/v${escapeHtml(model.swissqrbillVersion)}" target="_blank" rel="noopener">swissqrbill v${escapeHtml(model.swissqrbillVersion)}</a>`;

  const seoTitle = process.env.SEO_TITLE?.trim() || "Swiss QR Bill Microservice";
  const seoDescription = process.env.SEO_DESCRIPTION?.trim();
  const canonicalUrl = model.publicBaseUrl ?? undefined;

  return `<!doctype html>
<html lang="${escapeHtml(model.language)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(seoTitle)}</title>
    ${seoDescription ? `<meta name="description" content="${escapeHtml(seoDescription)}" />` : ""}
    ${canonicalUrl ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />` : ""}
    ${canonicalUrl ? `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />` : ""}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(seoTitle)}" />
    ${seoDescription ? `<meta property="og:description" content="${escapeHtml(seoDescription)}" />` : ""}
    <link rel="icon" href="/public/favicon.ico?v=${escapeHtml(assetCacheKey)}" sizes="any" />
    <link rel="icon" type="image/png" href="/public/qrbill-favicon.png?v=${escapeHtml(assetCacheKey)}" />
    <link rel="stylesheet" href="/public/styles.css?v=${escapeHtml(assetCacheKey)}" />
    <script defer src="/public/app.js?v=${escapeHtml(assetCacheKey)}"></script>
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
          ${formDivider()}
          <div class="toggle-row">
            <label class="toggle-switch">
              <input type="checkbox" name="debtorEnabled" value="1" data-debtor-toggle ${debtorExpanded ? "checked" : ""} />
              <span class="toggle-switch-ui" aria-hidden="true"></span>
              <span>${escapeHtml(copy.actionTogglePayableBy)}</span>
            </label>
          </div>
          <div class="debtor-fields ${debtorExpanded ? "is-visible" : ""}" data-debtor-fields ${debtorExpanded ? "" : "hidden"}>
            ${formSection(copy.sectionPayableBy)}
            ${field("debtorName", copy.fieldPayableByName, model.formValues.debtorName, {
              className: "field-wide",
              disabled: debtorFieldsDisabled,
              placeholder: ""
            })}
            ${field("debtorStreet", copy.fieldPayableByStreet, model.formValues.debtorStreet, {
              disabled: debtorFieldsDisabled,
              placeholder: ""
            })}
            ${field("debtorNumber", copy.fieldPayableByNumber, model.formValues.debtorNumber, {
              disabled: debtorFieldsDisabled,
              placeholder: ""
            })}
            ${field("debtorPostcode", copy.fieldPayableByPostcode, model.formValues.debtorPostcode, {
              disabled: debtorFieldsDisabled,
              placeholder: ""
            })}
            ${field("debtorCity", copy.fieldPayableByCity, model.formValues.debtorCity, {
              disabled: debtorFieldsDisabled,
              placeholder: ""
            })}
            ${field("debtorCountry", copy.fieldPayableByCountry, model.formValues.debtorCountry ?? "CH", {
              disabled: debtorFieldsDisabled,
              placeholder: "CH"
            })}
          </div>

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
                    <p>${escapeHtml(copy.previewLead).replace(/`([^`]+)`/g, (_, t: string) => `<code>${t}</code>`)}</p>
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
    <p class="seo-lead">${model.language === "de"
      ? "QR-Rechnung konforme Zahlscheine sofort erstellen. Nutze das Webformular oder integriere direkt per HTTP API zur Ausgabe als SVG und PDF. Kostenloser, quelloffener Microservice für Schweizer Unternehmen und Entwickler."
      : "Create QR-Rechnung compliant invoices instantly. Use the web form or integrate via the stateless HTTP API to generate SVG and PDF output. Free, open-source, self-hostable microservice built for Swiss businesses and developers."
    }</p>
    <footer class="site-footer">
      ${appVersionLink}
      <span class="site-footer-sep">·</span>
      ${swissqrbillLink}
    </footer>
  </body>
</html>`;
}
