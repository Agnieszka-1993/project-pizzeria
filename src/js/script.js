/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

//import { init } from "browser-sync";

{
  'use strict';



  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong',
      totalPrice2: '.cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
    db: {
      url: '//localhost:3131',
      products: 'products',
      orders: 'orders',
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };


  class Product {
    constructor(id,data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.randerInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
      thisProduct.prepareCartProductParams();
      //console.log('New product:',thisProduct);
    }

    randerInMenu() {
      const thisProduct = this;
      /*generate HTML based on template*/
      const generateHTML = templates.menuProduct(thisProduct.data);
      /*creat element using utils.createElementFromHTML*/
      thisProduct.element = utils.createDOMFromHTML(generateHTML);
      /*find menu container*/
      const menuContainer = document.querySelector(select.containerOf.menu);
      /*add element to menu*/
      menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
      const thisProduct = this;
      thisProduct.dom = {};
      thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAccordion() {
      const thisProduct = this;
      /* find the clickable trigger (the element that should react to clicking) */
      //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      /* START: add event listener to clickable trigger on event click */
      thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
        /* prevent default action for event */
        event.preventDefault();
        /* find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive)
        //console.log('active product',activeProduct);
        /* if there is active product and it's not thisProduct.element, remove class active from it */
        if(activeProduct != null && activeProduct != thisProduct.element){
          activeProduct.classList.remove('active');
        }
        /* toggle active class on thisProduct.element */
        thisProduct.element.classList.toggle('active');
      });
    }

    initOrderForm() {
      const thisProduct = this;
      //console.log('initOrderForm',thisProduct);
      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });

      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
        thisProduct.addToCart();
      });
    }

    processOrder() {
      const thisProduct = this;
      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData',formData);
      // set price to default price
      let price = thisProduct.data.price;
      // for every category (param)...
      for(let paramId in thisProduct.data.params){
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        //console.log(paramId,param);
        // for every option in this category
        for(let optionId in param.options){
          // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
          const option = param.options[optionId];
          const activeImage = thisProduct.imageWrapper.querySelector('.'+paramId+'-'+optionId);
          //console.log(optionId,option);
            // check if there is param with a name of paramId in formData and if it includes optionId
          if(formData[paramId] && formData[paramId].includes(optionId)) {
            if(activeImage != null){
              activeImage.classList.add(classNames.menuProduct.imageVisible);
            }
            // check if the option is not default
            if(option['default'] != true) {
              // add option price to price variable
                price += option['price'];
            }
          } else {
            if(activeImage != null){
              activeImage.classList.remove(classNames.menuProduct.imageVisible);
            }
            // check if the option is default
            if(option['default']) {
              // reduce price variable
              price = price - option['price'];
            }
          }
        }
      }
      // update calculated price in the HTML
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
      thisProduct.priceElem.innerHTML = price;

    }

    initAmountWidget(){
      const thisProduct = this;
      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('update', function(){
        thisProduct.processOrder();
      })
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct());

    }

    prepareCartProduct(){
      const thisProduct = this;


      const productSummary = {
        id: thisProduct.id,
        name: thisProduct.data.name,
        amount: thisProduct.amountWidget.value,
        price: thisProduct.priceElem.innerHTML,
        priceSingle: thisProduct.priceSingle,
        params: thisProduct.prepareCartProductParams(),
      };

    //  productSummary.params = {};
     // productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;

      const params = {};

      // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.form);
      //console.log('formData',formData);
      // for every category (param)...
      for(let paramId in thisProduct.data.params){
        // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        params[paramId] = {
          label: param.label,
          options: {}
        };
        //console.log(paramId,param);
        // for every option in this category
        for(let optionId in param.options){

          /*console.log('paramId: ', paramId);
          console.log('param: ', param);
          console.log('optionId: ', optionId);
          console.log('option: ', option);*/
            // check if there is param with a name of paramId in formData and if it includes optionId
          if(formData[paramId].includes(optionId)) {
            params[paramId].options[optionId] = param.label;
          }
        }

      }
      return params;


    }
  }


  class AmountWidget {
    constructor(element){
      const thisWidget = this;
      //console.log('Amount Widget',thisWidget);
      //console.log('constructor elements',element);
      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;
      thisWidget.element = element;

      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
      const initialValue = thisWidget.input.value ? parseInt(thisWidget.input.value) : settings.amountWidget.defaultValue;
        thisWidget.setValue(initialValue);
    }

    setValue(value){
      const thisWidget = this;
      const newValue = parseInt(value);
      if(thisWidget.value !== newValue && !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax){
        thisWidget.value = newValue;
        thisWidget.input.value = thisWidget.value;
        thisWidget.announce();
      }else{
        thisWidget.input.value = thisWidget.value;
      }
    }

    initActions() {
      const thisWidget = this;
      thisWidget.input.addEventListener('change',function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });
      thisWidget.linkIncrease.addEventListener('click',function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });
    }

    announce(){
      const thisWidget = this;
      const event = new CustomEvent('updated',{
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }


  class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      //thisCart.add(menuProduct);
      //console.log('new cart', thisCart);
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
      thisCart.dom.totalPrice2 = thisCart.dom.wrapper.querySelector(select.cart.totalPrice2);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    }

    initActions(){
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click',function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });
      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });
      thisCart.dom.productList.addEventListener('remove',function(event){
        thisCart.remove(event.detail.cartProduct);
      });
      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });

    }

    add(menuProduct){
      const thisCart = this;
      //console.log('adding product', menuProduct);
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDom = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDom);
      thisCart.products.push(new CartProduct(menuProduct, generatedDom));
      //console.log('thisCard.products',thisCart.products);
      thisCart.update();

    }

    update(){
      const thisCart = this;
      const deliveryFee = settings.cart.defaultDeliveryFee;
      let totalNumber = 0,
          subTotalPrice = 0;

      for(let product of thisCart.products){
        totalNumber += product.amount;
        subTotalPrice += parseInt(product.price);
      }

      if(totalNumber > 0){
        thisCart.totalPrice = parseInt(deliveryFee) + subTotalPrice;
      }else {
        thisCart.totalPrice = 0;
      }

      //console.log('subTotalPrice: ', subTotalPrice);

      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
      thisCart.dom.subTotalPrice.innerHTML = subTotalPrice;
      thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalPrice2.innerHTML = thisCart.totalPrice;
      thisCart.dom.totalNumber.innerHTML = totalNumber;
    }

    remove(cartProduct){
      const thisCart = this;

      cartProduct.dom.wrapper.remove();

      const productIndex = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(productIndex,1);
      console.log('remove products');
      thisCart.update();
    }

    sendOrder(){
      const thisCart = this,
            url = settings.db.url + '/' + settings.db.orders;

      let payload = {
        address: thisCart.dom.form.address.value,
        phone: thisCart.dom.form.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.dom.subTotalPrice.innerHTML,
        totalNumber: thisCart.dom.totalNumber.innerHTML,
        deliveryFee: thisCart.dom.deliveryFee.innerHTML,
        products: []
      };

      for(let prod of thisCart.products) {
        payload.products.push(prod.getData());
      }
      console.log('payload',payload);

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){
          console.log('parsedResponse',parsedResponse)
        });
    }
  }


  class CartProduct {
    constructor(menuProduct,element){
      const thisCartProduct = this;
      //console.log('menuProduct: ', menuProduct.id);

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.params = menuProduct.params;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};
      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function() {
        thisCartProduct.amount = parseInt(thisCartProduct.amountWidget.value);
        thisCartProduct.price = thisCartProduct.amount * parseInt(thisCartProduct.priceSingle);
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      })
    }

    remove(){
      const thisCartProduct = this;
      const event = new CustomEvent('remove',{
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
        console.log('remove');
      });

    }

    getData(){
      const thisCartProduct = this;

      const getNeedDataProducts = {}
      getNeedDataProducts.id = thisCartProduct.id;
      getNeedDataProducts.amount = thisCartProduct.amount;
      getNeedDataProducts.price = thisCartProduct.price;
      getNeedDataProducts.priceSingle = thisCartProduct.priceSingle;
      getNeedDataProducts.name = thisCartProduct.name;
      getNeedDataProducts.params = thisCartProduct.params;

      return getNeedDataProducts;
    }
  }


  const app = {
    initCart: function(){
      const thisApp = this;
      const catrElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(catrElem);
    },
    initMenu: function(){
      const thisApp = this;
      //console.log('thisApp.data',thisApp.data)
      for (let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
    initData: function(){
      const thisApp = this;
      thisApp.data = [];
      const url = settings.db.url + '/' + settings.db.products;
      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse',parsedResponse);
          thisApp.data.products = parsedResponse;
          thisApp.initMenu();
        })
      console.log('thisApp.data', JSON.stringify(thisApp.data));
    },
    init: function(){
      const thisApp = this;
      /*console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);*/
      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();
}
