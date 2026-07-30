// ============================================
// Autenticação — email/senha com persistência
// Mantém Dudu & Beli logados permanentemente no dispositivo
// Sem "flicker": mostra um único spinner neutro até
// a sessão ser confirmada, só então decide login x app
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
 * Mostra UM único overlay: primeiro em estado "verificando sessão",
 * e só troca para o formulário de login se de fato não houver sessão válida.
 * Chama onReady(user) assim que autenticado — sem piscar entre telas.
 */
export function requireAuth(onReady){
  mountGate();
  persistenceReady.finally(()=>{
    onAuthStateChanged(auth, user=>{
      if(user){
        hideGate();
        onReady(user);
      } else {
        // Só mostra o formulário depois de confirmar que não há sessão —
        // nunca antes, para não "piscar" o login para quem já está logado.
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
        <svg viewBox="0 0 24 24" class="icon-lg"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/></svg>
      </div>
      <h1>Dudu &amp; Beli</h1>

      <div id="auth-checking" class="auth-checking">
        <div class="auth-spinner" role="status" aria-label="Verificando sessão"></div>
        <p>Verificando sessão…</p>
      </div>

      <div id="auth-form-section" hidden>
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
    </div>
  `;
  document.body.appendChild(el);

  const style = document.createElement('style');
  style.textContent = `
    #auth-gate{ position:fixed; inset:0; background:#020126; z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Inter',sans-serif; }
    .auth-card{ width:100%; max-width:360px; background:#0d0d0d; border:1px solid #262626; border-radius:18px; padding:32px 28px; text-align:center; }
    .auth-mark{ width:52px;height:52px;border-radius:14px;background:#edf252; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
    .auth-mark svg{ width:28px;height:28px; stroke:#020126; fill:none; stroke-width:1.8; }
    .auth-card h1{ font-family:'Space Grotesk',sans-serif; font-size:19px; color:#f2f2f0; margin-bottom:6px; }
    .auth-sub{ font-size:12.5px; color:#737373; margin-bottom:22px; }
    .auth-checking{ padding: 14px 0 6px; display:flex; flex-direction:column; align-items:center; gap:14px; }
    .auth-checking p{ font-size:12px; color:#737373; }
    .auth-spinner{ width:30px; height:30px; border:3px solid #262626; border-top-color:#edf252; border-radius:50%; animation:auth-spin .7s linear infinite; }
    @keyframes auth-spin{ to{ transform:rotate(360deg); } }
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
  const el = document.getElementById('auth-gate');
  if(el) el.style.display = 'flex';
  document.getElementById('auth-checking').hidden = true;
  document.getElementById('auth-form-section').hidden = false;
  document.getElementById('loading-screen')?.remove();
}
function hideGate(){
  const el = document.getElementById('auth-gate');
  if(el) el.style.display = 'none';
}
