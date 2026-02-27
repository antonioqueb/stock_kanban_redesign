/** @odoo-module **/

/**
 * Stock Kanban Redesign - Alphaqueb Consulting
 * Compatible Odoo 19 - Tema claro moderno + soporte dark mode nativo
 */

const OPERATION_ICONS = {
    incoming:      '📥',
    outgoing:      '📤',
    internal:      '🔄',
    mrp_operation: '🏭',
};

const OPERATION_LABELS = {
    incoming:      'Recepción',
    outgoing:      'Entrega',
    internal:      'Transferencia Interna',
    mrp_operation: 'Fabricación',
};

const DYNAMIC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

/* ── Variables tema claro (default) ────────────────────────────────────────── */
.o_stock_kanban {
    --sk-bg:        #eef1f8;
    --sk-surface:   #ffffff;
    --sk-surface-2: #f4f6fc;
    --sk-surface-3: #e8ecf5;
    --sk-border:    rgba(15,23,42,0.08);
    --sk-border-h:  rgba(15,23,42,0.16);
    --sk-accent:    #f59e0b;
    --sk-inc:       #10b981;
    --sk-out:       #ef4444;
    --sk-int:       #6366f1;
    --sk-mrp:       #f97316;
    --sk-text:      #0f172a;
    --sk-text2:     #475569;
    --sk-muted:     #94a3b8;
    --sk-shadow:    0 1px 4px rgba(15,23,42,0.06), 0 6px 20px rgba(15,23,42,0.07);
    --sk-shadow-h:  0 4px 12px rgba(15,23,42,0.1), 0 16px 40px rgba(15,23,42,0.1);
    --sk-r:         20px;
    --sk-r-sm:      12px;
    --sk-ease:      0.2s cubic-bezier(0.4,0,0.2,1);
}

/* ── Variables tema oscuro nativo Odoo 17/18/19 ────────────────────────────── */
/* Odoo aplica la clase o_dark al <html> cuando el usuario activa dark mode   */
html.o_dark .o_stock_kanban {
    --sk-bg:        #0f1117;
    --sk-surface:   #1a1d2e;
    --sk-surface-2: #222639;
    --sk-surface-3: #2a2f45;
    --sk-border:    rgba(255,255,255,0.07);
    --sk-border-h:  rgba(255,255,255,0.15);
    --sk-accent:    #fbbf24;
    --sk-inc:       #34d399;
    --sk-out:       #f87171;
    --sk-int:       #818cf8;
    --sk-mrp:       #fb923c;
    --sk-text:      #f1f5f9;
    --sk-text2:     #94a3b8;
    --sk-muted:     #475569;
    --sk-shadow:    0 2px 8px rgba(0,0,0,0.4), 0 8px 28px rgba(0,0,0,0.3);
    --sk-shadow-h:  0 8px 24px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4);
}

/* ── Board ──────────────────────────────────────────────────────────────────── */
.o_stock_kanban,
.o_stock_kanban .o_kanban_renderer,
.o_stock_kanban .o_renderer {
    background: var(--sk-bg) !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
}
.o_stock_kanban .o_kanban_renderer,
.o_stock_kanban .o_renderer {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    padding: 24px !important;
    gap: 20px !important;
    align-items: start !important;
    width: 100% !important;
    box-sizing: border-box !important;
}

/* ── Tarjeta ────────────────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_record {
    background: var(--sk-surface) !important;
    border: 1px solid var(--sk-border) !important;
    border-radius: var(--sk-r) !important;
    box-shadow: var(--sk-shadow) !important;
    transition: transform var(--sk-ease), box-shadow var(--sk-ease), border-color var(--sk-ease) !important;
    overflow: visible !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    position: relative !important;
    padding: 0 !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
}

.o_stock_kanban .o_kanban_record:hover {
    transform: translateY(-4px) !important;
    box-shadow: var(--sk-shadow-h) !important;
    border-color: var(--sk-border-h) !important;
}

/* Franja lateral de color por tipo */
.o_stock_kanban .o_kanban_record::before {
    content: '';
    position: absolute;
    top: 16px; bottom: 16px; left: -1px;
    width: 4px;
    background: var(--sk-accent);
    border-radius: 0 4px 4px 0;
    transition: top var(--sk-ease), bottom var(--sk-ease);
    z-index: 2;
}
.o_stock_kanban .o_kanban_record:hover::before { top: 8px; bottom: 8px; }

