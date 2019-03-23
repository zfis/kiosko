# -*- coding: utf-8 -*-
#################################################################################
# Author      : Acespritech Solutions Pvt. Ltd. (<www.acespritech.com>)
# Copyright(c): 2012-Present Acespritech Solutions Pvt. Ltd.
# All Rights Reserved.
#
# This program is copyright property of the author mentioned above.
# You can`t redistribute it and/or modify it.
#
#################################################################################

{
    'name': 'POS Cross Selling',
    'version': '1.0',
    'category': 'Point of Sale',
    'summary': 'POS Cross Selling',
    'description': """
This module is used to configure product offers and enable duing sales from POS.
""",
    'author': 'Acespritech Solutions Pvt. Ltd.',
    'website': 'http://www.acespritech.com',
    'price': 22.00,
    'currency': 'EUR',
    'version': '1.0.1',
    'depends': ['base', 'point_of_sale'],
    'images': ['static/description/main_screenshot.png'],
    "data": [
        'security/ir.model.access.csv',
        'views/pos_cross_selling.xml',
        'views/pos_cross_selling_view.xml',
        'views/point_of_sale_view.xml'
    ],
    'qweb': [
            'static/src/xml/pos.xml'
    ],
    'installable': True,
    'auto_install': False,
}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: