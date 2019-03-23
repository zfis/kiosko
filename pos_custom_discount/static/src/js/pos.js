odoo.define('pos_custom_discount', function (require) {
"use strict";

	var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var utils = require('web.utils');
    var gui = require('point_of_sale.gui');
    var PosPopWidget = require('point_of_sale.popups');
    var round_pr = utils.round_precision;
    var core = require('web.core');
    var QWeb = core.qweb;
    var _t = core._t;

    models.load_fields('res.users',['allow_customize_discount','ask_pin_for_customize','pos_security_pin']);

    models.load_models([{
        model: 'pos.fix.discount',
        condition: function(self){ return self.config.allow_to_give_discount; },
        domain: function(self){ return [['id','in', self.config.pos_fixed_discount]]; },
        fields: ['name','discount'],
        loaded: function(self,pos_discount){ 
            self.pos_discount = pos_discount;
        },
    }],{'after': 'product.product'});

    var CustomDiscountButton = screens.ActionButtonWidget.extend({
        template: 'CustomDiscountButton',
        button_click: function(){
            var self = this;
            var ret = new $.Deferred();
            var scashier = self.pos.get_cashier();
            var cashiers = self.pos.users,cashier;
            var cashier = {};
            for(var i=0;i<cashiers.length;i++){
                if(cashiers[i].id === scashier.id){
                    cashier = cashiers[i];
                }
            }

            if(cashier.allow_customize_discount){
                if(cashier.ask_pin_for_customize){
                    var password = cashier.pos_security_pin;
                    self.gui.show_popup('password',{
                        'title': _t('Password ?'),
                        confirm: function(pw) {
                            if (pw !== password) {
                                self.gui.show_popup('error',_t('Incorrect Password'));
                                ret.reject();
                            } else {
                                self.gui.show_popup('custom-discount-popup');
                            }
                        },
                    }); 
                }
                else{
                    self.gui.show_popup('custom-discount-popup');
                }               
            }
            else{
                alert("Sorry you are not allowed to access custom discount.");
            }
        },
    });
    screens.define_action_button({
        'name': 'custom-discount-button',
        'widget': CustomDiscountButton,
        'condition': function(){
            return this.pos.config.allow_to_give_discount;
        },
    });

    var CustomDiscountPopupWidget = PosPopWidget.extend({
        template: 'CustomDiscountPopupWidget',
        renderElement:function(options){
            var self = this;
            this._super(options);

            $(".specific_line").click(function(){
                var table_list = [];
                var orderline = self.pos.get_order().get_selected_orderline();
                if(orderline){
                    orderline.set_discount($(".discount_amount").val());
                    orderline.set_discount_note($(".discount_note").val());
                }
                else{
                    alert("Please select the orderline.");
                }
                self.gui.close_popup();
            });
            $(".all_order").click(function(){
                var table_list = [];
                var order = self.pos.get_order();
                var order_line = order.get_orderlines();
                for(var j=0;j<order_line.length;j++){
                    order_line[j].set_discount($(".discount_amount").val());
                    order_line[j].set_discount_note($(".discount_note").val());
                }
                self.gui.close_popup();
            });
        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options); 
            this.renderElement(options);
        },
    });

    gui.define_popup({
        'name': 'custom-discount-popup', 
        'widget': CustomDiscountPopupWidget,
    });

    var FixDiscountPopupWidget = PosPopWidget.extend({
        template: 'FixDiscountPopupWidget',

        renderElement:function(options){
            var self = this;
            this._super(options);
            $(".merge-table").click(function(){
                $(".merge-table").removeClass("selected-marge-table");
                if($(this).hasClass("selected-marge-table")){
                    $(this).removeClass("selected-marge-table");
                }
                else{
                    $(this).addClass("selected-marge-table");
                }
            });
            $(".specific_line").click(function(){
                var table_list = [];
                var orderline = self.pos.get_order().get_selected_orderline();
                if(orderline){
                    orderline.set_discount($(".selected-marge-table").data("discount"));
                }
                else{
                    alert("Please select the orderline.");
                }
                self.gui.close_popup();
            });
            $(".all_order").click(function(){
                var table_list = [];
                var order = self.pos.get_order();
                var order_line = order.get_orderlines();
                for(var j=0;j<order_line.length;j++){
                    order_line[j].set_discount($(".selected-marge-table").data("discount"))
                }
                self.gui.close_popup();
            });
        },
        show: function(options){
            this.options = options || {};
            var self = this;
            this._super(options); 
            this.renderElement(options);
        },
    });

    gui.define_popup({
        'name': 'fix-discount-popup', 
        'widget': FixDiscountPopupWidget,
    });

    screens.NumpadWidget.include({
        clickChangeMode: function(event) {
            var newMode = event.currentTarget.attributes['data-mode'].nodeValue;
            if(this.pos.config.allow_to_give_discount){
                if(newMode == 'discount'){
                    this.gui.show_popup('fix-discount-popup');
                    return this.state.changeMode('quantity');
                }
            }
            return this.state.changeMode(newMode);
        },
    });
    var _super_orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function(attr, options) {
            _super_orderline.initialize.call(this,attr,options);
            this.discount_note = this.discount_note || "";
        },
        set_discount_note: function(discount_note){
            this.discount_note = discount_note;
            this.trigger('change',this);
        },
        export_as_JSON: function(){
            var json = _super_orderline.export_as_JSON.call(this);
            json.discount_note = this.discount_note;
            return json;
        },
        init_from_JSON: function(json){
            _super_orderline.init_from_JSON.apply(this,arguments);
            this.discount_note = json.discount_note;
        },
        export_for_printing: function(){
            var data = _super_orderline.export_for_printing.apply(this, arguments);
            data.discount_note = this.discount_note || "";
            return data;
        }
    });
});

