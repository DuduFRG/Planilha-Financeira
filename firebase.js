// ============================================
// Núcleo de dados — Firebase Realtime Database
// Compartilhado entre Dashboard, Gastos e Entradas
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, push, remove, update, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6A-XpYZLYZiE65eXwculdmIVey7R_zqM",
  authDomain: "planilha-financeira-30d61.firebaseapp.com",
  projectId: "planilha-financeira-30d61",
  storageBucket: "planilha-financeira-30d61.firebasestorage.app",
  messagingSenderId: "378578222285",
  appId: "1:378578222285:web:c4b0116e21fb1f3f867d84",
  databaseURL: "https://planilha-financeira-30d61-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, onValue, push, remove, update, get };

export const CATEGORIES = ['entradas','entradasFreela','fixas','imprevistos','alimentacao','lazer','transporte','casa','investimentos','indefinidos'];

export const VALID_MONTHS = ['2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12'];

export const CAT_META = {
  fixas:          { label:'Contas Obrigatórias', icon:'shieldCheck', color:'#4C8DFF' },
  imprevistos:    { label:'Imprevistos',         icon:'bolt',        color:'#e5484d' },
  alimentacao:    { label:'Alimentação',         icon:'utensils',    color:'#f2994a' },
  lazer:          { label:'Lazer',               icon:'gamepad',     color:'#a179f2' },
  transporte:     { label:'Transporte',          icon:'car',         color:'#3fbf88' },
  casa:           { label:'Casa',                icon:'home',        color:'#bbbf49' },
  investimentos:  { label:'Investimentos',       icon:'trendUp',     color:'#4ecbd9' },
};

export const PAGAMENTO_OPTIONS = [
  { value:'debito',   label:'Débito',   icon:'card' },
  { value:'credito',  label:'Crédito',  icon:'card' },
  { value:'pix',      label:'PIX',      icon:'qrcode' },
  { value:'dinheiro', label:'Dinheiro', icon:'cash' },
];

// ── Helpers de formatação ──
export function brl(v){
  return 'R$ ' + parseFloat(v||0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
export function sum(arr){ return (arr||[]).reduce((a,i)=>a+(parseFloat(i.valor)||0),0); }

export function getSavedMonth(){
  const saved = localStorage.getItem('planilha_month');
  return (saved && VALID_MONTHS.includes(saved)) ? saved : '2026-06';
}
export function setSavedMonth(m){ localStorage.setItem('planilha_month', m); }

export function monthLabel(m){
  const names = {'01':'Janeiro','02':'Fevereiro','03':'Março','04':'Abril','05':'Maio','06':'Junho','07':'Julho','08':'Agosto','09':'Setembro','10':'Outubro','11':'Novembro','12':'Dezembro'};
  const [y,mm] = m.split('-');
  return `${names[mm]} ${y}`;
}

export function ddmmToISO(ddmm, year){
  if(!ddmm) return '';
  const parts = ddmm.split('/');
  if(parts.length!==2) return '';
  const [dd,mm] = parts;
  return `${year}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
}
export function isoToDDMM(iso){
  if(!iso) return '';
  const parts = iso.split('-');
  if(parts.length!==3) return '';
  const [,mm,dd] = parts;
  return `${dd}/${mm}`;
}

export function sortByDate(arr){
  return [...(arr||[])].sort((a,b)=>{
    const parse = s => { if(!s) return 0; const p=s.split('/'); return p.length===2 ? parseInt(p[1])*100+parseInt(p[0]) : 0; };
    return parse(a.data) - parse(b.data);
  });
}

// ── Subscrição em tempo real de um mês inteiro ──
export function subscribeMonth(month, onEachCategory, onAllLoaded){
  const unsubs = [];
  let loaded = 0;
  CATEGORIES.forEach(cat=>{
    const r = ref(db, `meses/${month}/${cat}`);
    const off = onValue(r, snap=>{
      const arr = snap.val() ? Object.entries(snap.val()).map(([k,v])=>({...v,_key:k})) : [];
      onEachCategory(cat, arr);
      loaded++;
      if(loaded >= CATEGORIES.length && onAllLoaded) onAllLoaded();
    });
    unsubs.push(off);
  });
  return () => unsubs.forEach(u=>u && u());
}

export function subscribeFixasTemplate(cb){
  return onValue(ref(db,'fixasTemplate'), snap=>{
    const arr = snap.val() ? Object.entries(snap.val()).map(([k,v])=>({...v,_key:k})) : [];
    cb(arr);
  });
}

export function subscribeEntradasTemplate(cb){
  return onValue(ref(db,'entradasTemplate'), snap=>{
    const arr = snap.val() ? Object.entries(snap.val()).map(([k,v])=>({...v,_key:k})) : [];
    cb(arr);
  });
}

// Preenche o mês com as contas fixas do template que ainda não existem nele
export function seedFixasFromTemplate(month, fixasTemplate){
  get(ref(db, `meses/${month}/fixas`)).then(snap=>{
    const existing = snap.val() ? Object.values(snap.val()).map(v=>(v.desc||'').toLowerCase()) : [];
    const mesStr = month.split('-')[1];
    fixasTemplate.forEach(t=>{
      if(t.isAutoDizimo) return;
      const nomeLower = (t.nome||'').toLowerCase();
      if(!existing.includes(nomeLower)){
        push(ref(db, `meses/${month}/fixas`), {
          data: t.dia ? String(t.dia).padStart(2,'0')+'/'+mesStr : '',
          desc: t.nome || '',
          valor: t.valorIndefinido ? 0 : (t.valor||0),
          pago: false,
          who: 'dudu',
          valorIndefinido: t.valorIndefinido || false,
          templateKey: t._key
        });
      }
    });
  });
}

// Preenche o mês com as entradas fixas (ex: salário CLT) do template
export function seedEntradasFromTemplate(month, entradasTemplate){
  get(ref(db, `meses/${month}/entradas`)).then(snap=>{
    const existing = snap.val() ? Object.values(snap.val()).map(v=>(v.origem||'').toLowerCase()) : [];
    const mesStr = month.split('-')[1];
    entradasTemplate.forEach(t=>{
      const nomeLower = (t.origem||'').toLowerCase();
      if(!existing.includes(nomeLower)){
        push(ref(db, `meses/${month}/entradas`), {
          data: t.dia ? String(t.dia).padStart(2,'0')+'/'+mesStr : '',
          origem: t.origem || '',
          servico: t.servico || 'Entrada fixa',
          valor: t.valor || 0,
          dizimo: t.dizimo===true,
          who: t.who || 'dudu',
          isFixa: true,
          templateKey: t._key
        });
      }
    });
  });
}