.o_stock_kanban .o_kanban_record[data-op-type="incoming"]::before      { background: var(--sk-inc); }
.o_stock_kanban .o_kanban_record[data-op-type="outgoing"]::before      { background: var(--sk-out); }
.o_stock_kanban .o_kanban_record[data-op-type="internal"]::before      { background: var(--sk-int); }
.o_stock_kanban .o_kanban_record[data-op-type="mrp_operation"]::before { background: var(--sk-mrp); }

/* Punto activo (listas) */
.o_stock_kanban .o_kanban_record.sk-ready::after {
    content: '';
    position: absolute;
    top: 14px; right: 16px;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--sk-inc);
    box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
    animation: sk-blink 2.5s ease-in-out infinite;
    z-index: 3;
}

/* Pulso tardías */
@keyframes sk-late-pulse {
    0%,100% { box-shadow: var(--sk-shadow); }
    50%      { box-shadow: var(--sk-shadow), 0 0 0 2px rgba(239,68,68,0.3); }
}
.o_stock_kanban .o_kanban_record.sk-late {
    animation: sk-late-pulse 2.5s ease-in-out infinite !important;
}

@keyframes sk-blink {
    0%,100% { opacity:1; transform: scale(1); }
    50%      { opacity:0.4; transform: scale(0.85); }
}

/* Entrada animada */
@keyframes sk-in {
    from { opacity:0; transform: translateY(20px) scale(0.97); }
    to   { opacity:1; transform: translateY(0) scale(1); }
}
.o_stock_kanban .o_kanban_record { animation: sk-in 0.4s cubic-bezier(0.34,1.2,0.64,1) both; }
.o_stock_kanban .o_kanban_record:nth-child(1){animation-delay:.05s}
.o_stock_kanban .o_kanban_record:nth-child(2){animation-delay:.10s}
.o_stock_kanban .o_kanban_record:nth-child(3){animation-delay:.15s}
.o_stock_kanban .o_kanban_record:nth-child(4){animation-delay:.20s}
.o_stock_kanban .o_kanban_record:nth-child(5){animation-delay:.25s}
.o_stock_kanban .o_kanban_record:nth-child(6){animation-delay:.30s}
.o_stock_kanban .o_kanban_record:nth-child(7){animation-delay:.35s}
.o_stock_kanban .o_kanban_record:nth-child(8){animation-delay:.40s}
.o_stock_kanban .o_kanban_record:nth-child(9){animation-delay:.45s}

/* ── Contenido interno ──────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_record .o_kanban_record_body,
.o_stock_kanban .o_kanban_record .o_kanban_card_content,
.o_stock_kanban [name="stock_picking"] {
    padding: 22px 22px 18px 26px !important;
    background: transparent !important;
}

/* ── Badge tipo operación (inyectado por JS) ────────────────────────────────── */
.sk-op-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 12px;
}
.sk-op-icon { font-size: 1.05rem; line-height: 1; }
.sk-op-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.6px;
    color: var(--sk-muted);
    background: var(--sk-surface-3);
    padding: 3px 9px;
    border-radius: 6px;
    border: 1px solid var(--sk-border);
    white-space: nowrap;
}

/* ── Nombre de la operación ─────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_record .fw-bold.fs-4,
.o_stock_kanban .o_kanban_record a.fw-bold {
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 1.05rem !important;
    font-weight: 800 !important;
    color: var(--sk-text) !important;
    text-decoration: none !important;
    letter-spacing: -0.3px;
    line-height: 1.35;
    display: block;
    white-space: normal !important;
    word-break: break-word;
}
.o_stock_kanban .o_kanban_record a.fw-bold:hover {
    color: var(--sk-int) !important;
}

/* ── Warehouse badge ────────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_record [name="warehouse_id"] {
    display: inline-flex !important;
    margin-top: 5px;
}
.o_stock_kanban .o_kanban_record [name="warehouse_id"] span,
.o_stock_kanban .o_kanban_record [name="warehouse_id"] .o_field_char {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.62rem !important;
    color: var(--sk-muted) !important;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    background: var(--sk-surface-2);
    padding: 3px 9px;
    border-radius: 6px;
    border: 1px solid var(--sk-border);
}

/* ── Separador ──────────────────────────────────────────────────────────────── */
.o_stock_kanban [name="stock_picking"] .row.mt-3 {
    margin-top: 18px !important;
    padding-top: 16px !important;
    border-top: 1px solid var(--sk-border) !important;
    align-items: flex-start;
}

