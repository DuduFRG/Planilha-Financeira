// ============================================
// Sidebar de navegação — injetada em todas as páginas
// Suporta modo recolhido (ícone-only) persistido no dispositivo
// ============================================
import { iconHtml, mountIcons } from './icons.js';

const PAGES = [
  { href:'index.html',    label:'Visão Geral',  icon:'dashboard' },
  { href:'gastos.html',   label:'Gastos',       icon:'expense' },
  { href:'entradas.html', label:'Entradas',     icon:'income' },
];

const COLLAPSE_KEY = 'planilha_nav_collapsed';

export function renderNav(activeHref){
  const collapsed = localStorage.getItem(COLLAPSE_KEY) === '1';
  if(collapsed) document.body.classList.add('nav-collapsed');

  const navHtml = `
    <button class="nav-toggle" id="nav-toggle" aria-label="Abrir menu" aria-expanded="false">
      ${iconHtml('menu')}
    </button>
    <div class="nav-overlay" id="nav-overlay"></div>
    <nav class="sidebar" id="sidebar" aria-label="Navegação principal">
      <div class="brand">
        <div class="brand-mark">${iconHtml('logo')}</div>
        <div class="brand-text">
          <strong>Dudu &amp; Beli</strong>
          <span>Controle Financeiro</span>
        </div>
        <button class="nav-collapse-btn" id="nav-collapse-btn" aria-label="Recolher menu" aria-pressed="${collapsed}">
          ${iconHtml('arrowRight','icon icon-sm')}
        </button>
      </div>
      <div class="nav-group">
        <span class="nav-label">Navegação</span>
        ${PAGES.map(p=>`
          <a class="nav-link" href="${p.href}" title="${p.label}" ${p.href===activeHref?'aria-current="page"':''}>
            ${iconHtml(p.icon)}
            <span>${p.label}</span>
          </a>
        `).join('')}
      </div>
      <div class="sidebar-foot">
        <div class="sidebar-foot-text" style="margin-bottom:10px;">Sincronizado em tempo real</div>
        <button class="nav-link" id="logout-btn" title="Sair" style="width:100%;background:none;border:none;cursor:pointer;">
          ${iconHtml('x')}<span>Sair</span>
        </button>
      </div>
    </nav>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = navHtml;
  while(wrapper.firstChild) document.body.insertBefore(wrapper.firstChild, document.body.firstChild);

  mountIcons();

  const toggle = document.getElementById('nav-toggle');
  const overlay = document.getElementById('nav-overlay');
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('nav-collapse-btn');

  function closeNav(){ sidebar.classList.remove('open'); overlay.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
  function openNav(){ sidebar.classList.add('open'); overlay.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
  toggle?.addEventListener('click', ()=> sidebar.classList.contains('open') ? closeNav() : openNav());
  overlay?.addEventListener('click', closeNav);
  document.querySelectorAll('.nav-link').forEach(l=>l.addEventListener('click', closeNav));

  collapseBtn?.addEventListener('click', ()=>{
    const isCollapsed = document.body.classList.toggle('nav-collapsed');
    localStorage.setItem(COLLAPSE_KEY, isCollapsed ? '1' : '0');
    collapseBtn.setAttribute('aria-pressed', String(isCollapsed));
  });

  document.getElementById('logout-btn')?.addEventListener('click', async ()=>{
    const { logout } = await import('./auth.js');
    logout();
  });
}
