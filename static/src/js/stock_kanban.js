/** @odoo-module **/

/**
 * Stock Kanban Redesign - Alphaqueb Consulting
 * Compatible Odoo 19
 *
 * En Odoo 19 el patch de KanbanRecord.prototype con useRef('root') ya no
 * funciona confiablemente. Usamos MutationObserver para detectar tarjetas
 * cuando se renderizan y aplicar mejoras visuales sin tocar OWL.
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

// ─── CSS completo inyectado vía JS (evita problemas de carga de assets) ───────
const DYNAMIC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');

.o_stock_kanban {
    --sk-bg:           #0d0f18;
    --sk-surface:      #161926;
    --sk-surface-2:    #1e2235;
    --sk-border:       rgba(255,255,255,0.07);
    --sk-border-h:     rgba(255,255,255,0.14);
    --sk-accent:       #f0c040;
    --sk-inc:          #00d4aa;
    --sk-out:          #ff6b6b;
    --sk-int:          #7c8ef7;
    --sk-mrp:          #fd9644;
    --sk-text:         #eef0f8;
    --sk-text2:        #8b8fa8;
    --sk-muted:        #525670;
    --sk-r:            16px;
    --sk-r-sm:         8px;
    --sk-ease:         0.22s cubic-bezier(0.4,0,0.2,1);
}

/* Board */
.o_stock_kanban,
.o_stock_kanban .o_kanban_renderer,
.o_stock_kanban .o_renderer {
    background: var(--sk-bg) !important;
    font-family: 'DM Sans', sans-serif !important;
}
.o_stock_kanban .o_kanban_renderer,
.o_stock_kanban .o_renderer {
    padding: 20px !important;
    gap: 18px !important;
    align-items: flex-start !important;
}

/* Tarjeta */
.o_stock_kanban .o_kanban_record {
    background: var(--sk-surface) !important;
    border: 1px solid var(--sk-border) !important;
    border-radius: var(--sk-r) !important;
    box-shadow: 0 6px 24px rgba(0,0,0,0.35) !important;
    transition: transform var(--sk-ease), box-shadow var(--sk-ease), border-color var(--sk-ease) !important;
    overflow: hidden !important;
    width: 290px !important;
    min-width: 290px !important;
    max-width: 290px !important;
    position: relative !important;
    padding: 0 !important;
    font-family: 'DM Sans', sans-serif !important;
}
.o_stock_kanban .o_kanban_record:hover {
    transform: translateY(-5px) !important;
    box-shadow: 0 18px 48px rgba(0,0,0,0.55) !important;
    border-color: var(--sk-border-h) !important;
}

/* Línea acento */
.o_stock_kanban .o_kanban_record::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--sk-accent);
    transition: height var(--sk-ease);
    z-index: 2;
}
.o_stock_kanban .o_kanban_record:hover::before { height: 4px; }
.o_stock_kanban .o_kanban_record[data-op-type="incoming"]::before      { background: var(--sk-inc); }
.o_stock_kanban .o_kanban_record[data-op-type="outgoing"]::before      { background: var(--sk-out); }
.o_stock_kanban .o_kanban_record[data-op-type="internal"]::before      { background: var(--sk-int); }
.o_stock_kanban .o_kanban_record[data-op-type="mrp_operation"]::before { background: var(--sk-mrp); }

/* Punto verde (listas) */
.o_stock_kanban .o_kanban_record.sk-ready::after {
    content: '';
    position: absolute;
    top: 12px; right: 14px;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--sk-inc);
    box-shadow: 0 0 8px rgba(0,212,170,0.7);
    animation: sk-blink 2s ease-in-out infinite;
    z-index: 3;
}

/* Pulso tardías */
@keyframes sk-late-pulse {
    0%,100% { border-color: rgba(255,107,107,0.15); }
    50%      { border-color: rgba(255,107,107,0.45); }
}
.o_stock_kanban .o_kanban_record.sk-late {
    animation: sk-late-pulse 2.5s ease-in-out infinite !important;
}

