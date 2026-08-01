// ============================================
// Utilitários de interface compartilhados
// ============================================
import { iconHtml } from './icons.js';
import { setSavedMonth, MESES_PT, YEARS_AVAILABLE } from './firebase.js';
import { createSelect } from './controls.js';

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

// ── Month picker (injetado no page-head): dois dropdowns NOOMA — Mês e Ano ──

/**
 * Monta o seletor de período como dois dropdowns customizados separados
 * (Mês / Ano), no padrão visual NOOMA — nada de <select> nativo.
 * @param {HTMLElement} mountEl
 * @param {string} current - 'YYYY-MM'
 * @param {(value:string)=>void} onChange
 */
export function mountMonthYearPicker(mountEl, current, onChange){
  const [initYear, initMonth] = current.split('-');
  mountEl.innerHTML = `
    <div class="monthyear-picker">
      <div class="my-field"><div id="my-month"></div></div>
      <div class="my-field my-field-year"><div id="my-year"></div></div>
    </div>
  `;
  let year = initYear, month = initMonth;
  const monthOptions = MESES_PT.map((label,i)=>({ value:String(i+1).padStart(2,'0'), label }));
  const yearOptions = YEARS_AVAILABLE.map(y=>({ value:String(y), label:String(y) }));

  function emit(){
    const value = `${year}-${month}`;
    setSavedMonth(value);
    onChange(value);
  }

  const monthSelect = createSelect(mountEl.querySelector('#my-month'), {
    options: monthOptions, value: month, onChange:(v)=>{ month=v; emit(); }
  });
  const yearSelect = createSelect(mountEl.querySelector('#my-year'), {
    options: yearOptions, value: year, onChange:(v)=>{ year=v; emit(); }
  });

  return {
    get value(){ return `${year}-${month}`; },
    set value(v){
      const [y,m] = v.split('-');
      year=y; month=m;
      monthSelect.value = m; yearSelect.value = y;
    }
  };
}
