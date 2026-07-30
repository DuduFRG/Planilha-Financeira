// ============================================
// Controles customizados — dropdown e calendário
// Substituem <select> e <input type="date"> nativos
// por componentes acessíveis com o visual do app
// ============================================
import { iconHtml, mountIcons } from './icons.js';

let openPopover = null;
function closeAnyOpenPopover(){ openPopover?.close(); openPopover = null; }
document.addEventListener('click', e=>{
  if(openPopover && !openPopover.root.contains(e.target)) closeAnyOpenPopover();
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeAnyOpenPopover(); });

/**
 * Cria um dropdown customizado.
 * @param {HTMLElement} mountEl - elemento vazio onde o controle será renderizado
 * @param {Object} opts
 *   options: [{value,label,icon?,color?,dot?}]
 *   value: valor inicial
 *   placeholder: texto quando vazio
 *   onChange: (value) => void
 */
export function createSelect(mountEl, { options, value = '', placeholder = 'Selecionar…', onChange }){
  let current = value;
  mountEl.classList.add('cselect');
  mountEl.innerHTML = `
    <button type="button" class="cselect-btn" aria-haspopup="listbox" aria-expanded="false">
      <span class="cselect-label"></span>
      <span class="cselect-chevron">${iconHtml('chevronDown','icon icon-sm')}</span>
    </button>
    <div class="cselect-list" role="listbox" hidden></div>
  `;
  const btn = mountEl.querySelector('.cselect-btn');
  const labelEl = mountEl.querySelector('.cselect-label');
  const listEl = mountEl.querySelector('.cselect-list');

  function optionMarkup(opt){
    const dot = opt.color ? `<span class="cselect-dot" style="background:${opt.color}"></span>` : '';
    const ic = opt.icon ? iconHtml(opt.icon, 'icon icon-sm') : '';
    return `${dot}${ic}<span>${opt.label}</span>`;
  }

  function renderLabel(){
    const found = options.find(o=>o.value===current);
    labelEl.innerHTML = found ? optionMarkup(found) : `<span class="cselect-placeholder">${placeholder}</span>`;
  }
  function renderList(){
    listEl.innerHTML = options.map(o=>`
      <div class="cselect-opt${o.value===current?' active':''}" role="option" aria-selected="${o.value===current}" data-val="${o.value}">
        ${optionMarkup(o)}
      </div>
    `).join('');
    mountIcons(listEl);
  }
  renderLabel(); renderList();

  function open(){
    closeAnyOpenPopover();
    listEl.hidden = false;
    btn.setAttribute('aria-expanded','true');
    mountEl.classList.add('cselect-open');
    openPopover = { root: mountEl, close };
  }
  function close(){
    listEl.hidden = true;
    btn.setAttribute('aria-expanded','false');
    mountEl.classList.remove('cselect-open');
  }

  btn.addEventListener('click', ()=> listEl.hidden ? open() : close());
  listEl.addEventListener('click', e=>{
    const opt = e.target.closest('.cselect-opt');
    if(!opt) return;
    current = opt.dataset.val;
    renderLabel(); renderList(); close();
    onChange?.(current);
  });

  return {
    get value(){ return current; },
    set value(v){ current = v; renderLabel(); renderList(); },
    setOptions(newOptions){ options = newOptions; renderLabel(); renderList(); }
  };
}

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_PT = ['D','S','T','Q','Q','S','S'];

/**
 * Cria um seletor de data customizado (calendário popover).
 * @param {HTMLElement} mountEl
 * @param {Object} opts
 *   value: 'YYYY-MM-DD' ou ''
 *   defaultYear/defaultMonth: usados para abrir o calendário no mês certo mesmo sem valor
 *   onChange: (isoDate) => void
 */
