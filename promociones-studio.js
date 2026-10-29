/**
 * LE FABRIQUE - ESTUDIO DE PROMOCIONES, GENERADOR IA Y PUBLICACIÓN EN META
 * Sistema integral para la gestión de ofertas de temporada, compositor de banners con IA,
 * publicación directa en Facebook / Instagram y catálogo interactivo.
 * Desarrollado para Le Fabrique Costa Rica.
 */

// =========================================================================
// 1. CONFIGURACIÓN INICIAL & ESTADO GLOBAL
// =========================================================================
const LE_FABRIQUE_STORAGE_KEY = 'lefabrique_promotions_db_v1';
const LE_FABRIQUE_META_KEY = 'lefabrique_meta_credentials_v1';
const LE_FABRIQUE_SECURITY_KEY = 'lefabrique_admin_security_v1';
const LE_FABRIQUE_SESSION_KEY = 'lefabrique_admin_session_auth';

// Promociones por defecto de alta calidad (Costa Rica)
const DEFAULT_PROMOTIONS = [
  {
    id: 'promo-1',
    title: 'Paquete Corporativo: 10 Camisas Oxford Slim Fit',
    category: 'ejecutivo',
    discountBadge: '-20% DESCUENTO',
    promoPrice: 125000,
    regularPrice: 156000,
    badgeText: '🧵 Bordado de Logo Gratis',
    validUntil: '2026-11-30',
    description: 'Confección nacional en tela Oxford importada de alta durabilidad, corte Slim Fit ejecutivo con bordado computarizado incluido.',
    imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1080&q=80',
    active: true,
    createdAt: '2026-10-29'
  },
  {
    id: 'promo-2',
    title: 'Conjunto Clínico Scrub Antifluido Cloro-Resistente',
    category: 'medico',
    discountBadge: 'OFERTA ESPECIAL',
    promoPrice: 15900,
    regularPrice: 21000,
    badgeText: '✨ Tela Antifluido Certificada',
    validUntil: '2026-11-20',
    description: 'Comodidad total para jornadas exigentes. Tela antifluidos repelente de líquidos con bolsillos multifuncionales.',
    imageUrl: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1080&q=80',
    active: true,
    createdAt: '2026-10-29'
  },
  {
    id: 'promo-3',
    title: 'Filipina Chef Ejecutiva Transpirable con Ribetes Dorados',
    category: 'gastronomico',
    discountBadge: 'PRECIO DE TEMPORADA',
    promoPrice: 14500,
    regularPrice: 19000,
    badgeText: '🔥 Edición Limitada',
    validUntil: '2026-11-15',
    description: 'Diseño ergonómico con malla lateral transpirable y botones de alta resistencia al calor y lavados intensivos.',
    imageUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=1080&q=80',
    active: true,
    createdAt: '2026-10-29'
  }
];

// Estado de la aplicación
let promotionsState = [];
let currentTickerIndex = 0;
let tickerInterval = null;
let currentBannerImage = null; // Image object para el canvas

// =========================================================================
// 2. INICIALIZACIÓN
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initPromotionsDatabase();
  renderPromoTicker();
  renderPublicPromos();
  setupAdminListeners();
  initBannerCanvas();
});

// Cargar o sembrar base de datos local
function initPromotionsDatabase() {
  try {
    const stored = localStorage.getItem(LE_FABRIQUE_STORAGE_KEY);
    if (!stored) {
      promotionsState = [...DEFAULT_PROMOTIONS];
      localStorage.setItem(LE_FABRIQUE_STORAGE_KEY, JSON.stringify(promotionsState));
    } else {
      promotionsState = JSON.parse(stored);
    }
  } catch (err) {
    console.error('Error cargando promociones:', err);
    promotionsState = [...DEFAULT_PROMOTIONS];
  }

  // Inicializar credenciales de seguridad si no existen
  if (!localStorage.getItem(LE_FABRIQUE_SECURITY_KEY)) {
    localStorage.setItem(LE_FABRIQUE_SECURITY_KEY, JSON.stringify({
      masterPin: '2026',
      authorizedEmail: 'bermanlopezparrales@gmail.com'
    }));
  }
}

function savePromotionsDatabase() {
  localStorage.setItem(LE_FABRIQUE_STORAGE_KEY, JSON.stringify(promotionsState));
  renderPromoTicker();
  renderPublicPromos();
  renderAdminPromoList();
}

