var OrderView = function (messages) {
    this.index = 5;
    this.order = {};
    this.initialize = function() {
        this.el = $('<div/>');
    };

    this.render = function() {
        return this;
    };

    this.onShow = function () {
        var self = this;
        this.el.html(OrderView.template());
        $("#orderForm").hide();
        app.waiting();
        $("#orderSave").click(function () { if (!$(this).hasClass("transparent")) self.save(); });
        $("#orderBack").click(function () { if (!$(this).hasClass("transparent")) self.back(); });
                
        this.loadForm();
    };
    this.back = function () {
        switch (this.order.step) {
            case "fTaxiCompany":
                app.home();
                return;
            case "fStartAddress":
                this.order.step = "fTaxiCompany";
                break;
            case "fEndAddress":
                this.order.step = "fStartAddress";
                break;
            case "fCustomerPhone":
                this.order.step = "fEndAddress";
                break;
            case "fSpecialConditions":
                this.order.step = "fCustomerPhone";
                break;
            case "fOrderSave":
                return;
                break;
            case "fOrderOk":
                app.home();
                return;
            case "fOrderError":
                app.home();
                return;
            default:
                return;
        }
        $("#orderForm fieldset").hide();
        $("#" + (this.order.step)).show();
    };
    this.save = function () {
        var self = this;
        switch (this.order.step) {
            case "fTaxiCompany":
                this.order.step = "fStartAddress";
                break;
            case "fStartAddress":
                this.order.step = "fEndAddress";
                break;
            case "fEndAddress":
                this.order.step = "fCustomerPhone";
                break;
            case "fCustomerPhone":
                this.order.step = "fSpecialConditions";
                break;
            case "fSpecialConditions":
            case "fOrderSave":
                this.order.step = "fOrderSave";
                $("#orderSave").hide();
                $("#orderBack").hide();
                $("#orderWaiting").show();
                //$("#orderForm").hide();
                //app.waiting();
                var d = $("#orderForm-form").serializeArray();
                $.each(d, function (i, v) { self.order[v.name] = v.value; });
                
                Service.sendOrder(this.order, function (data) {
                    data.step = "fOrderOk";
                    self.save();
                });
                break;
            case "fOrderOk":
                $("#orderWaiting").hide();
                $("#orderBack").show();
                break;
            case "fOrderError":
                $("#orderWaiting").hide();
                $("#orderBack").show();
                $("#orderSave").show();
                break;
            default://fTaxiCompany
                this.order.step = "fTaxiCompany";
                break;
        }

        $("#orderForm fieldset").hide();
        $("#" + (this.order.step)).show();
    };
    this.loadForm = function () {
        var self = this;
        var s = Service.getSettings();
        this.order = Service.getOrders().Current;
        this.order.OrderToDate = this.order.OrderToDate || new Date();
        if (this.order.OrderToDate)
            this.order.FormatedOrderToDate = Service.formatDate(this.order.OrderToDate);
        
        this.order.CustomerPhone = s.clientPhone;

        self.showForm();
    };
    this.showForm = function () {
        this.order.ErrorMessage = Service.connectionError;
            app.waiting(false);

            this.order.step = this.order.step || "fTaxiCompany";
            $("#orderForm").html(OrderView.templateForm(this.order));
            $("#orderWaiting").hide();
            $("#orderForm fieldset").hide();
            $("#" + (this.order.step)).show();
            $("#orderForm").show();
            $("#orderSave").removeClass("transparent");
    };

    this.initialize();
}

OrderView.template = Handlebars.compile($("#order-tpl").html());
OrderView.templateForm = Handlebars.compile($("#orderForm-tpl").html());