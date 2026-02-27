{
    'name': 'Stock Kanban Redesign',
    'version': '19.0.1.0.0',
    'summary': 'Rediseño visual del dashboard kanban de operaciones de inventario',
    'category': 'Inventory',
    'depends': ['stock'],
    'data': [
        'views/stock_picking_type_kanban_view.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'stock_kanban_redesign/static/src/css/stock_kanban.css',
            'stock_kanban_redesign/static/src/js/stock_kanban.js',
        ],
    },
    'installable': True,
    'auto_install': False,
    'license': 'LGPL-3',
}