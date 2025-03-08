class BaseWidget {
    constructor(element){
        const thisWidget = this;
        thisWidget.dom = {};
        thisWidget.dom.wrapper = wrapperElement;
        thisWidget.value = initialValue;
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

    parseValue(value){
      return parseInt(value);
    }

    isValid(value){
      return !isNaN(value);
    }


}

export default BaseWidget;