// =========================================================================
// 3. CINTA PROMOCIONAL SUPERIOR (TICKER ROTATIVO)
// =========================================================================
function renderPromoTicker() {
  const tickerContainer = document.getElementById('promoTickerContainer');
  if (!tickerContainer) return;

  const activePromos = promotionsState.filter(p => p.active);
  if (activePromos.length === 0) {
    tickerContainer.classList.add('hidden');
    return;
  }

  tickerContainer.classList.remove('hidden');

  if (currentTickerIndex >= activePromos.length) {
    currentTickerIndex = 0;
  }

  const promo = activePromos[currentTickerIndex];
  const promoPriceFmt = new Intl.NumberFormat('es-CR').format(promo.promoPrice);
  const regPriceFmt = new Intl.NumberFormat('es-CR').format(promo.regularPrice);
  const ahorro = promo.regularPrice - promo.promoPrice;
  const ahorroFmt = new Intl.NumberFormat('es-CR').format(ahorro);

  const waMsg = encodeURIComponent(
    `*HOLA LE FABRIQUE CR* 👔✨\n` +
    `Me interesa aprovechar esta *OFERTA DESTACADA DE LA PÁGINA*:\n` +
    `🏷️ *Promoción:* ${promo.title}\n` +
    `💰 *Precio de Oferta:* ₡${promoPriceFmt} (Ahorro de ₡${ahorroFmt})\n` +
    `✨ *Detalle:* ${promo.badgeText || 'Confección nacional'}\n\n` +
    `¿Podrían confirmarme disponibilidad y toma de tallas? Muchas gracias.`
  );

  const tickerContent = document.getElementById('promoTickerContent');
  if (tickerContent) {
    tickerContent.innerHTML = `
      <div class="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-brand-navydark/95 via-blue-950/70 to-brand-navydark/95 p-3 sm:p-4 rounded-2xl border border-amber-500/40 shadow-inner">
        
        <!-- Bloque Izquierdo: Imagen del uniforme en promoción + Badges -->
        <div class="flex items-center gap-4 sm:gap-5 w-full lg:w-auto">
          <!-- Imagen de la Prenda / Arte -->
          <a href="#promociones" class="relative group shrink-0">
            <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl bg-slate-950 group-hover:scale-105 transition-transform duration-300">
              <img 
                src="${escapeHtml(promo.imageUrl)}" 
                alt="${escapeHtml(promo.title)}" 
                class="w-full h-full object-cover object-center"
                onerror="this.src='https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=300&q=80'"
              />
            </div>
            <span class="absolute -bottom-1 -right-1 bg-amber-500 text-brand-navydark text-[9px] font-black px-1.5 py-0.5 rounded shadow border border-amber-300 uppercase tracking-tighter">
              EN OFERTA
            </span>
          </a>

          <!-- Información y Precios -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-brand-navydark shadow uppercase tracking-wide animate-pulse">
                🔥 ${escapeHtml(promo.discountBadge || 'OFERTA DE TEMPORADA')}
              </span>
              <span class="text-[11px] font-bold text-amber-300 bg-blue-900/60 px-2 py-0.5 rounded-full border border-amber-400/30 uppercase">
                ${escapeHtml(promo.category || 'Empresarial')}
              </span>
              <span class="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 hidden sm:inline">
                ✔ ${escapeHtml(promo.badgeText || 'Confección Nacional')}
              </span>
            </div>

            <h3 class="font-heading font-black text-white text-base sm:text-xl leading-tight truncate">
              <a href="#promociones" class="hover:text-amber-300 transition">
                ${escapeHtml(promo.title)}
              </a>
            </h3>

            <!-- Fila de Precios Grandes -->
            <div class="flex items-baseline gap-2.5 sm:gap-3.5 mt-1.5 flex-wrap">
              <span class="text-2xl sm:text-3xl font-heading font-black text-amber-300 tracking-tight">
                ₡${promoPriceFmt}
              </span>
              <span class="text-xs sm:text-sm text-slate-400 line-through">
                ₡${regPriceFmt}
              </span>
              <span class="text-[11px] font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                Ahorras ₡${ahorroFmt}
              </span>
              <span class="text-[11px] text-amber-200/90 font-medium hidden md:inline">
                ⏱️ Hasta: ${escapeHtml(promo.validUntil || 'Agotar existencias')}
              </span>
            </div>
          </div>
        </div>

        <!-- Bloque Derecho: Botones de Acción y Controles del Carrusel -->
        <div class="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          
          <!-- Controles de navegación y contador -->
          <div class="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-blue-900/60 text-slate-300">
            <button onclick="prevTickerPromo()" class="p-1 text-slate-400 hover:text-amber-300 transition" title="Promoción anterior">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <span class="text-[11px] font-bold text-amber-300 px-1">
              ${currentTickerIndex + 1} / ${activePromos.length}
            </span>
            <button onclick="nextTickerPromo()" class="p-1 text-slate-400 hover:text-amber-300 transition" title="Siguiente promoción">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- Botones de Acción -->
          <div class="flex items-center gap-2">
            <a 
              href="#promociones" 
              class="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-brand-navydark font-heading font-black text-xs sm:text-sm shadow-xl transition transform hover:scale-105"
            >
              <span>Ver Ofertas</span>
              <span>✨</span>
            </a>

            <a 
              href="https://wa.me/50664898613?text=${waMsg}" 
              target="_blank" 
              class="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
              title="Pedir directamente por WhatsApp"
            >
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.966.527 1.769.78 2.796.78 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.767-5.768-5.767z"/></svg>
              <span>Pedir Ya</span>
            </a>

            <button onclick="closePromoTicker()" class="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800" title="Cerrar cinta temporalmente">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

        </div>

      </div>
    `;
  }

  // Reiniciar temporizador de rotación
  if (tickerInterval) clearInterval(tickerInterval);
  if (activePromos.length > 1) {
    tickerInterval = setInterval(() => {
      const active = promotionsState.filter(p => p.active);
      if (active.length > 1) {
        currentTickerIndex = (currentTickerIndex + 1) % active.length;
        renderPromoTicker();
      }
    }, 7000);
  }
}

function nextTickerPromo() {
  const active = promotionsState.filter(p => p.active);
  if (active.length <= 1) return;
  currentTickerIndex = (currentTickerIndex + 1) % active.length;
  renderPromoTicker();
}

function prevTickerPromo() {
  const active = promotionsState.filter(p => p.active);
  if (active.length <= 1) return;
  currentTickerIndex = (currentTickerIndex - 1 + active.length) % active.length;
  renderPromoTicker();
}

function closePromoTicker() {
  const ticker = document.getElementById('promoTickerContainer');
  if (ticker) {
    ticker.style.display = 'none';
  }
}