@keyframes sk-blink {
    0%,100% { opacity:1; }
    50%      { opacity:0.25; }
}

/* Entrada animada */
@keyframes sk-in {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
}
.o_stock_kanban .o_kanban_record { animation: sk-in 0.35s ease both; }
.o_stock_kanban .o_kanban_record:nth-child(1){animation-delay:.04s}
.o_stock_kanban .o_kanban_record:nth-child(2){animation-delay:.08s}
.o_stock_kanban .o_kanban_record:nth-child(3){animation-delay:.12s}
.o_stock_kanban .o_kanban_record:nth-child(4){animation-delay:.16s}
.o_stock_kanban .o_kanban_record:nth-child(5){animation-delay:.20s}
.o_stock_kanban .o_kanban_record:nth-child(6){animation-delay:.24s}
.o_stock_kanban .o_kanban_record:nth-child(7){animation-delay:.28s}
.o_stock_kanban .o_kanban_record:nth-child(8){animation-delay:.32s}

/* Contenido */
.o_stock_kanban .o_kanban_record .o_kanban_record_body,
.o_stock_kanban .o_kanban_record .o_kanban_card_content,
.o_stock_kanban [name="stock_picking"] {
    padding: 18px 18px 14px !important;
    background: transparent !important;
}

/* Badge tipo (inyectado por JS) */
.sk-op-badge { display:flex; align-items:center; gap:6px; margin-bottom:10px; }
.sk-op-icon  { font-size:1rem; line-height:1; }
.sk-op-label {
    font-family:'Space Mono',monospace;
    font-size:0.6rem; font-weight:400;
    text-transform:uppercase; letter-spacing:1.4px;
    color:var(--sk-muted);
    background:rgba(255,255,255,0.05);
    padding:2px 8px; border-radius:20px;
    border:1px solid rgba(255,255,255,0.07);
}

