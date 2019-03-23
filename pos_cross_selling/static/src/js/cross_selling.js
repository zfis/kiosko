odoo.define('cross_selling.pos', function (require) {
"use strict";

	var models = require('point_of_sale.models');
	var gui = require('point_of_sale.gui');
	var PopupWidget = require('point_of_sale.popups');
	var rpc = require('web.rpc');
	var screens = require('point_of_sale.screens');

	screens.OrderWidget.include({
		init: function(parent, options) {
			var self = this;
	        this._super(parent,options);
	        this.parent = parent;
		},
		render_orderline: function(orderline){
			var self = this;
			var el_node = self._super(orderline);
			var el_cross_selling_icon = el_node.querySelector('.cross_selling_icon');
	        if(el_cross_selling_icon){
	        	el_cross_selling_icon.addEventListener('click', (function() {
	                self.show_cross_selling_items(orderline);
	            }.bind(this)));
	        }
	        return el_node;
		},
		show_cross_selling_items: function(orderline){
			var self = this;
			var cross_selling_products = []
			var order = this.pos.get_order();
			if(orderline.get_cross_selling_items().length > 0){
				_.each(orderline.get_cross_selling_items(), function(item){
					var product = _.extend({}, self.pos.db.get_product_by_id(item.product_id))
					var cross_selling_price = product.get_cross_selling_price(orderline);
					product['cross_selling_price'] = cross_selling_price;
					var db_product = self.pos.db.get_product_by_id(product.id);
					db_product['cross_selling_price'] = cross_selling_price;
					cross_selling_products.push(product);
					var current_pricelist = self.parent.product_list_widget._get_active_pricelist();
			        var cache_key = self.parent.product_list_widget.calculate_cache_key(product, current_pricelist);
			        self.parent.product_list_widget.product_cache.clear_node(cache_key);
				})
				order.set_cross_selling_mode(true);
				self.parent.product_list_widget.set_product_list(cross_selling_products);
				
			}
		},
	});

	var _super_Order = models.Order.prototype;
    models.Order = models.Order.extend({
    	initialize: function(attributes, options){
    		_super_Order.initialize.apply(this, arguments);
    		this.set({
    			cross_selling_mode: false,
    		});
    		this.reset_cross_selling_items();
    	},
    	add_product:function(product, options){
    		var self = this;
    		_super_Order.add_product.apply(this, arguments);
    		var params = {
    			model: 'product.cross.selling',
    			method: 'find_cross_selling_products',
    			args: [product.id],
    		}
    		rpc.query(params, {async: false}).then(function(cross_selling_products){
    			if(cross_selling_products && cross_selling_products.length > 0){
    				var selected_orderline = self.get_selected_orderline()
    				if(selected_orderline){
    					selected_orderline.set_cross_selling_items(cross_selling_products);
    				}
    			}
    		});
    		if(product.cross_selling_price && options.parent_line){
    			this.get_selected_orderline().set_unit_price(product.cross_selling_price);
    			this.get_selected_orderline().set_cross_selling_parent_line(options.parent_line);
    		}
    	},
    	set_cross_selling_mode: function(mode){
    		this.set('cross_selling_mode', mode);
    	},
    	get_cross_selling_mode: function(){
    		return this.get('cross_selling_mode');
    	},
    	reset_cross_selling_items: function(){
    		var self = this;
    		_.each(self.pos.db.get_product_by_category(0), function(product){
				product['cross_selling_price'] = false;
				var product_obj = new models.Product({}, product);
				product_obj['cross_selling_price'] = false;
				var current_pricelist = self.pricelist;
				if(_.size(self.pos.gui.screen_instances) > 0){					
			        var cache_key = self.pos.gui.screen_instances.products.product_list_widget.calculate_cache_key(product_obj, current_pricelist);
			        self.pos.gui.screen_instances.products.product_list_widget.product_cache.clear_node(cache_key);
				}
    		});
    		var products = self.pos.db.get_product_by_category(0);
    		if(_.size(self.pos.gui.screen_instances) > 0){
    			self.pos.gui.screen_instances.products.product_list_widget.set_product_list(products);
    		}
    		this.set_cross_selling_mode(false);
    	},
    });

    var _super_orderline = models.Orderline.prototype;
	models.Orderline = models.Orderline.extend({
		set_cross_selling_items: function(cross_selling_items){
			this.set('cross_selling_items', cross_selling_items)
		},
		get_cross_selling_items: function(){
			return this.get('cross_selling_items') || [];
		},
		set_cross_selling_parent_line: function(cross_selling_parent_line){
			this.set('cross_selling_parent_line', cross_selling_parent_line)
		},
		get_cross_selling_parent_line: function(){
			return this.get('cross_selling_parent_line') || false;
		},
		set_quantity: function(quantity, keep_price){
			var self = this;
			if(quantity === 'remove' || quantity === ''){
				_.each(this.order.get_orderlines().filter(function(item){ return item.get_cross_selling_parent_line().cid === self.cid}), function(line){
					self.order.remove_orderline(line);
				})
				this.order.reset_cross_selling_items();
			}
			_super_orderline.set_quantity.apply(this, arguments);
		},
		can_be_merged_with: function(orderline){
			var self = this;
			var res = _super_orderline.can_be_merged_with.apply(this, arguments);
			if(this.order.get_cross_selling_mode()){
				return false
			}
			return res;
		},
		export_as_JSON: function() {
            var line = _super_orderline.export_as_JSON.apply(this, arguments);
            line.parent_line = this.get_cross_selling_parent_line() || false;
            return line;
        },
	});

	var _super_product = models.Product.prototype;
	models.Product = models.Product.extend({
		get_cross_selling_price: function(orderline){
			var self = this;
			var cross_selling_price = false;
			if(orderline){
				var cross_items = orderline.get_cross_selling_items();
				cross_selling_price = _.pluck(_.filter(cross_items, function(item){
					return item.product_id === self.id
				}), 'new_price');
				cross_selling_price = cross_selling_price.length > 0 ? cross_selling_price[0] : false;
			}
			return cross_selling_price;
		}
	});

	screens.ProductListWidget.include({
		init: function(parent, options) {
	        var self = this;
	        this._super(parent,options);
	        this.parent = parent;
	        this.click_cross_selling_back = function(event){
	        	self.reset_cross_selling_list();
	        };
		},
		reset_cross_selling_list: function(){
			var self = this;
			_.each(self.product_list, function(prod_list){
        		var db_product = self.pos.db.get_product_by_id(prod_list.id);
				db_product['cross_selling_price'] = false;
				var current_pricelist = self._get_active_pricelist();
		        var cache_key = self.calculate_cache_key(prod_list, current_pricelist);
		        self.product_cache.clear_node(cache_key);
        	})
        	self.pos.get_order().set_cross_selling_mode(false);
        	var products = self.pos.db.get_product_by_category(0);
        	self.set_product_list(products);
		},
		renderElement: function() {
			var self = this;
			this._super();
			var back_button = this.el.querySelector('.button.back');
			if(back_button){
				back_button.addEventListener('click',this.click_cross_selling_back);
			}
		},
	});

	screens.ProductScreenWidget.include({
		click_product: function(product) {
			var self = this;
			var order = this.pos.get_order();
	       if(product.to_weight && this.pos.config.iface_electronic_scale){
	           this.gui.show_screen('scale',{product: product});
	       }else{
	    	   var parent_line = false
	    	   if(product.cross_selling_price){
	    		   parent_line = order.get_selected_orderline();
	    	   }
	           order.add_product(product, {parent_line: parent_line});
	           if(product.cross_selling_price){
	        	   order.select_orderline(parent_line);
	           }
	       }
	    },
	});

	var _super_posmodel = models.PosModel;
	 models.PosModel = models.PosModel.extend({
		 set_order: function(order){
			 order.reset_cross_selling_items();
			 _super_posmodel.prototype.set_order.apply(this, arguments);
		 },
	 });

	 screens.ProductCategoriesWidget.include({
		 set_category: function(category){
			 this._super(category);
			 this.product_list_widget.reset_cross_selling_list();
		 },
		 perform_search: function(category, query, buy_result){
			 if(query){
				 this.product_list_widget.reset_cross_selling_list();
			 }
			 this._super(category, query, buy_result);
		 },
	 });
});