// =========================================================================
// 4. SECCIÓN PÚBLICA DE PROMOCIONES (CATÁLOGO DE TEMPORADA)
// =========================================================================
function renderPublicPromos(filter = 'all') {
  const grid = document.getElementById('publicPromosGrid');
  if (!grid) return;

  const activePromos = promotionsState.filter(p => {
    if (!p.active) return false;
    if (filter === 'all') return true;
    return p.category === filter;
  });

  if (activePromos.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 max-w-xl mx-auto shadow-sm">
        <div class="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 text-3xl">
          🏷️
        </div>
        <h4 class="text-xl font-heading font-bold text-brand-navy mb-2">¡Próximamente Nuevas Ofertas de Temporada!</h4>
        <p class="text-slate-600 text-sm mb-6">
          Actualmente estamos renovando nuestras colecciones promocionales. Escríbenos directamente para paquetes de mayoreo corporativo con descuentos especiales.
        </p>
        <a href="https://wa.me/50664898613?text=Hola%20Le%20Fabrique%2C%20quisiera%20consultar%20por%20promociones%20corporativas%20activas." target="_blank" class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.966.527 1.769.78 2.796.78 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.767-5.768-5.767z"/></svg>
          Consultar Promociones por WhatsApp
        </a>
      </div>
    `;
    return;
  }

  grid.innerHTML = activePromos.map(promo => {
    const promoFmt = new Intl.NumberFormat('es-CR').format(promo.promoPrice);
    const regFmt = new Intl.NumberFormat('es-CR').format(promo.regularPrice);
    const ahorro = promo.regularPrice - promo.promoPrice;
    const ahorroFmt = new Intl.NumberFormat('es-CR').format(ahorro);

    const waMsg = encodeURIComponent(
      `*HOLA LE FABRIQUE CR* 👔✨\n` +
      `Me interesa aprovechar la siguiente *PROMOCIÓN DE LA PÁGINA WEB*:\n` +
      `🏷️ *Oferta:* ${promo.title}\n` +
      `💰 *Precio Promocional:* ₡${promoFmt} (Ahorro de ₡${ahorroFmt})\n` +
      `✨ *Beneficio:* ${promo.badgeText || 'Confección premium'}\n\n` +
      `¿Podrían indicarme disponibilidad y coordinar la cotización? Muchas gracias.`
    );

    return `
      <div class="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/80 flex flex-col group relative">
        <!-- Badge de Descuento Flotante -->
        <div class="absolute top-3 left-3 z-10">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-brand-navy text-amber-300 border border-amber-400/40 shadow-lg backdrop-blur-sm">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            ${escapeHtml(promo.discountBadge || 'OFERTA')}
          </span>
        </div>

        <!-- Imagen de Portada -->
        <div class="relative h-64 overflow-hidden bg-slate-900">
          <img 
            src="${escapeHtml(promo.imageUrl)}" 
            alt="${escapeHtml(promo.title)}" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onerror="this.src='https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80'"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-brand-navydark/80 via-transparent to-transparent"></div>
          <div class="absolute bottom-3 right-3">
            <span class="text-[11px] font-semibold text-slate-200 bg-brand-navydark/90 px-2.5 py-1 rounded-md border border-blue-900/60 shadow">
              ⏱️ Válido hasta: ${escapeHtml(promo.validUntil || 'Agotar existencias')}
            </span>
          </div>
        </div>

        <!-- Contenido de la Tarjeta -->
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                ${escapeHtml(promo.badgeText || 'Confección Nacional')}
              </span>
            </div>
            <h3 class="font-heading font-bold text-lg text-brand-navy mb-2 group-hover:text-amber-600 transition">
              ${escapeHtml(promo.title)}
            </h3>
            <p class="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-4">
              ${escapeHtml(promo.description || 'Diseño y confección exclusiva por Le Fabrique con acabados de alta costura empresarial.')}
            </p>
          </div>

          <!-- Precios y Acción -->
          <div class="pt-4 border-t border-slate-100">
            <div class="flex items-baseline justify-between mb-4">
              <div>
                <span class="text-xs text-slate-400 line-through mr-1.5">₡${regFmt}</span>
                <span class="text-2xl font-black font-heading text-brand-navy">₡${promoFmt}</span>
              </div>
              <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Ahorras ₡${ahorroFmt}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <a 
                href="https://wa.me/50664898613?text=${waMsg}" 
                target="_blank" 
                class="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.966.527 1.769.78 2.796.78 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.767-5.768-5.767z"/></svg>
                Pedir Oferta
              </a>

              <button 
                onclick="sharePromotionDirect('${promo.id}')" 
                class="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                Compartir
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Filtrar promociones por categoría
function filterPublicPromotions(cat, btnEl) {
  document.querySelectorAll('#promoCategoryFilters button').forEach(btn => {
    btn.classList.remove('bg-brand-navy', 'text-amber-300', 'shadow-md');
    btn.classList.add('bg-white', 'text-slate-600', 'hover:bg-slate-100');
  });
  if (btnEl) {
    btnEl.classList.add('bg-brand-navy', 'text-amber-300', 'shadow-md');
    btnEl.classList.remove('bg-white', 'text-slate-600', 'hover:bg-slate-100');
  }
  renderPublicPromos(cat);
}

// Compartir promoción
function sharePromotionDirect(promoId) {
  const promo = promotionsState.find(p => p.id === promoId);
  if (!promo) return;

  const url = window.location.href.split('#')[0] + '#promociones';
  const text = `¡Mira esta oferta de Le Fabrique Costa Rica! ${promo.title} a solo ₡${new Intl.NumberFormat('es-CR').format(promo.promoPrice)}.`;

  if (navigator.share) {
    navigator.share({
      title: promo.title,
      text: text,
      url: url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${text} Entra aquí: ${url}`).then(() => {
      showStudioToast('Enlace y detalle de la oferta copiado al portapapeles 📋');
    });
  }
}

// =========================================================================
// 5. SISTEMA DE ACCESO SEGURO Y LOGIN MAESTRO
// =========================================================================
function setupAdminListeners() {
  // Atajo de teclado: Ctrl + Alt + L
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      openAdminSecurityModal();
    }
  });
}

function openAdminSecurityModal() {
  // Verificar si ya tiene sesión activa
  const isAuth = sessionStorage.getItem(LE_FABRIQUE_SESSION_KEY);
  if (isAuth === 'true') {
    openAdminStudio();
    return;
  }

  const modal = document.getElementById('adminSecurityModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const pinInput = document.getElementById('adminPinInput');
    if (pinInput) {
      pinInput.value = '';
      setTimeout(() => pinInput.focus(), 150);
    }
  }
}

function closeAdminSecurityModal() {
  const modal = document.getElementById('adminSecurityModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function verifyAdminAccess(e) {
  if (e) e.preventDefault();

  const pinInput = document.getElementById('adminPinInput');
  const emailInput = document.getElementById('adminEmailInput');
  const errorMsg = document.getElementById('adminSecurityError');

  const secConfig = JSON.parse(localStorage.getItem(LE_FABRIQUE_SECURITY_KEY) || '{"masterPin":"2026","authorizedEmail":"bermanlopezparrales@gmail.com"}');

  const enteredPin = (pinInput ? pinInput.value : '').trim();
  const enteredEmail = (emailInput ? emailInput.value : '').trim().toLowerCase();

  const isPinValid = enteredPin && (enteredPin === secConfig.masterPin || enteredPin === '2026');
  const isEmailValid = enteredEmail && (enteredEmail === secConfig.authorizedEmail.toLowerCase() || enteredEmail === 'bermanlopezparrales@gmail.com');

  if (isPinValid || isEmailValid) {
    sessionStorage.setItem(LE_FABRIQUE_SESSION_KEY, 'true');
    closeAdminSecurityModal();
    if (errorMsg) errorMsg.classList.add('hidden');
    showStudioToast('Acceso autorizado como Administrador Propietario 👑');
    openAdminStudio();
  } else {
    if (errorMsg) {
      errorMsg.textContent = 'Credenciales no autorizadas. Verifica tu PIN o correo de Google.';
      errorMsg.classList.remove('hidden');
    }
  }
}

function logoutAdminStudio() {
  sessionStorage.removeItem(LE_FABRIQUE_SESSION_KEY);
  closeAdminStudio();
  showStudioToast('Sesión administrativa finalizada con seguridad.');
}

// =========================================================================
// 6. PANEL ADMINISTRATIVO: ESTUDIO LE FABRIQUE
// =========================================================================
function openAdminStudio() {
  const studioModal = document.getElementById('adminStudioModal');
  if (studioModal) {
    studioModal.classList.remove('hidden');
    studioModal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
    renderAdminPromoList();
    loadMetaCredentialsToForm();
    updateCanvasBanner();
  }
}

function closeAdminStudio() {
  const studioModal = document.getElementById('adminStudioModal');
  if (studioModal) {
    studioModal.classList.add('hidden');
    studioModal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }
}

function switchStudioTab(tabName) {
  document.querySelectorAll('.studio-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.studio-tab-btn').forEach(btn => {
    btn.classList.remove('border-amber-500', 'text-amber-400', 'bg-blue-900/30');
    btn.classList.add('border-transparent', 'text-slate-400', 'hover:text-slate-200');
  });

  const targetContent = document.getElementById(`tab-${tabName}`);
  const targetBtn = document.getElementById(`btn-tab-${tabName}`);

  if (targetContent) targetContent.classList.remove('hidden');
  if (targetBtn) {
    targetBtn.classList.add('border-amber-500', 'text-amber-400', 'bg-blue-900/30');
    targetBtn.classList.remove('border-transparent', 'text-slate-400');
  }

  if (tabName === 'creador') {
    updateCanvasBanner();
  } else if (tabName === 'catalogo') {
    renderAdminPromoList();
  }
}

// =========================================================================
// 7. MOTOR DE INTELIGENCIA ARTIFICIAL PARA IMÁGENES
// =========================================================================
const AI_STYLE_PRESETS = {
  ejecutivo: 'Professional commercial fashion studio photography of corporate executives wearing luxurious slim fit Oxford shirts in modern bright corporate headquarters, Costa Rica business elegance, sharp fabric texture, cinematic soft lighting, 8k resolution, photorealistic.',
  medico: 'High-end commercial medical apparel photoshoot, smiling doctor in clinical environment wearing modern tailored antimicrobial surgical scrubs, clean bright hospital background, photorealistic 8k.',
  gastronomico: 'Master chef in luxury gourmet restaurant kitchen wearing high-end tailored breathable chef coat with gold embroidery details, commercial culinary photography, sharp focus 8k.',
  industrial: 'Industrial safety workwear photoshoot, worker wearing heavy-duty reflective high-visibility uniform in clean architectural logistics site, professional studio lighting 8k.',
  bordado: 'Macro extreme close-up of intricate metallic gold computer embroidery thread on navy blue luxury fabric, razor-sharp needlework texture, 8k commercial textile detail.'
};

function applyAIPreset(type) {
  const promptInput = document.getElementById('aiCustomPrompt');
  const badgeInput = document.getElementById('bannerBadgeInput');
  const titleInput = document.getElementById('bannerTitleInput');
  const regularInput = document.getElementById('bannerRegularPrice');
  const promoInput = document.getElementById('bannerPromoPrice');

  if (type === 'ejecutivo') {
    if (promptInput) promptInput.value = 'Camisa ejecutiva azul Oxford Slim Fit Le Fabrique';
    if (badgeInput) badgeInput.value = 'OFERTA CORPORATIVA -25%';
    if (titleInput) titleInput.value = 'Paquete 10 Camisas Oxford Slim Fit';
    if (regularInput) regularInput.value = '150000';
    if (promoInput) promoInput.value = '119000';
  } else if (type === 'medico') {
    if (promptInput) promptInput.value = 'Doctora vistiendo scrub médico antifluido azul marino';
    if (badgeInput) badgeInput.value = 'ANTIFLUIDO CERTIFICADO';
    if (titleInput) titleInput.value = 'Conjunto Scrub Clínico Confort';
    if (regularInput) regularInput.value = '22000';
    if (promoInput) promoInput.value = '16900';
  } else if (type === 'gastronomico') {
    if (promptInput) promptInput.value = 'Chef profesional con filipina ejecutiva blanca y ribetes dorados';
    if (badgeInput) badgeInput.value = 'ALTA GASTRONOMÍA';
    if (titleInput) titleInput.value = 'Filipina Chef Ejecutiva Transpirable';
    if (regularInput) regularInput.value = '19500';
    if (promoInput) promoInput.value = '14500';
  } else if (type === 'industrial') {
    if (promptInput) promptInput.value = 'Uniformes industriales de alta visibilidad con cinta reflectiva 3M';
    if (badgeInput) badgeInput.value = 'SEGURIDAD INDUSTRIAL';
    if (titleInput) titleInput.value = 'Camisa Industrial con Reflectivo 3M';
    if (regularInput) regularInput.value = '16000';
    if (promoInput) promoInput.value = '12500';
  }

  showStudioToast(`Plantilla "${type.toUpperCase()}" aplicada ✨`);
  updateCanvasBanner();
}

function enhancePromptWithAI() {
  const promptInput = document.getElementById('aiCustomPrompt');
  if (!promptInput) return;
  const current = promptInput.value.trim();
  if (!current) {
    promptInput.value = 'Camisa ejecutiva de alta gama Le Fabrique Slim Fit en oficina moderna';
  } else {
    promptInput.value = `${current}, fotografía comercial de catálogo publicitario textil, luz natural de estudio, corte elegante y alta definición de costuras`;
  }
  showStudioToast('Prompt optimizado con parámetros fotográficos publicitarios ✨');
}

async function generateAIImageForPromo() {
  const promptInput = document.getElementById('aiCustomPrompt');
  const userPrompt = (promptInput ? promptInput.value : '').trim() || 'Uniformes corporativos elegantes Le Fabrique Costa Rica';
  
  const statusEl = document.getElementById('aiGenerationStatus');
  const btn = document.getElementById('btnGenerateAI');

  if (statusEl) {
    statusEl.classList.remove('hidden');
    statusEl.innerHTML = `
      <div class="flex items-center gap-3 p-3 bg-blue-950/80 rounded-xl border border-amber-500/40 text-amber-300 text-xs animate-pulse">
        <svg class="w-5 h-5 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
        <span><strong>Creando fotografía con IA:</strong> Modelando uniformes, iluminación de estudio y acabados textiles...</span>
      </div>
    `;
  }
  if (btn) btn.disabled = true;

  try {
    // Generación de prompt enriquecido
    const enrichedPrompt = encodeURIComponent(
      `commercial high-end catalog photoshoot of ${userPrompt}, elegant fashion studio lighting, realistic textile cotton polyester fabric texture, 8k resolution, crisp clean background`
    );
    const randomSeed = Math.floor(Math.random() * 1000000);
    const aiUrl = `https://image.pollinations.ai/prompt/${enrichedPrompt}?width=1080&height=1080&nologo=true&seed=${randomSeed}&model=flux`;

    // Cargar la imagen generada en un Image object para el canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      currentBannerImage = img;
      updateCanvasBanner();
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="flex items-center gap-2 p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-emerald-300 text-xs">
            <span>✅ ¡Fotografía generada exitosamente por IA y montada en tu banner!</span>
          </div>
        `;
        setTimeout(() => statusEl.classList.add('hidden'), 5000);
      }
      if (btn) btn.disabled = false;
      showStudioToast('¡Arte generado con éxito! Puedes personalizar textos y precios.');
    };
    img.onerror = () => {
      throw new Error('Error al cargar la imagen generada');
    };
    img.src = aiUrl;

  } catch (error) {
    console.error('Error generando imagen IA:', error);
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="p-2.5 bg-rose-950/60 rounded-xl border border-rose-500/40 text-rose-300 text-xs">
          ⚠️ Ocurrió una interrupción al conectar con el motor de IA. Usando imagen base de respaldo.
        </div>
      `;
    }
    if (btn) btn.disabled = false;
    // Respaldo
    loadFallbackBannerImage();
  }
}

function handleUserImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentBannerImage = img;
      updateCanvasBanner();
      showStudioToast('Fotografía propia cargada en el lienzo 📸');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function loadFallbackBannerImage() {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    currentBannerImage = img;
    updateCanvasBanner();
  };
  img.src = 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1080&q=80';
}

// =========================================================================
// 8. COMPOSITOR DE BANNERS EN TIEMPO REAL (CANVAS HTML5)
// =========================================================================
function initBannerCanvas() {
  loadFallbackBannerImage();
}

function updateCanvasBanner() {
  const canvas = document.getElementById('promoStudioCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // 1. Limpiar lienzo
  ctx.clearRect(0, 0, w, h);

  // 2. Dibujar imagen de fondo (con efecto 'cover')
  if (currentBannerImage && currentBannerImage.complete && currentBannerImage.naturalWidth !== 0) {
    const img = currentBannerImage;
    const hRatio = w / img.width;
    const vRatio = h / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (w - img.width * ratio) / 2;
    const centerShiftY = (h - img.height * ratio) / 2;
    ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
  } else {
    // Fondo fallback
    ctx.fillStyle = '#0f223f';
    ctx.fillRect(0, 0, w, h);
  }

  // 3. Degradado cinematográfico para máxima legibilidad
  // Degradado superior (para el logo)
  const gradTop = ctx.createLinearGradient(0, 0, 0, h * 0.35);
  gradTop.addColorStop(0, 'rgba(10, 22, 41, 0.92)');
  gradTop.addColorStop(1, 'rgba(10, 22, 41, 0)');
  ctx.fillStyle = gradTop;
  ctx.fillRect(0, 0, w, h * 0.35);

  // Degradado inferior (para precios y textos)
  const gradBottom = ctx.createLinearGradient(0, h * 0.45, 0, h);
  gradBottom.addColorStop(0, 'rgba(10, 22, 41, 0)');
  gradBottom.addColorStop(0.5, 'rgba(10, 22, 41, 0.88)');
  gradBottom.addColorStop(1, 'rgba(10, 22, 41, 0.98)');
  ctx.fillStyle = gradBottom;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);

  // 4. Borde elegante dorado
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, w - 14, h - 14);

  // 5. Marco interior sutil
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  // 6. ENCABEZADO CON LOGO DE LE FABRIQUE
  // Dibujar Torre Eiffel dorada vectorial estilizada
  drawBrandEiffelTower(ctx, 80, 50, 0.6);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 38px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LE FABRIQUE', 140, 85);

  ctx.fillStyle = '#c59b27';
  ctx.font = '700 16px "Inter", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('CONFECCIÓN EMPRESARIAL • COSTA RICA', 140, 112);

  // 7. BADGE DE OFERTA / DESCUENTO
  const badgeText = (document.getElementById('bannerBadgeInput')?.value || 'OFERTA DE TEMPORADA').toUpperCase();
  const badgeWidth = 420;
  const badgeHeight = 58;
  const badgeX = w - badgeWidth - 40;
  const badgeY = 55;

  // Fondo del badge con gradiente dorado
  const gradBadge = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY);
  gradBadge.addColorStop(0, '#c59b27');
  gradBadge.addColorStop(1, '#dfb749');
  ctx.fillStyle = gradBadge;
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 14, true, false);

  ctx.fillStyle = '#0a1629';
  ctx.font = '900 22px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`★ ${badgeText} ★`, badgeX + (badgeWidth / 2), badgeY + 38);

  // 8. TÍTULO DEL PRODUCTO
  const titleText = document.getElementById('bannerTitleInput')?.value || 'Paquete Especial de Uniformes';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, titleText, 55, h - 290, w - 110, 56);

  // 9. PRECIOS Y AHORRO
  const promoPrice = document.getElementById('bannerPromoPrice')?.value || '15900';
  const regularPrice = document.getElementById('bannerRegularPrice')?.value || '21000';

  const promoFmt = new Intl.NumberFormat('es-CR').format(promoPrice);
  const regFmt = new Intl.NumberFormat('es-CR').format(regularPrice);

  // Precio regular tachado
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 28px "Inter", sans-serif';
  ctx.fillText(`Precio Regular: ₡${regFmt}`, 55, h - 170);
  
  // Línea de tachado
  const regWidth = ctx.measureText(`Precio Regular: ₡${regFmt}`).width;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(55, h - 178);
  ctx.lineTo(55 + regWidth, h - 178);
  ctx.stroke();

  // Precio de oferta gigante
  ctx.fillStyle = '#dfb749';
  ctx.font = '900 64px "Outfit", sans-serif';
  ctx.fillText(`₡${promoFmt}`, 55, h - 100);

  // Etiqueta "IVA y Bordado Incluido"
  const extraBadge = document.getElementById('bannerExtraBadge')?.value || 'Bordado Computarizado Incluido';
  ctx.fillStyle = '#10b981';
  ctx.font = '800 22px "Inter", sans-serif';
  ctx.fillText(`✔ ${extraBadge}`, 420, h - 110);

  // 10. BARRA INFERIOR DE CONTACTO Y VIGENCIA
  ctx.fillStyle = '#0a1629';
  ctx.fillRect(0, h - 68, w, 68);

  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h - 68);
  ctx.lineTo(w, h - 68);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Inter", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('📱 Pedidos WhatsApp: +506 6489-8613', 55, h - 26);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#fde68a';
  const validUntil = document.getElementById('bannerValidUntil')?.value || '2026-11-30';
  ctx.fillText(`📍 Taller en Heredia • Válido hasta: ${validUntil}`, w - 55, h - 26);
}

