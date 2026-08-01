// ============================================
// Autenticação — email/senha com persistência
// Mantém Dudu & Beli logados permanentemente no dispositivo
//
// Não existe mais uma tela própria de "verificando sessão": a checagem
// de autenticação acontece em silêncio por trás do loading screen que
// cada página já mostra ("Carregando dados de Dudu & Beli…"). O overlay
// de login só é criado e exibido na exceção — quando de fato não há
// sessão válida — nunca durante a checagem em si.
// ============================================
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence,
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6A-XpYZLYZiE65eXwculdmIVey7R_zqM",
  authDomain: "planilha-financeira-30d61.firebaseapp.com",
  projectId: "planilha-financeira-30d61",
  storageBucket: "planilha-financeira-30d61.firebasestorage.app",
  messagingSenderId: "378578222285",
  appId: "1:378578222285:web:c4b0116e21fb1f3f867d84",
  databaseURL: "https://planilha-financeira-30d61-default-rtdb.firebaseio.com"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const persistenceReady = setPersistence(auth, browserLocalPersistence);

/**
 * Bloqueia o app até o login ser confirmado.
 * Não mostra nenhuma tela própria enquanto verifica a sessão — o loading
 * screen da página (já visível) cobre esse instante. Só monta e exibe o
 * formulário de login se de fato não houver sessão válida.
 * Chama onReady(user) assim que autenticado.
 */
export function requireAuth(onReady){
  persistenceReady.finally(()=>{
    onAuthStateChanged(auth, user=>{
      if(user){
        onReady(user);
      } else {
        showLoginForm();
      }
    });
  });
}

export function logout(){
  signOut(auth);
}

function mountGate(){
  if(document.getElementById('auth-gate')) return;
  const el = document.createElement('div');
  el.id = 'auth-gate';
  el.innerHTML = `
    <div class="auth-card">
      <div class="auth-mark">
        <svg viewBox="0 0 24 24" class="icon-lg"><rect x="2" y="6" width="20" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9v.01M18 15v.01"/></svg>
      </div>
      <h1>Dudu &amp; Beli</h1>
      <p class="auth-sub">Entre para acessar o controle financeiro</p>
      <form id="auth-form" autocomplete="on">
        <div class="auth-field">
          <label for="auth-email">E-mail</label>
          <input type="email" id="auth-email" autocomplete="username" required>
        </div>
        <div class="auth-field">
          <label for="auth-pass">Senha</label>
          <input type="password" id="auth-pass" autocomplete="current-password" required>
        </div>
        <div id="auth-error" class="auth-error" hidden></div>
        <button type="submit" class="auth-submit" id="auth-submit">Entrar</button>
      </form>
    </div>
  `;
  document.body.appendChild(el);

  const style = document.createElement('style');
  style.textContent = `
    #auth-gate{ position:fixed; inset:0; background:#020126; z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Inter',sans-serif; }
    .auth-card{ width:100%; max-width:360px; background:#0d0d0d; border:1px solid #262626; border-radius:18px; padding:32px 28px; text-align:center; }
    .auth-mark{ width:52px;height:52px;border-radius:14px;background:#edf252; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .auth-mark svg{ width:28px;height:28px; stroke:#020126; fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
    .auth-card h1{ font-family:'Space Grotesk',sans-serif; font-size:19px; color:#f2f2f0; margin-bottom:6px; }
    .auth-sub{ font-size:12.5px; color:#737373; margin-bottom:22px; }
    .auth-field{ text-align:left; margin-bottom:14px; }
    .auth-field label{ display:block; font-size:11px; font-weight:600; color:#737373; text-transform:uppercase; letter-spacing:.4px; margin-bottom:6px; }
    .auth-field input{ width:100%; background:#131313; border:1px solid #262626; color:#f2f2f0; padding:11px 13px; border-radius:8px; font-size:13.5px; font-family:'Inter',sans-serif; }
    .auth-field input:focus{ outline:none; border-color:#edf252; }
    .auth-error{ background:#e5484d1a; color:#e5484d; font-size:12px; padding:9px 12px; border-radius:8px; margin-bottom:14px; text-align:left; }
    .auth-submit{ width:100%; background:#edf252; color:#020126; border:none; padding:12px; border-radius:8px; font-size:13.5px; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; }
    .auth-submit:hover{ filter:brightness(1.08); }
    .auth-submit:disabled{ opacity:.6; cursor:default; }
  `;
  document.head.appendChild(style);

  document.getElementById('auth-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value;
    const errEl = document.getElementById('auth-error');
    const btn = document.getElementById('auth-submit');
    errEl.hidden = true;
    btn.disabled = true; btn.textContent = 'Entrando…';
    try{
      await persistenceReady;
      await signInWithEmailAndPassword(auth, email, pass);
    } catch(err){
      errEl.textContent = 'E-mail ou senha incorretos.';
      errEl.hidden = false;
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
}

function showLoginForm(){
  mountGate();
  document.getElementById('auth-gate').style.display = 'flex';
  document.getElementById('loading-screen')?.remove();
}
