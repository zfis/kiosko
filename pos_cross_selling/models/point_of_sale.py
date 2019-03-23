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

from openerp import models, fields, api, _
import time

class pos_config(models.Model):
    _inherit = "pos.config"

    enable_cross_selling = fields.Boolean("Enable Cross Selling")

class pos_order(models.Model):
    _inherit = 'pos.order'

    @api.model
    def create(self, values):
        order_id = super(pos_order, self).create(values)
        if values.get('lines'):
            prod_cross_sell = []
            for line in values.get('lines'):
                if line[2].get('parent_line'):
                    prod_cross_sell.append(line[2].get('product_id'))
            if prod_cross_sell:
                self.env['product.cross.selling.history'].create(
                                                        {'order_id': order_id.id,
                                                         'user_id': self._uid,
                                                         'date': time.strftime('%Y-%m-%d'),
                                                         'sell_time': time.strftime('%H:%M:%S'),
                                                         'product_ids': [(6, 0, prod_cross_sell)],
                                                        })
        return order_id 
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
