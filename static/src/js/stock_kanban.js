/** @odoo-module **/

import { KanbanRecord } from "@web/views/kanban/kanban_record";
import { patch } from "@web/core/utils/patch";
import { onMounted, useRef } from "@odoo/owl";

/**
 * Stock Kanban Redesign - Alphaqueb Consulting
 * Mejora visual del dashboard de operaciones de inventario.
 * 
 * - Aplica `data-operation-type` a cada tarjeta para el accent de color por CSS.
 * - Añade tooltips nativos y mejora la accesibilidad.
 * - Añade indicadores visuales de estado al botón principal.
 */

const OPERATION_ICONS = {
    incoming: '📥',
    outgoing: '📤',
    internal: '🔄',
    mrp_operation: '🏭',
    default: '📦',
};

const OPERATION_LABELS = {
    incoming: 'Recepción',
    outgoing: 'Entrega',
    internal: 'Transferencia Interna',
    mrp_operation: 'Fabricación',
};

patch(KanbanRecord.prototype, {
    setup() {
        super.setup(...arguments);
        this._stockKanbanRef = useRef('root');

        onMounted(() => {
            this._applyStockKanbanEnhancements();
        });
    },

    _applyStockKanbanEnhancements() {
        const rootEl = this._stockKanbanRef.el;
        if (!rootEl) return;

        // Solo aplicar en el kanban de stock.picking.type
        const kanbanEl = rootEl.closest('.o_stock_kanban');
        if (!kanbanEl) return;

        const record = this.props.record;
        if (!record || !record.data) return;

        const code = record.data.code || 'default';
        const name = record.data.name || '';
        const countReady = record.data.count_picking_ready || 0;
        const countWaiting = record.data.count_picking_waiting || 0;
        const countLate = record.data.count_picking_late || 0;

        // Aplicar data-attribute para CSS accent por tipo
        const card = rootEl.closest('.o_kanban_card');
        if (card) {
            card.setAttribute('data-operation-type', code);

            // Añadir icono de tipo de operación al header si no existe
            this._injectOperationBadge(card, code, name);

            // Añadir tooltip con resumen rápido
            this._injectStatsTooltip(card, { countReady, countWaiting, countLate, name });

            // Marcar tarjetas con alertas urgentes
            if (countLate > 0) {
                card.classList.add('sk-has-late');
            }
            if (countReady > 0) {
                card.classList.add('sk-has-ready');
            }
        }
    },

    _injectOperationBadge(card, code, name) {
        // Evitar duplicados
        if (card.querySelector('.sk-op-badge')) return;

        const stockPickingEl = card.querySelector('[name="stock_picking"]');
        if (!stockPickingEl) return;

        const nameEl = stockPickingEl.querySelector('.fw-bold.fs-4');
        if (!nameEl) return;

        const icon = OPERATION_ICONS[code] || OPERATION_ICONS.default;
        const label = OPERATION_LABELS[code];

        const badge = document.createElement('div');
        badge.className = 'sk-op-badge';
        badge.innerHTML = `
            <span class="sk-op-icon">${icon}</span>
            ${label ? `<span class="sk-op-label">${label}</span>` : ''}
        `;

        // Insertar antes del nombre
        stockPickingEl.insertBefore(badge, nameEl);
    },

    _injectStatsTooltip(card, { countReady, countWaiting, countLate, name }) {
        let urgencyText = '';
        if (countLate > 0) urgencyText = `⚠️ ${countLate} con retraso`;
        else if (countWaiting > 0) urgencyText = `⏳ ${countWaiting} en espera`;
        else if (countReady > 0) urgencyText = `✅ ${countReady} listas`;
        else urgencyText = 'Sin operaciones pendientes';

        card.title = `${name}\n${urgencyText}`;
    },
});

// ---- Estilos dinámicos adicionales inyectados via JS ----
// (complementan el CSS estático con reglas que dependen de lógica)

const dynamicStyles = `
/* Badge de tipo de operación */
.sk-op-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
}

.sk-op-icon {
    font-size: 1.1rem;
    line-height: 1;
}

.sk-op-label {
    font-family: 'Space Mono', monospace;
    font-size: 0.62rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--sk-text-muted, #525670);
    background: rgba(255,255,255,0.05);
    padding: 2px 8px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.07);
}

/* Tarjetas con operaciones tardías: pulso sutil en el borde */
@keyframes sk-late-pulse {
    0%, 100% { border-color: rgba(255, 107, 107, 0.2); }
    50%       { border-color: rgba(255, 107, 107, 0.5); }
}

.o_stock_kanban .o_kanban_card.sk-has-late {
    animation: sk-card-in 0.4s ease both, sk-late-pulse 2.5s ease-in-out 0.5s infinite;
}

/* Punto de status en la línea de acento */
.o_stock_kanban .o_kanban_card.sk-has-ready::after {
    content: '';
    position: absolute;
    top: 10px;
    right: 12px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #00d4aa;
    box-shadow: 0 0 8px rgba(0, 212, 170, 0.6);
    animation: sk-dot-blink 2s ease-in-out infinite;
}

@keyframes sk-dot-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
}

/* Fix layout stat links - anular bootstrap offset */
.stock-overview-links .col-8.offset-4 {
    max-width: 100% !important;
    width: 100% !important;
    margin-left: 0 !important;
    flex: 0 0 100% !important;
    padding: 0 !important;
}

/* Separador sutil entre secciones del menú */
.o_stock_kanban .o_kanban_card_manage_pane .row + .row {
    border-top: 1px solid rgba(255,255,255,0.05);
    margin-top: 8px;
    padding-top: 8px;
}

/* Counter badge en los field integer de stats links */
.stock-overview-links .o_field_integer span {
    background: rgba(255,255,255,0.08);
    padding: 1px 6px;
    border-radius: 4px;
    font-family: 'Space Mono', monospace;
    font-size: 0.72rem;
}
`;

// Inyectar estilos dinámicos al DOM una sola vez
if (!document.getElementById('sk-dynamic-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'sk-dynamic-styles';
    styleEl.textContent = dynamicStyles;
    document.head.appendChild(styleEl);
}
