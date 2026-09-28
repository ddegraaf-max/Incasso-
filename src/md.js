// sprzedamfakture.pl — minimale Markdown → HTML voor AI-verslagen in het panel
// Ondersteunt: koppen (#..######, gerenderd als h3/h4), lijsten (-, *, 1.), **vet**, *cursief*,
// `code`, [tekst](https://…), > citaat, --- . Alles wordt eerst HTML-escaped; alleen http(s)-links.
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s) {
  let out = esc(s);
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  return out;
}

function render(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let list = null;
  let para = [];
  const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const closeList = () => { if (list) { out.push(list === 'ul' ? '</ul>' : '</ol>'); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); closeList(); continue; }
    if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      flushPara(); closeList();
      const lvl = Math.min(4, m[1].length + 2);
      out.push('<h' + lvl + '>' + inline(m[2]) + '</h' + lvl + '>');
      continue;
    }
    if ((m = /^\s*[-*•]\s+(.*)$/.exec(line))) {
      flushPara();
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push('<li>' + inline(m[1]) + '</li>');
      continue;
    }
    if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) {
      flushPara();
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push('<li>' + inline(m[1]) + '</li>');
      continue;
    }
    if ((m = /^>\s?(.*)$/.exec(line))) { flushPara(); closeList(); out.push('<blockquote>' + inline(m[1]) + '</blockquote>'); continue; }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flushPara(); closeList(); out.push('<hr>'); continue; }
    closeList();
    para.push(line.trim());
  }
  flushPara(); closeList();
  return out.join('\n');
}

module.exports = { render, esc };