export function createDatePicker(mountEl, { value = '', defaultYear, defaultMonth, onChange }){
  let current = value;
  const today = new Date();
  let viewYear = value ? parseInt(value.split('-')[0]) : (defaultYear || today.getFullYear());
  let viewMonth = value ? parseInt(value.split('-')[1])-1 : (defaultMonth != null ? defaultMonth : today.getMonth());

  mountEl.classList.add('cdate');
  mountEl.innerHTML = `
    <button type="button" class="cdate-btn" aria-haspopup="dialog" aria-expanded="false">
      ${iconHtml('calendar','icon icon-sm')}
      <span class="cdate-label"></span>
    </button>
    <div class="cdate-pop" role="dialog" aria-label="Selecionar data" hidden>
      <div class="cdate-head">
        <button type="button" class="cdate-nav" data-dir="-1" aria-label="Mês anterior">${iconHtml('chevronDown','icon icon-sm cdate-prev')}</button>
        <span class="cdate-month-label"></span>
        <button type="button" class="cdate-nav" data-dir="1" aria-label="Próximo mês">${iconHtml('chevronDown','icon icon-sm cdate-next')}</button>
      </div>
      <div class="cdate-weekdays">${DIAS_PT.map(d=>`<span>${d}</span>`).join('')}</div>
      <div class="cdate-grid"></div>
    </div>
  `;
  const btn = mountEl.querySelector('.cdate-btn');
  const labelEl = mountEl.querySelector('.cdate-label');
  const popEl = mountEl.querySelector('.cdate-pop');
  const monthLabelEl = mountEl.querySelector('.cdate-month-label');
  const gridEl = mountEl.querySelector('.cdate-grid');

  function fmtLabel(iso){
    if(!iso) return 'Selecionar data';
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  function renderLabel(){ labelEl.textContent = fmtLabel(current); }

  function renderGrid(){
    monthLabelEl.textContent = `${MESES_PT[viewMonth]} ${viewYear}`;
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
    let html = '';
    for(let i=0;i<firstDay;i++) html += `<span class="cdate-cell empty"></span>`;
    for(let d=1; d<=daysInMonth; d++){
      const iso = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = iso === today.toISOString().slice(0,10);
      const isSelected = iso === current;
      html += `<button type="button" class="cdate-cell${isToday?' today':''}${isSelected?' selected':''}" data-iso="${iso}">${d}</button>`;
    }
    gridEl.innerHTML = html;
  }

  renderLabel(); renderGrid();

  function open(){
    closeAnyOpenPopover();
    popEl.hidden = false;
    btn.setAttribute('aria-expanded','true');
    mountEl.classList.add('cdate-open');
    openPopover = { root: mountEl, close };
  }
  function close(){
    popEl.hidden = true;
    btn.setAttribute('aria-expanded','false');
    mountEl.classList.remove('cdate-open');
  }

  btn.addEventListener('click', ()=> popEl.hidden ? open() : close());
  mountEl.querySelectorAll('.cdate-nav').forEach(navBtn=>{
    navBtn.addEventListener('click', ()=>{
      const dir = parseInt(navBtn.dataset.dir);
      viewMonth += dir;
      if(viewMonth<0){ viewMonth=11; viewYear--; }
      if(viewMonth>11){ viewMonth=0; viewYear++; }
      renderGrid();
    });
  });
  gridEl.addEventListener('click', e=>{
    const cell = e.target.closest('.cdate-cell:not(.empty)');
    if(!cell) return;
    current = cell.dataset.iso;
    renderLabel(); renderGrid(); close();
    onChange?.(current);
  });

  return {
    get value(){ return current; },
    set value(v){
      current = v;
      if(v){ viewYear = parseInt(v.split('-')[0]); viewMonth = parseInt(v.split('-')[1])-1; }
      renderLabel(); renderGrid();
    }
  };
}

/** Remove emojis/símbolos pictográficos residuais no início de uma string (dados antigos). */
export function stripLeadingEmoji(str){
  if(!str) return str;
  return str.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}]\s*/u, '').trim();
}