/* ── Botón principal ─────────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_record .btn.btn-primary {
    background: var(--sk-accent) !important;
    border: none !important;
    border-radius: var(--sk-r-sm) !important;
    color: #fff !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    font-size: 0.78rem !important;
    font-weight: 700 !important;
    padding: 10px 14px !important;
    width: 100% !important;
    text-align: center !important;
    white-space: normal !important;
    word-break: break-word !important;
    transition: filter var(--sk-ease), transform var(--sk-ease), box-shadow var(--sk-ease) !important;
    box-shadow: 0 2px 8px rgba(245,158,11,0.25) !important;
    line-height: 1.45 !important;
    min-height: 52px;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-direction: column !important;
}

/* Colores por tipo */
.o_stock_kanban .o_kanban_record[data-op-type="incoming"]  .btn.btn-primary {
    background: var(--sk-inc) !important;
    box-shadow: 0 2px 8px rgba(16,185,129,0.25) !important;
    color: #fff !important;
}
.o_stock_kanban .o_kanban_record[data-op-type="outgoing"]  .btn.btn-primary {
    background: var(--sk-out) !important;
    box-shadow: 0 2px 8px rgba(239,68,68,0.25) !important;
    color: #fff !important;
}
.o_stock_kanban .o_kanban_record[data-op-type="internal"]  .btn.btn-primary {
    background: var(--sk-int) !important;
    box-shadow: 0 2px 8px rgba(99,102,241,0.25) !important;
    color: #fff !important;
}
.o_stock_kanban .o_kanban_record[data-op-type="mrp_operation"] .btn.btn-primary {
    background: var(--sk-mrp) !important;
    box-shadow: 0 2px 8px rgba(249,115,22,0.25) !important;
    color: #fff !important;
}

.o_stock_kanban .o_kanban_record .btn.btn-primary:hover {
    filter: brightness(1.08) !important;
    transform: scale(1.02) !important;
}

/* Número grande dentro del botón */
.o_stock_kanban .o_kanban_record .btn.btn-primary .o_field_integer {
    font-size: 1.5rem !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-weight: 600 !important;
    display: block;
    line-height: 1;
    margin-bottom: 2px;
}

/* ── Stats links ─────────────────────────────────────────────────────────────── */
.o_stock_kanban .stock-overview-links {
    display: flex !important;
    flex-direction: column !important;
    gap: 3px !important;
    padding-left: 10px !important;
}

/* Anular offset Bootstrap */
.o_stock_kanban .stock-overview-links .col-8.offset-4,
.o_stock_kanban .stock-overview-links [class*="offset-"] {
    margin-left: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
    flex: 0 0 100% !important;
    padding: 0 !important;
}

.o_stock_kanban .stock-overview-links a {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    text-decoration: none !important;
    color: var(--sk-text2) !important;
    font-size: 0.75rem !important;
    font-weight: 500 !important;
    padding: 5px 8px !important;
    border-radius: 8px !important;
    transition: all var(--sk-ease) !important;
    border: 1px solid transparent !important;
    width: 100% !important;
    white-space: nowrap !important;
}
.o_stock_kanban .stock-overview-links a .row {
    display: flex !important;
    width: 100% !important;
    justify-content: space-between !important;
    align-items: center !important;
    margin: 0 !important;
    gap: 8px;
    flex-wrap: nowrap;
}
.o_stock_kanban .stock-overview-links a span.col-6 {
    font-size: 0.73rem !important;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.o_stock_kanban .stock-overview-links a:hover {
    background: var(--sk-surface-2) !important;
    border-color: var(--sk-border) !important;
    color: var(--sk-text) !important;
}

/* Colores semánticos */
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_waiting"]        { color: #d97706 !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_waiting"]:hover  { background: rgba(245,158,11,0.08) !important; border-color: rgba(245,158,11,0.2) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_late"]           { color: var(--sk-out) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_late"]:hover     { background: rgba(239,68,68,0.08) !important; border-color: rgba(239,68,68,0.2) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_backorder"]      { color: var(--sk-mrp) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_backorder"]:hover{ background: rgba(249,115,22,0.08) !important; border-color: rgba(249,115,22,0.2) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_type_ready_moves"]    { color: var(--sk-int) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_type_ready_moves"]:hover{ background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.2) !important; }

