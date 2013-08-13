var OrderDetail = function (store) {

    this.index = 4;
    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function() {
        //this.el.html(OrderDetail.template(store));
        Map.initialize(this.el);
        return this;
    };

    this.onShow = function(){
        Map.showPosition();
    }

    this.initialize();
}

//OrderDetail.template = Handlebars.compile($("#map-tpl").html());