// Auxiliares de Canvas
function drawBrandEiffelTower(ctx, x, y, scale = 0.5) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#122442';
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#c59b27';
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(-20, 20);
  ctx.lineTo(20, 20);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(-25, 20, 50, 10);

  ctx.beginPath();
  ctx.arc(0, 48, 14, Math.PI, 0, false);
  ctx.fillStyle = '#c59b27';
  ctx.fill();

  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// =========================================================================
// 9. GUARDAR Y ACTIVAR EN LA PÁGINA WEB
// =========================================================================
function saveCanvasAsPromotion() {
  const canvas = document.getElementById('promoStudioCanvas');
  if (!canvas) return;

  const title = (document.getElementById('bannerTitleInput')?.value || 'Promoción de Temporada').trim();
  const category = document.getElementById('bannerCategorySelect')?.value || 'ejecutivo';
  const badge = (document.getElementById('bannerBadgeInput')?.value || 'OFERTA DE TEMPORADA').trim();
  const extraBadge = (document.getElementById('bannerExtraBadge')?.value || 'Bordado Incluido').trim();
  const promoPrice = parseInt(document.getElementById('bannerPromoPrice')?.value || '15000', 10);
  const regularPrice = parseInt(document.getElementById('bannerRegularPrice')?.value || '20000', 10);
  const validUntil = document.getElementById('bannerValidUntil')?.value || '2026-11-30';

  // Exportar imagen del canvas en Base64/PNG
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

  const newPromo = {
    id: 'promo-' + Date.now(),
    title: title,
    category: category,
    discountBadge: badge,
    promoPrice: promoPrice,
    regularPrice: regularPrice,
    badgeText: extraBadge,
    validUntil: validUntil,
    description: `Aprovecha esta oferta de temporada en ${title}. Calidad y confección garantizada por Le Fabrique Costa Rica.`,
    imageUrl: dataUrl,
    active: true,
    createdAt: new Date().toISOString().split('T')[0]
  };

  promotionsState.unshift(newPromo);
  savePromotionsDatabase();

  showStudioToast('¡Promoción activada en la página web con éxito! 🎉');
  switchStudioTab('catalogo');
}

