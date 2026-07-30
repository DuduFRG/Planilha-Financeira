// ============================================
// Utilitários de interface compartilhados
// ============================================
import { iconHtml, mountIcons } from './icons.js';
import { VALID_MONTHS, monthLabel, getSavedMonth, setSavedMonth } from './firebase.js';

export function mountLoadingScreen(){
  const el = document.createElement('div');
  el.id = 'loading-screen';
  el.innerHTML = `<div class="spinner" role="status" aria-label="Carregando"></div><p>Carregando dados de Dudu &amp; Beli…</p>`;
  document.body.appendChild(el);
}
export function hideLoadingScreen(){
  document.getElementById('loading-screen')?.remove();
}

export function mountSyncBadge(){
  const el = document.createElement('div');
  el.id = 'sync-badge';
  el.className = 'syncing';
  el.setAttribute('role','status');
  el.innerHTML = `<span class="dot-pulse" aria-hidden="true"></span><span id="sync-text">Conectando…</span>`;
  document.body.appendChild(el);
}
export function setSyncStatus(state, text){
  const badge = document.getElementById('sync-badge');
  if(!badge) return;
  badge.className = state;
  document.getElementById('sync-text').textContent = text;
}

export function mountToast(){
  const el = document.createElement('div');
  el.id = 'toast';
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  document.body.appendChild(el);
}
export function showToast(msg, type='success'){
  const t = document.getElementById('toast');
  if(!t) return;
  const icon = type==='success' ? 'check' : (type==='error' ? 'x' : 'bolt');
  t.innerHTML = `${iconHtml(icon,'icon icon-sm')}<span>${msg}</span>`;
  t.style.background = type==='error' ? 'var(--danger)' : 'var(--acid)';
  t.style.color = type==='error' ? '#fff' : 'var(--navy)';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2600);
}

// ── Month picker (injetado no page-head) ──
export function monthPickerHtml(current){
  const opts = VALID_MONTHS.map(m=>`<option value="${m}" ${m===current?'selected':''}>${monthLabel(m)}</option>`).join('');
  return `
    <div class="month-picker">
      ${iconHtml('calendar','icon icon-sm')}
      <select id="month-select" aria-label="Selecionar mês">${opts}</select>
      ${iconHtml('chevronDown','icon icon-sm')}
    </div>
  `;
}

export function bindMonthPicker(onChange){
  const sel = document.getElementById('month-select');
  sel?.addEventListener('change', ()=>{
    setSavedMonth(sel.value);
    onChange(sel.value);
  });
}

// ── Date input helpers (calendário nativo) ──
export function dateInputHtml(id, ddmmValue, year){
  const parts = (ddmmValue||'').split('/');
  const iso = parts.length===2 ? `${year}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}` : '';
  return `<input type="date" id="${id}" value="${iso}">`;
}
export function readDateInput(id){
  const el = document.getElementById(id);
  if(!el || !el.value) return '';
  const [,mm,dd] = el.value.split('-');
  return `${dd}/${mm}`;
}