/* Número en stats */
.o_stock_kanban .stock-overview-links .o_field_integer,
.o_stock_kanban .stock-overview-links .o_field_integer span {
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.72rem !important;
    font-weight: 600 !important;
    background: var(--sk-surface-3);
    padding: 1px 6px;
    border-radius: 5px;
    border: 1px solid var(--sk-border);
    color: var(--sk-text) !important;
    min-width: 24px;
    text-align: center;
    display: inline-block;
}

/* ── Gráfico ─────────────────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_record [name="kanban_dashboard_graph"] {
    margin-top: 16px !important;
    border-top: 1px solid var(--sk-border) !important;
    padding-top: 12px !important;
    opacity: 0.7;
    transition: opacity var(--sk-ease);
}
.o_stock_kanban .o_kanban_record:hover [name="kanban_dashboard_graph"] { opacity: 1; }

/* ── Header / botón menú ─────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_record .o_kanban_record_header {
    background: transparent !important;
    border-bottom: none !important;
    padding: 12px 14px 0 !important;
}
.o_stock_kanban .o_kanban_manage_toggle_button,
.o_stock_kanban .o_kanban_record_header .o_dropdown_caret {
    color: var(--sk-muted) !important;
    opacity: 0 !important;
    transition: opacity var(--sk-ease) !important;
}
.o_stock_kanban .o_kanban_record:hover .o_kanban_manage_toggle_button,
.o_stock_kanban .o_kanban_record:hover .o_dropdown_caret { opacity: 1 !important; }

/* ── Dropdown menú ───────────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_card_manage_pane,
.o_stock_kanban .o-dropdown--menu {
    background: var(--sk-surface) !important;
    border: 1px solid var(--sk-border-h) !important;
    border-radius: var(--sk-r-sm) !important;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
    padding: 12px !important;
}
.o_stock_kanban .o_kanban_card_manage_pane .o_kanban_card_manage_title {
    color: var(--sk-muted) !important;
    font-size: 0.6rem !important;
    text-transform: uppercase !important;
    letter-spacing: 1.5px !important;
    font-family: 'JetBrains Mono', monospace !important;
    margin-bottom: 6px !important;
}
.o_stock_kanban .o_kanban_card_manage_pane a,
.o_stock_kanban .o-dropdown--menu a {
    color: var(--sk-text2) !important;
    font-size: 0.82rem !important;
    display: block;
    padding: 6px 8px !important;
    border-radius: 7px !important;
    transition: all var(--sk-ease) !important;
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    text-decoration: none !important;
}
.o_stock_kanban .o_kanban_card_manage_pane a:hover,
.o_stock_kanban .o-dropdown--menu a:hover {
    background: var(--sk-surface-2) !important;
    color: var(--sk-text) !important;
    padding-left: 14px !important;
}

/* ── Control panel ───────────────────────────────────────────────────────────── */
.o_stock_kanban .o_control_panel {
    background: var(--sk-bg) !important;
    border-bottom: 1px solid var(--sk-border) !important;
}

/* ── Scrollbar ───────────────────────────────────────────────────────────────── */
.o_stock_kanban ::-webkit-scrollbar { width: 4px; height: 4px; }
.o_stock_kanban ::-webkit-scrollbar-track { background: transparent; }
.o_stock_kanban ::-webkit-scrollbar-thumb { background: var(--sk-border-h); border-radius: 2px; }

/* ── Favorito ────────────────────────────────────────────────────────────────── */
.o_stock_kanban .o_priority_star { color: var(--sk-muted) !important; }
.o_stock_kanban .o_priority_star.fa-star { color: var(--sk-accent) !important; }