// Descargar arte gráfico en PNG
function downloadCanvasImage(format = 'feed') {
  const canvas = document.getElementById('promoStudioCanvas');
  if (!canvas) return;

  const title = (document.getElementById('bannerTitleInput')?.value || 'le-fabrique-promocion')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');

  const link = document.createElement('a');
  link.download = `${title}-${format}-1080x1080.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();

  showStudioToast('Arte descargado en alta resolución (1080x1080 px) ⬇️');
}

// Copiar texto para redes
function copySocialCopyText() {
  const title = document.getElementById('bannerTitleInput')?.value || 'Uniformes Empresariales';
  const promoPrice = new Intl.NumberFormat('es-CR').format(document.getElementById('bannerPromoPrice')?.value || '15900');
  const regularPrice = new Intl.NumberFormat('es-CR').format(document.getElementById('bannerRegularPrice')?.value || '21000');
  const badge = document.getElementById('bannerBadgeInput')?.value || 'OFERTA DE TEMPORADA';
  const extra = document.getElementById('bannerExtraBadge')?.value || 'Bordado Computarizado Incluido';
  const valid = document.getElementById('bannerValidUntil')?.value || 'Vigencia limitada';

  const copy = 
    `🔥 ¡${badge}! | LE FABRIQUE COSTA RICA 👔✨\n\n` +
    `Renueva la imagen y comodidad de tu equipo de trabajo con nuestros uniformes de alta gama:\n\n` +
    `👉 ${title}\n` +
    `💰 PRECIO DE OFERTA: ₡${promoPrice} (Antes: ₡${regularPrice})\n` +
    `✔ ${extra}\n` +
    `📍 Confección costarricense en nuestro taller en Santo Domingo de Heredia.\n` +
    `⏱️ Válido hasta: ${valid}.\n\n` +
    `📲 Escríbenos directamente al WhatsApp para pedidos y muestras físicas:\n` +
    `https://wa.me/50664898613?text=Hola%20vi%20la%20promocion%20de%20${encodeURIComponent(title)}\n\n` +
    `#LeFabrique #UniformesCostaRica #UniformesEmpresariales #Heredia #CostaRica #PymesCostaRica`;

  navigator.clipboard.writeText(copy).then(() => {
    showStudioToast('Texto publicitario copiado con hashtags y emojis 📋');
  });
}

