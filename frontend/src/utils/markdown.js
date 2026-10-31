/**
 * MATCHDAY IQ — Neo-Brutalist Markdown & Table Renderer
 * Accurately parses markdown headers (including emoji headers), comparison tables,
 * multi-line bullet cells, callouts, metric badges, dividers, and lists into structured HTML.
 */

export function formatMarkdown(text) {
  if (!text) return '';

  // 1. Normalize line endings and strip isolated solitary '#' or markdown artefacts
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/^\s*#+\s*$/gm, '') // Remove solitary '#' or '##' on their own lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 2. Parse Markdown Tables with multi-line cell support
  const lines = cleaned.split('\n');
  const processedBlocks = [];
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  function flushTable() {
    if (!inTable) return;
    processedBlocks.push(renderTableHtml(tableHeaders, tableRows));
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check if line looks like a table row starting with '|'
    if (line.startsWith('|')) {
      // Check if separator row like |---|---|
      const isSeparator = /^[|:\-\s]+$/.test(line) && line.includes('-');
      if (isSeparator) {
        continue;
      }

      // Split cells
      const cells = splitRowCells(line);

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
    } else if (inTable) {
      // Check if this line is a break from the table
      const isBlockBreak =
        line.startsWith('---') ||
        line.startsWith('***') ||
        line.startsWith('###') ||
        line.startsWith('##') ||
        line.startsWith('#') ||
        /^[0-9]+\.\s+/.test(line);

      if (isBlockBreak) {
        flushTable();
        processedBlocks.push(line);
      } else if (tableRows.length > 0) {
        // Append continuation to the last cell of the last row
        const lastRow = tableRows[tableRows.length - 1];
        let appendText = line;
        if (appendText.endsWith('|')) {
          appendText = appendText.slice(0, -1).trim();
        }
        if (lastRow.length > 0) {
          lastRow[lastRow.length - 1] += '\n' + appendText;
        }
      } else {
        flushTable();
        processedBlocks.push(line);
      }
    } else {
      processedBlocks.push(line);
    }
  }

  flushTable();

  // 3. Process Non-Table Blocks (Headers, Dividers, Badges, Lists, Blockquotes)
  const renderedElements = [];
  let currentList = [];

  function flushList() {
    if (currentList.length > 0) {
      renderedElements.push('<ul class="tactical-ul">' + currentList.join('') + '</ul>');
      currentList = [];
    }
  }

  for (let b = 0; b < processedBlocks.length; b++) {
    const block = processedBlocks[b];

    // Already rendered HTML table or container
    if (block.startsWith('<div class="table-responsive">')) {
      flushList();
      renderedElements.push(block);
      continue;
    }

    const trimmed = block.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    // Dividers (--- or ***)
    if (/^(?:---|___|\*\*\*)$/.test(trimmed)) {
      flushList();
      renderedElements.push('<hr class="tactical-divider" />');
      continue;
    }

    // Blockquotes / Callout notes (e.g. "> Important: ..." or "> Note: ...")
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      renderedElements.push(
        `<div class="tactical-callout">
          <span class="callout-tag">TACTICAL NOTE</span>
          <div class="callout-body">${formatInline(quoteText)}</div>
        </div>`
      );
      continue;
    }

    // Numbered Section Titles (e.g. "1. ADVANTAGES" or "## 2. TURNING POINTS" or "## ⚡ 2. TURNING POINTS")
    const sectionMatch = trimmed.match(/^(?:###|##|#)?\s*(?:[^\w\s]\s*)?([0-9]+)\.\s+([^\n]+)$/);
    if (sectionMatch) {
      flushList();
      const num = sectionMatch[1];
      const title = sectionMatch[2].replace(/^[^\w\s]+/, '').trim();
      renderedElements.push(
        `<div class="tactical-section-header">
          <span class="section-num-badge">${num}</span>
          <span class="section-title-text">${formatInline(title)}</span>
        </div>`
      );
      continue;
    }

    // Headings (H3, H2, H1) - Supports emojis and international text
    if (trimmed.startsWith('### ')) {
      flushList();
      renderedElements.push(`<h3 class="tactical-h3">${formatInline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      renderedElements.push(`<h2 class="tactical-h2">${formatInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      renderedElements.push(`<h2 class="tactical-h1">${formatInline(trimmed.slice(2))}</h2>`);
      continue;
    }

    // Meta Badge (e.g. *Pakistan vs Sri Lanka - Final...*)
    if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.slice(1, -1).includes('*')) {
      flushList();
      const metaText = trimmed.slice(1, -1).trim();
      renderedElements.push(
        `<div class="tactical-meta-badge">
          <span class="meta-icon">🏏</span>
          <span>${formatInline(metaText)}</span>
        </div>`
      );
      continue;
    }

    // Bullet items
    if (/^[-*•]\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^[-*•]\s+/, '');
      currentList.push(`<li>${formatInline(bulletContent)}</li>`);
      continue;
    }

    // Regular paragraph
    flushList();
    renderedElements.push(`<p class="tactical-p">${formatInline(trimmed)}</p>`);
  }

  flushList();
  return renderedElements.join('\n');
}

/**
 * Splits a table line by '|' correctly, handling outer borders
 */
function splitRowCells(line) {
  let raw = line.trim();
  if (raw.startsWith('|')) raw = raw.slice(1);
  if (raw.endsWith('|')) raw = raw.slice(0, -1);
  return raw.split('|').map(c => c.trim());
}

/**
 * Formats a clean HTML table with neo-brutalist styling
 */
function renderTableHtml(headers, rows) {
  let html = '<div class="table-responsive"><table class="tactical-table">';

  if (headers && headers.length > 0) {
    html += '<thead><tr>';
    headers.forEach((h, idx) => {
      html += `<th class="${idx === 0 ? 'th-option' : 'th-detail'}">${formatInline(h)}</th>`;
    });
    html += '</tr></thead>';
  }

  html += '<tbody>';
  rows.forEach((row, rowIdx) => {
    const isAlt = rowIdx % 2 === 1;
    html += `<tr class="${isAlt ? 'row-alt' : ''}">`;
    row.forEach((cell, cellIdx) => {
      const isOptionCol = cellIdx === 0;
      const formattedCell = formatCellContent(cell);
      html += `<td class="${isOptionCol ? 'td-option' : 'td-content'}">${formattedCell}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';

  return html;
}

/**
 * Parses multi-line bullet lists inside table cells into structured HTML
 */
function formatCellContent(cellText) {
  if (!cellText) return '-';

  // Normalize bullet points
  const raw = cellText.replace(/\r\n/g, '\n').trim();

  // If cell contains bullets (• or - )
  if (raw.includes('•') || /(?:^|\n)[-*]\s+/.test(raw)) {
    const lines = raw.split('\n');
    const items = [];
    let currentItem = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('•') || line.startsWith('- ') || line.startsWith('* ')) {
        if (currentItem) items.push(currentItem);
        currentItem = line.replace(/^[•\-*]\s*/, '').trim();
      } else if (currentItem) {
        currentItem += ' ' + line;
      } else {
        currentItem = line;
      }
    }
    if (currentItem) items.push(currentItem);

    if (items.length > 0) {
      return (
        '<ul class="cell-bullet-list">' +
        items.map(it => `<li>${formatInline(it)}</li>`).join('') +
        '</ul>'
      );
    }
  }

  // Regular multi-line content
  return formatInline(raw).replace(/\n/g, '<br/>');
}

/**
 * Inline formatting for bold, italic, code, and keywords
 */
function formatInline(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="tactical-code">$1</code>');
}
