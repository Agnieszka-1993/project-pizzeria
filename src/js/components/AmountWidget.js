import {select, settings} from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
    constructor(element){
      super(element, settings.amountWidget.defaultValue);
      const thisWidget = this;
      thisWidget.getElements(element);
      thisWidget.initActions();
    }

    getElements(){
      const thisWidget = this;


      thisWidget.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
      thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);

    }

    setValue(value){
      const thisWidget = this;
      const newValue = thisWidget.parseValue(value);
      if(thisWidget.value !== newValue &&  thisWidget.isValid(newValue)){
        thisWidget.value = newValue;
        thisWidget.input.value = thisWidget.value;
        thisWidget.announce();
      }else{
        thisWidget.renderValue();
      }
    }


    isValid(value){
      return !isNaN(value)
      && value >= settings.amountWidget.defaultMin
      && value <= settings.amountWidget.defaultMax;
    }

    renderValue(){
      const thisWidget = this;

      thisWidget.input.value = thisWidget.value;

    }

    initActions() {
      const thisWidget = this;
      thisWidget.input.addEventListener('change',function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.input.value);
      });
      thisWidget.dom.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.dom.value - 1);
      });
      thisWidget.dom.linkIncrease.addEventListener('click',function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.dom.value + 1);
      });
    }

    announce(){
      const thisWidget = this;
      const event = new CustomEvent('updated',{
        bubbles: true
      });
      thisWidget.dom.wrapper.dispatchEvent(event);
    }
  }

export default AmountWidget;