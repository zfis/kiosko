# -*- coding: utf-8 -*-

from odoo import fields, models,tools,api,_

class ResUsers(models.Model):
    _inherit = 'res.users' 
    
    allow_customize_discount = fields.Boolean(string='Allow Customize Discount')
    ask_pin_for_customize = fields.Boolean(string="Ask Pin for Customize Discount")

class PosFixDiscount(models.Model):
    _name = "pos.fix.discount"

    name = fields.Char(string="Name")
    discount = fields.Float(string="Discount")
    discription = fields.Text(string="Desceiption")

class PosConfig(models.Model):
    _inherit = 'pos.config' 
    
    allow_to_give_discount = fields.Boolean(string='Allow to Give Discount', default=True)
    pos_fixed_discount = fields.Many2many("pos.fix.discount","fix_discount_config_id",'fix_discount_id','pos_config_id')



class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    discount_note = fields.Char('Note')







