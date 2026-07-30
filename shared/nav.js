// ============================================
// Sidebar de navegação — injetada em todas as páginas
// ============================================
import { iconHtml, mountIcons } from './icons.js';

const PAGES = [
  { href:'index.html',    label:'Visão Geral',  icon:'dashboard' },
  { href:'gastos.html',   label:'Gastos',       icon:'expense' },
  { href:'entradas.html', label:'Entradas',     icon:'income' },
];

export function renderNav(activeHref){
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
      </div>
      <div class="nav-group">
        <span class="nav-label">Navegação</span>
        ${PAGES.map(p=>`
          <a class="nav-link" href="${p.href}" ${p.href===activeHref?'aria-current="page"':''}>
            ${iconHtml(p.icon)}
            <span>${p.label}</span>
          </a>
        `).join('')}
      </div>
      <div class="sidebar-foot">Sincronizado em tempo real</div>
    </nav>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = navHtml;
  while(wrapper.firstChild) document.body.insertBefore(wrapper.firstChild, document.body.firstChild);

  mountIcons();

  const toggle = document.getElementById('nav-toggle');
  const overlay = document.getElementById('nav-overlay');
  const sidebar = document.getElementById('sidebar');
  function closeNav(){ sidebar.classList.remove('open'); overlay.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
  function openNav(){ sidebar.classList.add('open'); overlay.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
  toggle?.addEventListener('click', ()=> sidebar.classList.contains('open') ? closeNav() : openNav());
  overlay?.addEventListener('click', closeNav);
  document.querySelectorAll('.nav-link').forEach(l=>l.addEventListener('click', closeNav));
}