// =========================================================================
// 10. PUBLICACIÓN DIRECTA EN FACEBOOK E INSTAGRAM (META GRAPH API)
// =========================================================================
function loadMetaCredentialsToForm() {
  try {
    const creds = JSON.parse(localStorage.getItem(LE_FABRIQUE_META_KEY) || '{}');
    if (document.getElementById('metaFbPageId')) document.getElementById('metaFbPageId').value = creds.facebookPageId || '';
    if (document.getElementById('metaIgAccountId')) document.getElementById('metaIgAccountId').value = creds.instagramAccountId || '';
    if (document.getElementById('metaAccessToken')) document.getElementById('metaAccessToken').value = creds.metaAccessToken || '';
  } catch (e) {
    console.error('Error cargando credenciales de Meta:', e);
  }
}

function saveMetaCredentials() {
  const creds = {
    facebookPageId: (document.getElementById('metaFbPageId')?.value || '').trim(),
    instagramAccountId: (document.getElementById('metaIgAccountId')?.value || '').trim(),
    metaAccessToken: (document.getElementById('metaAccessToken')?.value || '').trim()
  };

  localStorage.setItem(LE_FABRIQUE_META_KEY, JSON.stringify(creds));
  showStudioToast('Credenciales de Meta guardadas correctamente 🔑');
}

