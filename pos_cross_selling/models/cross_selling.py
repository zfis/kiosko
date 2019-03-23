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

class product_cross_selling(models.Model):
    _name = 'product.cross.selling'
    _rec_name = 'product_id'

    product_id = fields.Many2one('product.product', string='Product',required=True,
                                 domain="[('available_in_pos', '=', True)]")
    lines = fields.One2many('product.cross.selling.line', 'cross_sell_id', 'Lines')
    active = fields.Boolean('Active', default=True)

    _sql_constraints = [
        ('product_cross_selling', 'unique(product_id)', 'This product is already configured!'),
    ]

    @api.model
    def find_cross_selling_products(self, product_id):
        lines = self.env['product.cross.selling.line'].search([('cross_sell_id.product_id', '=', product_id),
                                                               ('is_active', '=', 'yes'),
                                                               ('cross_sell_id.active', '=', True)])
        if not lines:
            return False
        cross_products = []
        for line in lines:
            cross_products.append({
                'product_id': line.product_id.id,
                'new_price': line.price_subtotal,
            })
        return cross_products


class product_cross_selling_line(models.Model):
    _name = 'product.cross.selling.line'

    @api.one
    @api.depends('discount', 'price_product_copy', 'discount_type')
    def _compute_price(self):
        if self.discount_type:
            if self.discount_type == 'fixed':
                self.price_subtotal = self.price_product_copy - self.discount
            else:
                disc = (self.price_product_copy * self.discount) / 100
                self.price_subtotal = self.price_product_copy - disc

    cross_sell_id = fields.Many2one('product.cross.selling', string='Cross Selling')
    product_id = fields.Many2one('product.product', string='Product',required=True,
                                 domain="[('available_in_pos', '=', True)]")
    is_active = fields.Selection([('yes', 'Yes'),
                                  ('no', 'No')],
                                 string='Active', default='yes')
    discount_type = fields.Selection([('fixed', 'Fixed'),
                                      ('percentage', 'Percentage')],
                                     string='Discount Type', default='percentage')
    discount = fields.Float('Discount')
    price_product_copy = fields.Float('Price')
    price_product = fields.Float(related="price_product_copy", readonly=True,string='Price')

    price_subtotal = fields.Float(string='Sub Total', readonly=True,
                                  compute='_compute_price', store=True)

    @api.onchange('product_id')
    def onchange_product_id(self):
        if self.product_id:
            self.price_product_copy = self.product_id.list_price

    @api.onchange('discount')
    def onchange_discount(self):
        if self.discount and self.discount_type and \
                        self.discount_type == 'percentage':
            if self.discount > 100:
                self.discount = 0


class product_cross_selling_history(models.Model):
    _name = 'product.cross.selling.history'
    _order = 'date desc'
    _rec_name = 'order_id'

    order_id = fields.Many2one('pos.order', 'POS Order', readonly=1)
    user_id = fields.Many2one('res.users', 'Cashier', readonly=1)
    product_ids = fields.Many2many('product.product', 'rel_pcsh_product',
                                   'history_id', 'product_id', string='Products', readonly=1)
    date = fields.Date('Date', readonly=1)
    sell_time = fields.Char('Time', readonly=1)

