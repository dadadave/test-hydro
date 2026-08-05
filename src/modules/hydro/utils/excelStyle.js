// Embellissement des feuilles Excel (compatible xlsx-js-style).
// Applique en post-traitement un système visuel cohérent : police, bordures fines,
// titres fusionnés, en-têtes sombres, lignes TOTAL surlignées, nettoyage des séparateurs « ═ ».

const FONT = "Calibri";
const C = {
  title: "1E2733", titleTxt: "FFFFFF",
  header: "334155", headerTxt: "FFFFFF",
  border: "D4DBE6",
  total: "FEF3C7", totalTxt: "7A5300",
  body: "1F2937", meta: "64748B",
};

// Premiers libellés reconnus comme en-têtes de tableau.
const HEADER_FIRST = new Set(["Machine", "Période", "Zone", "Lot", "Lot correction", "N° Série", "Nom complet"]);

const thin = () => {
  const s = { style: "thin", color: { rgb: C.border } };
  return { top: s, bottom: s, left: s, right: s };
};

function beautifySheet(XLSX, ws) {
  if (!ws || !ws["!ref"]) return;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const firstCol = range.s.c, lastCol = range.e.c;
  const merges = ws["!merges"] || [];
  const rows = ws["!rows"] || [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const cells = [];
    let nonEmpty = 0, firstText = null, firstCells = null;
    for (let c = firstCol; c <= lastCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      const has = cell && cell.v !== undefined && cell.v !== "";
      if (has) {
        nonEmpty++;
        if (firstText === null) { firstText = String(cell.v); firstCells = c; }
      }
      cells.push({ addr, cell, c });
    }
    if (nonEmpty === 0) continue; // ligne vide → espace

    // Ligne séparateur « ═══ » : on la vide et on la réduit
    const onlySep = cells.every((x) => !x.cell || x.cell.v === undefined || x.cell.v === "" || /^[═=]+$/.test(String(x.cell.v)));
    if (onlySep) {
      for (const x of cells) if (x.cell) { x.cell.v = ""; delete x.cell.w; delete x.cell.s; }
      rows[r] = { hpt: 5 };
      continue;
    }

    const txt = firstText || "";
    const isMeta = nonEmpty === 1 && /:\s/.test(txt);
    const letters = txt.replace(/[^A-Za-zÀ-ÿ]/g, "");
    const startsEmoji = /^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}📊🫙🔧✓↩⏳]/u.test(txt);
    const isTitle = nonEmpty === 1 && !isMeta &&
      ((letters && letters === letters.toUpperCase()) || startsEmoji ||
       /RÉSUMÉ|ANALYSE|STATISTIQUES|RAPPORT/i.test(txt));
    const token = txt.trim();
    const isHeader = nonEmpty >= 3 && (
      HEADER_FIRST.has(token) ||
      (cells.some((x) => x.cell && /Nombre/.test(String(x.cell.v))) &&
       cells.some((x) => x.cell && /total/i.test(String(x.cell.v))))
    );
    // « TOTAL » en majuscules uniquement (évite de capturer « Total bouteilles … »).
    const isTotal = /^TOTAL($|[\s—:-])/.test(token);

    if (isTitle) {
      const a0 = XLSX.utils.encode_cell({ r, c: firstCells });
      ws[a0].s = {
        font: { name: FONT, sz: 12, bold: true, color: { rgb: C.titleTxt } },
        fill: { fgColor: { rgb: C.title } },
        alignment: { vertical: "center", horizontal: "left", indent: 1 },
      };
      merges.push({ s: { r, c: firstCol }, e: { r, c: lastCol } });
      rows[r] = { hpt: 22 };
      continue;
    }
    if (isMeta) {
      const a0 = XLSX.utils.encode_cell({ r, c: firstCells });
      ws[a0].s = { font: { name: FONT, sz: 10, italic: true, color: { rgb: C.meta } }, alignment: { vertical: "center" } };
      continue;
    }
    if (nonEmpty === 1) {
      // Ligne d'une seule cellule (sous-titre / texte libre) : fusion, sans bordure.
      const a0 = XLSX.utils.encode_cell({ r, c: firstCells });
      ws[a0].s = { font: { name: FONT, sz: 10, color: { rgb: C.body } }, alignment: { vertical: "center", horizontal: "left" } };
      if (firstCells < lastCol) merges.push({ s: { r, c: firstCells }, e: { r, c: lastCol } });
      continue;
    }

    const fill = isHeader ? C.header : isTotal ? C.total : null;
    for (const x of cells) {
      if (!x.cell) continue;
      x.cell.s = {
        font: { name: FONT, sz: 10, bold: isHeader || isTotal, color: { rgb: isHeader ? C.headerTxt : isTotal ? C.totalTxt : C.body } },
        alignment: { vertical: "center", horizontal: x.c === firstCol && !isHeader ? "left" : "center", wrapText: !!isHeader },
        border: thin(),
        ...(fill ? { fill: { fgColor: { rgb: fill } } } : {}),
      };
    }
    if (isHeader) rows[r] = { hpt: 26 };
  }

  ws["!merges"] = merges;
  ws["!rows"] = rows;
}

// Embellit toutes les feuilles d'un classeur.
export function beautifyWorkbook(XLSX, wb) {
  (wb.SheetNames || []).forEach((name) => beautifySheet(XLSX, wb.Sheets[name]));
}