async function testMetaConnection() {
  const creds = JSON.parse(localStorage.getItem(LE_FABRIQUE_META_KEY) || '{}');
  const statusEl = document.getElementById('metaConnectionStatus');

  if (!creds.metaAccessToken || !creds.facebookPageId) {
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="p-3 bg-amber-950/60 rounded-xl border border-amber-500/40 text-amber-300 text-xs">
          ⚠️ Ingresa al menos el <strong>Facebook Page ID</strong> y el <strong>Meta Token</strong> para verificar la conexión.
        </div>
      `;
    }
    return;
  }

  if (statusEl) {
    statusEl.innerHTML = `
      <div class="p-3 bg-blue-950/60 rounded-xl border border-blue-500/40 text-blue-300 text-xs animate-pulse">
        Conectando con servidores de Meta Graph API...
      </div>
    `;
  }

  try {
    const resp = await fetch(`https://graph.facebook.com/v21.0/${creds.facebookPageId}?fields=name,category&access_token=${creds.metaAccessToken}`);
    const data = await resp.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (statusEl) {
      statusEl.innerHTML = `
        <div class="p-3 bg-emerald-950/60 rounded-xl border border-emerald-500/40 text-emerald-300 text-xs">
          ✅ <strong>¡Conexión Exitosa con Meta!</strong> Página detectada: <strong>${data.name}</strong> (${data.category || 'Empresa'}). Ya puedes publicar directamente desde la página.
        </div>
      `;
    }
    showStudioToast(`Página de Meta conectada: ${data.name} 🚀`);

  } catch (err) {
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="p-3 bg-rose-950/60 rounded-xl border border-rose-500/40 text-rose-300 text-xs">
          ❌ Error de conexión: ${err.message}. Verifica que el token tenga permisos 'pages_manage_posts'.
        </div>
      `;
    }
  }
}

// Acción de publicación integral sin descargas
async function publishDirectToMetaSocial() {
  const creds = JSON.parse(localStorage.getItem(LE_FABRIQUE_META_KEY) || '{}');
  const canvas = document.getElementById('promoStudioCanvas');

  // Si no ha configurado credenciales aún, brindamos la alternativa directa con 1 clic a Meta Business Suite
  if (!creds.metaAccessToken || !creds.facebookPageId) {
    openMetaFallbackModal();
    return;
  }

  const statusModal = document.getElementById('metaPublishProgressModal');
  if (statusModal) {
    statusModal.classList.remove('hidden');
    statusModal.classList.add('flex');
  }

  try {
    const title = document.getElementById('bannerTitleInput')?.value || 'Uniformes Le Fabrique';
    const promoPrice = new Intl.NumberFormat('es-CR').format(document.getElementById('bannerPromoPrice')?.value || '15900');
    const valid = document.getElementById('bannerValidUntil')?.value || 'Vigencia limitada';

    const caption = 
      `🔥 OFERTA DE TEMPORADA - LE FABRIQUE COSTA RICA 👔\n\n` +
      `¡Renueva la imagen de tu equipo! ${title} a precio especial de ₡${promoPrice}.\n` +
      `Confección en Santo Domingo de Heredia con entrega a todo Costa Rica.\n` +
      `⏱️ Válido hasta: ${valid}.\n\n` +
      `📲 Escríbenos por WhatsApp: https://wa.me/50664898613\n` +
      `#LeFabrique #UniformesCostaRica`;

    // 1. Obtener imagen en Blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));

    // 2. Publicar en Facebook Page
    const fbFormData = new FormData();
    fbFormData.append('source', blob, 'le-fabrique-promo.jpg');
    fbFormData.append('caption', caption);
    fbFormData.append('access_token', creds.metaAccessToken);

    const fbResp = await fetch(`https://graph.facebook.com/v21.0/${creds.facebookPageId}/photos`, {
      method: 'POST',
      body: fbFormData
    });
    const fbResult = await fbResp.json();

    if (fbResult.error) {
      throw new Error(`Facebook API: ${fbResult.error.message}`);
    }

    // 3. Resultado y enlace a Pauta en Meta Ads
    showMetaSuccessModal(fbResult.id, creds.facebookPageId);

  } catch (err) {
    console.error('Error publicando en Meta:', err);
    if (statusModal) statusModal.classList.add('hidden');
    alert(`Ocurrió un aviso con la API de Meta: ${err.message}\n\nPuedes usar la opción directa con 1 clic de Meta Business Suite.`);
    openMetaFallbackModal();
  }
}

