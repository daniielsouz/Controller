import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const resolveLocalChromePath = () => {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const computeTotals = (rows) =>
  rows.reduce(
    (accumulator, transaction) => {
      const amount = Number(transaction.amount || 0);

      if (transaction.type === "deposito") {
        accumulator.deposits += amount;
      } else if (transaction.type === "debito") {
        accumulator.debits += amount;
      } else if (transaction.type === "credito") {
        accumulator.credits += amount;
      }

      return accumulator;
    },
    { deposits: 0, debits: 0, credits: 0 }
  );

const sortTransactionsAscending = (rows) =>
  [...rows].sort((left, right) => {
    const dateCompare =
      new Date(left.purchaseDate || "1970-01-01").getTime() -
      new Date(right.purchaseDate || "1970-01-01").getTime();

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(left.description || "").localeCompare(String(right.description || ""), "pt-BR");
  });

const buildSections = (transactions = []) => {
  const deposits = sortTransactionsAscending(
    transactions.filter((item) => item.type === "deposito")
  );
  const vehicle = sortTransactionsAscending(
    transactions.filter((item) => item.category === "veiculos")
  );
  const others = sortTransactionsAscending(
    transactions.filter((item) => item.category === "outras-despesas")
  );

  return [
    { title: "DEPOSITOS", rows: deposits },
    { title: "DESPESAS COM VEICULO", rows: vehicle },
    { title: "OUTRAS DESPESAS", rows: others }
  ];
};

const renderTransactionRows = (section) => {
  if (section.rows.length === 0) {
    return `
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `;
  }

  return section.rows
    .map(
      (transaction, index) => `
        <tr>
          <td>${escapeHtml(formatDate(transaction.purchaseDate))}</td>
          <td>${index + 1}</td>
          <td class="left">${escapeHtml(transaction.description)}</td>
          <td>${escapeHtml(transaction.invoiceNumber || "")}</td>
          <td class="money">${transaction.type === "debito" ? escapeHtml(formatMoney(transaction.amount)) : ""}</td>
          <td class="money">${transaction.type === "credito" ? escapeHtml(formatMoney(transaction.amount)) : ""}</td>
          <td class="money">${transaction.type === "deposito" ? escapeHtml(formatMoney(transaction.amount)) : ""}</td>
        </tr>
      `
    )
    .join("");
};

const renderSection = (section) => {
  const totals = computeTotals(section.rows);
  const isDepositSection = section.title === "DEPOSITOS";

  return `
    <tr>
      <td colspan="7" class="sheet-section-title">${escapeHtml(section.title)}</td>
    </tr>
    ${renderTransactionRows(section)}
    <tr class="sheet-total-line">
      <td colspan="4">${isDepositSection ? "TOTAL DEPOSITO EM CONTA" : "TOTAL DESPESAS"}</td>
      <td class="money">${isDepositSection ? "" : escapeHtml(totals.debits ? formatMoney(totals.debits) : "0,00")}</td>
      <td class="money">${isDepositSection ? "" : escapeHtml(totals.credits ? formatMoney(totals.credits) : "0,00")}</td>
      <td class="money">${isDepositSection ? escapeHtml(totals.deposits ? formatMoney(totals.deposits) : "0,00") : ""}</td>
    </tr>
  `;
};

const envLogoUrl = process.env.LOGO_URL;
let logoSrc = envLogoUrl || "";

if (!logoSrc) {
  const logoPath = path.resolve(process.cwd(), "client", "public", "logo.svg");

  try {
    const rawLogo = fs.readFileSync(logoPath, "utf8");
    const trimmed = rawLogo.trim();
    const base64 = Buffer.from(trimmed, "utf8").toString("base64");
    logoSrc = `data:image/svg+xml;base64,${base64}`;
  } catch (_error) {
    logoSrc = "";
  }
}

const buildHtml = ({ user, monthData }) => {
  const sections = buildSections(monthData.transactions || []);
  const periodLabel =
    monthData?.year && monthData?.month ? `${String(monthData.month).padStart(2, "0")}/${monthData.year}` : "";
  const userName = user?.name ? escapeHtml(user.name) : "Controle Financeiro";

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Controle Financeiro</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #111111;
            font-family: "Times New Roman", serif;
          }

          body {
            padding: 0;
          }

          .financial-sheet {
            width: 100%;
            border-collapse: collapse;
          }

          .sheet-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-radius: 12px;
            background: linear-gradient(135deg, #0c2f4b, #16486b);
            color: #fff;
            margin-bottom: 16px;
          }

          .sheet-header img {
            height: 40px;
          }

          .brand-heading {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .sheet-period {
            text-align: right;
          }

          .sheet-period p {
            margin: 0;
            font-size: 10px;
            opacity: 0.8;
          }

          .sheet-period strong {
            font-size: 18px;
            display: block;
          }

          .sheet-header h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 1px;
          }

          .financial-sheet-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .financial-sheet-table td {
            border: 1px solid #222222;
            min-height: 28px;
            height: 28px;
            padding: 3px 6px;
            text-align: center;
            vertical-align: middle;
            background: #ffffff;
            font-size: 12px;
            line-height: 1.05;
            word-break: break-word;
            overflow-wrap: anywhere;
          }

          .financial-sheet-table td.left {
            text-align: left;
          }

          .financial-sheet-table td.money {
            text-align: right;
            padding-right: 10px;
          }

          .sheet-title {
            font-weight: 700;
            font-size: 18px;
          }

          .sheet-subtitle,
          .sheet-section-title,
          .sheet-footer-title,
          .sheet-head td,
          .sheet-total-line td,
          .sheet-final-row td {
            font-weight: 700;
          }

          .sheet-section-title,
          .sheet-footer-title,
          .sheet-subtitle {
            font-size: 16px;
          }

          .debit-head {
            color: #d11a1a;
          }

          .credit-head {
            color: #0456c8;
          }

          colgroup col:nth-child(1) { width: 10.5%; }
          colgroup col:nth-child(2) { width: 8.5%; }
          colgroup col:nth-child(3) { width: 30.5%; }
          colgroup col:nth-child(4) { width: 13%; }
          colgroup col:nth-child(5) { width: 11.5%; }
          colgroup col:nth-child(6) { width: 11.5%; }
          colgroup col:nth-child(7) { width: 14.5%; }
        </style>
      </head>
      <body>
        <div class="sheet-header">
          <div class="brand-heading">
            ${logoSrc ? `<img src="${logoSrc}" alt="Grano" />` : ""}
            <div>
              <h1>Grano</h1>
              <p>${userName}</p>
            </div>
          </div>
          <div class="sheet-period">
            <p>Período</p>
            <strong>${escapeHtml(periodLabel)}</strong>
          </div>
        </div>
        <div class="financial-sheet">
          <table class="financial-sheet-table">
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <td colspan="7" class="sheet-title">CONTROLE FINANCEIRO</td>
              </tr>
              <tr>
                <td colspan="7" class="sheet-subtitle">MUNICIPIO: ${escapeHtml(
                  monthData.municipality || "Chapeco"
                )}</td>
              </tr>
              <tr>
                <td colspan="7" class="sheet-subtitle">${escapeHtml(user?.name || "")}</td>
              </tr>
              <tr class="sheet-head">
                <td>DATA</td>
                <td>N&ordm;</td>
                <td>Descricao</td>
                <td>N&ordm; Nota</td>
                <td class="debit-head">Debito</td>
                <td class="credit-head">Credito</td>
                <td>SALDO ANTERIOR</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td class="money debit-head">${escapeHtml(formatMoney(monthData.openingBalance))}</td>
              </tr>
              ${sections.map((section) => renderSection(section)).join("")}
              <tr class="sheet-total-line">
                <td colspan="4">DEPOSITO + SALDO ANTERIOR</td>
                <td class="money"></td>
                <td class="money"></td>
                <td class="money debit-head">${escapeHtml(
                  formatMoney(monthData.openingBalance + monthData.deposits)
                )}</td>
              </tr>
              <tr>
                <td colspan="4"></td>
                <td class="sheet-footer-title">GASTOS DEBITO</td>
                <td class="sheet-footer-title">GASTOS CREDITO</td>
                <td></td>
              </tr>
              <tr class="sheet-final-row">
                <td colspan="4">SALDO FINAL</td>
                <td class="money">${escapeHtml(formatMoney(monthData.debits))}</td>
                <td class="money">${escapeHtml(formatMoney(monthData.credits))}</td>
                <td class="money debit-head">${escapeHtml(formatMoney(monthData.closingBalance))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;
};

export const generateMonthlyPdf = async ({ user, monthData }) => {
  const isVercel = Boolean(process.env.VERCEL);
  const executablePath = isVercel
    ? await chromium.executablePath()
    : resolveLocalChromePath();

  if (!executablePath) {
    throw new Error(
      "Nenhum executavel do Chrome foi encontrado para gerar o PDF neste ambiente."
    );
  }

  const browser = await puppeteer.launch({
    args: isVercel
      ? chromium.args
      : ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: isVercel ? chromium.headless : true
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    await page.setContent(buildHtml({ user, monthData }), {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "10mm",
        left: "10mm"
      }
    });
  } finally {
    await browser.close();
  }
};