/* Nombre */
.o_stock_kanban .o_kanban_record .fw-bold.fs-4,
.o_stock_kanban .o_kanban_record a.fw-bold {
    font-family:'DM Sans',sans-serif !important;
    font-size:1rem !important; font-weight:700 !important;
    color:var(--sk-text) !important;
    text-decoration:none !important;
    letter-spacing:-0.2px; line-height:1.3; display:block;
}
.o_stock_kanban .o_kanban_record a.fw-bold:hover { color:#fff !important; }

/* Warehouse */
.o_stock_kanban .o_kanban_record [name="warehouse_id"] { display:inline-block !important; margin-top:3px; }
.o_stock_kanban .o_kanban_record [name="warehouse_id"] span,
.o_stock_kanban .o_kanban_record [name="warehouse_id"] .o_field_char {
    font-family:'Space Mono',monospace !important; font-size:0.62rem !important;
    color:var(--sk-muted) !important; text-transform:uppercase; letter-spacing:1px;
    background:var(--sk-surface-2); padding:2px 8px; border-radius:4px; border:1px solid var(--sk-border);
}

/* Botón principal */
.o_stock_kanban .o_kanban_record .btn.btn-primary {
    background: linear-gradient(135deg, var(--sk-accent), #d4a520) !important;
    border:none !important; border-radius:var(--sk-r-sm) !important;
    color:#0d0f18 !important; font-family:'DM Sans',sans-serif !important;
    font-size:0.75rem !important; font-weight:700 !important;
    padding:9px 12px !important; width:100% !important;
    text-align:center !important; white-space:normal !important;
    transition:filter var(--sk-ease), transform var(--sk-ease) !important;
    box-shadow:0 3px 10px rgba(240,192,64,0.22) !important;
    line-height:1.4 !important;
}
.o_stock_kanban .o_kanban_record[data-op-type="incoming"]  .btn.btn-primary { background:linear-gradient(135deg,var(--sk-inc),#00a885) !important; box-shadow:0 3px 10px rgba(0,212,170,0.22) !important; color:#0d0f18 !important; }
.o_stock_kanban .o_kanban_record[data-op-type="outgoing"]  .btn.btn-primary { background:linear-gradient(135deg,var(--sk-out),#d94f4f) !important; box-shadow:0 3px 10px rgba(255,107,107,0.22) !important; color:#fff !important; }
.o_stock_kanban .o_kanban_record[data-op-type="internal"]  .btn.btn-primary { background:linear-gradient(135deg,var(--sk-int),#5566d4) !important; box-shadow:0 3px 10px rgba(124,142,247,0.22) !important; color:#fff !important; }
.o_stock_kanban .o_kanban_record[data-op-type="mrp_operation"] .btn.btn-primary { background:linear-gradient(135deg,var(--sk-mrp),#d07820) !important; box-shadow:0 3px 10px rgba(253,150,68,0.22) !important; color:#0d0f18 !important; }

.o_stock_kanban .o_kanban_record .btn.btn-primary:hover { filter:brightness(1.12) !important; transform:scale(1.02) !important; }
.o_stock_kanban .o_kanban_record .btn.btn-primary .o_field_integer {
    font-size:1.2rem !important; font-family:'Space Mono',monospace !important;
    display:block; margin-bottom:1px;
}

/* Stats links */
.o_stock_kanban .stock-overview-links { display:flex !important; flex-direction:column !important; gap:4px !important; padding-left:6px !important; }
.o_stock_kanban .stock-overview-links .col-8.offset-4,
.o_stock_kanban .stock-overview-links [class*="offset-"] {
    margin-left:0 !important; max-width:100% !important;
    width:100% !important; flex:0 0 100% !important; padding:0 !important;
}
.o_stock_kanban .stock-overview-links a {
    display:flex !important; align-items:center !important;
    justify-content:space-between !important; text-decoration:none !important;
    color:var(--sk-text2) !important; font-size:0.73rem !important; font-weight:500 !important;
    padding:4px 7px !important; border-radius:6px !important;
    transition:all var(--sk-ease) !important; border:1px solid transparent !important; width:100% !important;
}
.o_stock_kanban .stock-overview-links a .row {
    display:flex !important; width:100% !important;
    justify-content:space-between !important; align-items:center !important;
    margin:0 !important; gap:4px;
}
.o_stock_kanban .stock-overview-links a span { font-size:0.71rem !important; }
.o_stock_kanban .stock-overview-links a:hover { background:var(--sk-surface-2) !important; border-color:var(--sk-border) !important; color:var(--sk-text) !important; }

.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_waiting"]    { color:#f0c040 !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_waiting"]:hover  { background:rgba(240,192,64,0.07) !important; border-color:rgba(240,192,64,0.18) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_late"]       { color:#ff6b6b !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_late"]:hover     { background:rgba(255,107,107,0.07) !important; border-color:rgba(255,107,107,0.18) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_backorder"]  { color:#fd9644 !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_tree_backorder"]:hover{ background:rgba(253,150,68,0.07) !important; border-color:rgba(253,150,68,0.18) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_type_ready_moves"]{ color:var(--sk-int) !important; }
.o_stock_kanban .stock-overview-links a[name="get_action_picking_type_ready_moves"]:hover { background:rgba(124,142,247,0.07) !important; border-color:rgba(124,142,247,0.18) !important; }

.o_stock_kanban .stock-overview-links .o_field_integer span,
.o_stock_kanban .stock-overview-links .o_field_integer {
    font-family:'Space Mono',monospace !important; font-size:0.7rem !important; font-weight:700 !important;
    background:rgba(255,255,255,0.07); padding:1px 5px; border-radius:4px;
}

/* Gráfico */
.o_stock_kanban .o_kanban_record [name="kanban_dashboard_graph"] {
    margin-top:14px !important; border-top:1px solid var(--sk-border) !important;
    padding-top:10px !important; opacity:0.65; transition:opacity var(--sk-ease);
}
.o_stock_kanban .o_kanban_record:hover [name="kanban_dashboard_graph"] { opacity:1; }

/* Header record / menú toggle */
.o_stock_kanban .o_kanban_record .o_kanban_record_header { background:transparent !important; border-bottom:none !important; padding:10px 14px 0 !important; }
.o_stock_kanban .o_kanban_manage_toggle_button,
.o_stock_kanban .o_kanban_record_header .o_dropdown_caret { color:var(--sk-muted) !important; opacity:0 !important; transition:opacity var(--sk-ease) !important; }
.o_stock_kanban .o_kanban_record:hover .o_kanban_manage_toggle_button,
.o_stock_kanban .o_kanban_record:hover .o_dropdown_caret { opacity:1 !important; }

/* Dropdown */
.o_stock_kanban .o_kanban_card_manage_pane,
.o_stock_kanban .o-dropdown--menu {
    background:#1c2030 !important; border:1px solid var(--sk-border-h) !important;
    border-radius:var(--sk-r-sm) !important; box-shadow:0 16px 48px rgba(0,0,0,0.5) !important; padding:14px !important;
}
.o_stock_kanban .o_kanban_card_manage_pane .o_kanban_card_manage_title {
    color:var(--sk-muted) !important; font-size:0.6rem !important;
    text-transform:uppercase !important; letter-spacing:1.5px !important;
    font-family:'Space Mono',monospace !important; margin-bottom:6px !important;
}
.o_stock_kanban .o_kanban_card_manage_pane a,
.o_stock_kanban .o-dropdown--menu a {
    color:var(--sk-text2) !important; font-size:0.8rem !important; display:block;
    padding:5px 6px !important; border-radius:5px !important;
    transition:all var(--sk-ease) !important; font-family:'DM Sans',sans-serif !important; text-decoration:none !important;
}
.o_stock_kanban .o_kanban_card_manage_pane a:hover,
.o_stock_kanban .o-dropdown--menu a:hover { background:var(--sk-surface-2) !important; color:var(--sk-text) !important; padding-left:12px !important; }

/* Control panel */
.o_stock_kanban .o_control_panel { background:var(--sk-bg) !important; border-bottom:1px solid var(--sk-border) !important; }

/* Scrollbar */
.o_stock_kanban ::-webkit-scrollbar { width:3px; height:3px; }
.o_stock_kanban ::-webkit-scrollbar-track { background:transparent; }
.o_stock_kanban ::-webkit-scrollbar-thumb { background:var(--sk-border-h); border-radius:2px; }

/* Favorito */
.o_stock_kanban .o_priority_star { color:var(--sk-muted) !important; }
.o_stock_kanban .o_priority_star.fa-star { color:var(--sk-accent) !important; }

/* Ghost */
.o_stock_kanban .o_kanban_ghost { min-width:290px !important; max-width:290px !important; }
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

    // Obtener code del tipo de operación
    // Odoo 19: el campo invisible "code" puede estar en un span oculto o en data
    let code = '';
    const codeEl = card.querySelector('[name="code"]');
    if (codeEl) code = codeEl.textContent.trim();

    // Fallback: inferir del texto del botón CTA
    if (!code) {
        const btnTxt = card.querySelector('.btn.btn-primary')?.textContent || '';
        if (/receiv|recib/i.test(btnTxt))       code = 'incoming';
        else if (/deliver|entreg/i.test(btnTxt)) code = 'outgoing';
        else if (/process|procesar|transfer/i.test(btnTxt)) code = 'internal';
    }

    if (code) card.setAttribute('data-op-type', code);

    // Contadores
    const late  = parseInt(card.querySelector('[name="count_picking_late"] span')?.textContent || '0', 10);
    const ready = parseInt(card.querySelector('[name="count_picking_ready"] span')?.textContent || '0', 10);
    if (late  > 0) card.classList.add('sk-late');
    if (ready > 0) card.classList.add('sk-ready');

    // Badge
    injectBadge(card, code);

    // Tooltip
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
                    node.querySelectorAll?.('.o_stock_kanban .o_kanban_record, .o_kanban_record').forEach(c => {
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

// ─── Init ────────────────────────────────────────────────────────────────────
injectDynamicStyles();
observeKanban();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processExisting);
} else {
    setTimeout(processExisting, 350);
}