function openMetaFallbackModal() {
  copySocialCopyText();
  const modal = document.getElementById('metaFallbackModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeMetaFallbackModal() {
  const modal = document.getElementById('metaFallbackModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function showMetaSuccessModal(postId, pageId) {
  const progressModal = document.getElementById('metaPublishProgressModal');
  if (progressModal) progressModal.classList.add('hidden');

  const modal = document.getElementById('metaSuccessModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeMetaSuccessModal() {
  const modal = document.getElementById('metaSuccessModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

// =========================================================================
// 11. GESTIÓN DEL CATÁLOGO DE OFERTAS EN EL PANEL ADMIN
// =========================================================================
function renderAdminPromoList() {
  const container = document.getElementById('adminPromoTableBody');
  if (!container) return;

  if (promotionsState.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-slate-400 text-sm">
          No hay promociones registradas. ¡Crea una nueva en la pestaña "Generador con IA"!
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = promotionsState.map((promo, idx) => {
    const promoFmt = new Intl.NumberFormat('es-CR').format(promo.promoPrice);
    const regFmt = new Intl.NumberFormat('es-CR').format(promo.regularPrice);

    return `
      <tr class="border-b border-slate-800 hover:bg-slate-800/50 transition">
        <td class="py-3 px-4">
          <img src="${escapeHtml(promo.imageUrl)}" class="w-14 h-14 rounded-lg object-cover border border-slate-700" onerror="this.src='https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=200&q=80'" />
        </td>
        <td class="py-3 px-4 font-semibold text-white">
          <div class="text-sm font-bold">${escapeHtml(promo.title)}</div>
          <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ${escapeHtml(promo.discountBadge || 'OFERTA')}
          </span>
        </td>
        <td class="py-3 px-4 text-xs capitalize text-slate-300">
          ${escapeHtml(promo.category || 'General')}
        </td>
        <td class="py-3 px-4">
          <div class="text-sm font-extrabold text-amber-300">₡${promoFmt}</div>
          <div class="text-xs text-slate-400 line-through">₡${regFmt}</div>
        </td>
        <td class="py-3 px-4">
          <button 
            onclick="togglePromoStatus('${promo.id}')" 
            class="px-2.5 py-1 rounded-full text-xs font-bold transition ${promo.active ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700 text-slate-400 border border-slate-600'}"
          >
            ${promo.active ? '🟢 Activa' : '⚪ Inactiva'}
          </button>
        </td>
        <td class="py-3 px-4 text-right">
          <button 
            onclick="deletePromoItem('${promo.id}')" 
            class="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition" 
            title="Eliminar Promoción"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function togglePromoStatus(id) {
  const promo = promotionsState.find(p => p.id === id);
  if (!promo) return;
  promo.active = !promo.active;
  savePromotionsDatabase();
  showStudioToast(`Promoción marcada como ${promo.active ? 'ACTIVA' : 'INACTIVA'}`);
}

function deletePromoItem(id) {
  if (!confirm('¿Deseas eliminar esta promoción del catálogo?')) return;
  promotionsState = promotionsState.filter(p => p.id !== id);
  savePromotionsDatabase();
  showStudioToast('Promoción eliminada');
}

// =========================================================================
// 12. NOTIFICACIONES TOAST Y UTILIDADES
// =========================================================================
function showStudioToast(msg) {
  let toast = document.getElementById('studioGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'studioGlobalToast';
    toast.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] bg-brand-navydark border border-amber-500/60 text-amber-200 px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all duration-300 pointer-events-none opacity-0';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>✨ ${msg}</span>`;
  toast.style.opacity = '1';
  toast.style.transform = 'translate(-50%, -10px)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 0)';
  }, 4000);
}

function updateMasterPin() {
  const pinInput = document.getElementById('changePinInput');
  const newPin = (pinInput ? pinInput.value : '').trim();
  if (!newPin || newPin.length < 4) {
    alert('El PIN maestro debe tener al menos 4 caracteres.');
    return;
  }
  const secConfig = JSON.parse(localStorage.getItem(LE_FABRIQUE_SECURITY_KEY) || '{"masterPin":"2026","authorizedEmail":"bermanlopezparrales@gmail.com"}');
  secConfig.masterPin = newPin;
  localStorage.setItem(LE_FABRIQUE_SECURITY_KEY, JSON.stringify(secConfig));
  showStudioToast('PIN Maestro actualizado con éxito 🔐');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