/* ── Ghost ───────────────────────────────────────────────────────────────────── */
.o_stock_kanban .o_kanban_ghost {
    min-width: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
}
`;

function injectDynamicStyles() {
    if (document.getElementById('sk-dynamic-styles')) return;
    const el = document.createElement('style');
    el.id = 'sk-dynamic-styles';
    el.textContent = DYNAMIC_CSS;
    document.head.appendChild(el);
}

// ─── Mejoras por tarjeta ─────────────────────────────────────────────────────
function enhanceCard(card) {
    if (card.dataset.skDone) return;
    card.dataset.skDone = '1';

    let code = '';
    const codeEl = card.querySelector('[name="code"]');
    if (codeEl) code = codeEl.textContent.trim();

    if (!code) {
        const btnTxt = card.querySelector('.btn.btn-primary')?.textContent || '';
        if (/receiv|recib/i.test(btnTxt))                    code = 'incoming';
        else if (/deliver|entreg/i.test(btnTxt))             code = 'outgoing';
        else if (/process|procesar|transfer|intern/i.test(btnTxt)) code = 'internal';
    }

    if (code) card.setAttribute('data-op-type', code);

    const late  = parseInt(card.querySelector('[name="count_picking_late"] span')?.textContent  || '0', 10);
    const ready = parseInt(card.querySelector('[name="count_picking_ready"] span')?.textContent || '0', 10);
    if (late  > 0) card.classList.add('sk-late');
    if (ready > 0) card.classList.add('sk-ready');

    injectBadge(card, code);

    const name = card.querySelector('.fw-bold.fs-4, a.fw-bold')?.textContent.trim() || '';
    if (name) {
        let tip = name;
        if (late  > 0) tip += `\n⚠️ ${late} con retraso`;
        else if (ready > 0) tip += `\n✅ ${ready} listas`;
        card.title = tip;
    }
}

function injectBadge(card, code) {
    if (card.querySelector('.sk-op-badge')) return;
    const nameEl = card.querySelector('.fw-bold.fs-4, a.fw-bold');
    if (!nameEl) return;

    const icon  = OPERATION_ICONS[code]  || '📦';
    const label = OPERATION_LABELS[code] || '';

    const badge = document.createElement('div');
    badge.className = 'sk-op-badge';
    badge.innerHTML = `<span class="sk-op-icon">${icon}</span>${label ? `<span class="sk-op-label">${label}</span>` : ''}`;
    nameEl.parentNode.insertBefore(badge, nameEl);
}

// ─── MutationObserver ────────────────────────────────────────────────────────
function observeKanban() {
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.classList?.contains('o_kanban_record')) {
                    enhanceCard(node);
                } else {
                    node.querySelectorAll?.('.o_kanban_record').forEach(c => {
                        if (c.closest('.o_stock_kanban')) enhanceCard(c);
                    });
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function processExisting() {
    document.querySelectorAll('.o_stock_kanban .o_kanban_record').forEach(enhanceCard);
}

// ─── Observer para cambios de tema claro/oscuro en tiempo real ───────────────
// Odoo 17/18/19 agrega/quita la clase `o_dark` en el <html> al cambiar tema.
// El CSS ya maneja el cambio de variables via html.o_dark selector,
// pero las tarjetas ya procesadas necesitan re-procesar sus clases de estado.
function observeThemeChange() {
    const htmlEl = document.documentElement;
    let wasDark = htmlEl.classList.contains('o_dark');

    const themeObserver = new MutationObserver(() => {
        const isDark = htmlEl.classList.contains('o_dark');
        if (isDark !== wasDark) {
            wasDark = isDark;
            // Re-procesar tarjetas para actualizar clases de estado si es necesario
            // El CSS se actualiza solo via variables, esto es solo por si acaso
            document.querySelectorAll('.o_stock_kanban .o_kanban_record[data-sk-done]')
                .forEach(card => {
                    // noop - el CSS lo maneja solo con variables
                });
        }
    });

    themeObserver.observe(htmlEl, { attributes: true, attributeFilter: ['class'] });
}

// ─── Init ────────────────────────────────────────────────────────────────────
function init() {
    injectDynamicStyles();
    observeKanban();
    observeThemeChange();
    setTimeout(processExisting, 350);
}

if (document.body) {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}