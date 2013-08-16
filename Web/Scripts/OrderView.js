var OrderView = function () {
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
        $("#OrderFormError").empty();
        switch (this.order.step) {
            case "fTaxiCompany":
                if (!$("input:radio[name=TaxiCompanyLocalId]:checked").val()) {
                    $("#OrderFormError").html("Vyberte taxislužbu");
                    return;
                }
                this.order.step = "fStartAddress";
                break;
            case "fStartAddress":
                if (!$("#StartCity").val() || !$("#StartAddress").val()) {
                    $("#OrderFormError").html("Zadajte kompletnú adresu");
                    return;
                }
                this.order.step = "fEndAddress";
                break;
            case "fEndAddress":
                this.order.step = "fCustomerPhone";
                break;
            case "fCustomerPhone":
                if (!$("#CustomerPhone").val()) {
                    $("#OrderFormError").html("Zadajte Váš telefón");
                    return;
                }
                this.order.step = "fSpecialConditions";
                break;
            case "fSpecialConditions":
                this.order.step = "fOrderSave";
                $("#orderSave").hide();
                $("#orderBack").hide();
                $("#orderWaiting").show();
                $("#orderForm fieldset").hide();
                $("#" + (this.order.step)).show();
                //$("#orderForm").hide();
                //app.waiting();
                var d = $("#orderForm-form").serializeArray();

                var addressChanged = false;
                $.each(d, function (i, v) {
                    if (v.name == "StartCity" && v.value != self.order.StartCity || v.name == "StartAddress" && v.value != self.order.StartAddress)
                        addressChanged = true;
                    self.order[v.name] = v.value;
                });
                
                var send = function () {
                    Service.sendOrder(self.order, function (data) {
                        self.order.step = "fOrderOk";
                        $("#orderForm fieldset").hide();
                        $("#" + (self.order.step)).show();
                        $("#orderWaiting").hide();
                        $("#orderBack").show();
                    }, function (data) {
                        $("#fOrderErrorOutput").html(data.ErrorMessage);
                        self.order.step = "fOrderError";
                        $("#orderForm fieldset").hide();
                        $("#" + (self.order.step)).show();
                        $("#orderWaiting").hide();
                        $("#orderBack").show();
                        //$("#orderSave").show();
                    });
                }

                if (addressChanged) {
                    Map.geocode({ address: self.order.StartAddress + ", " + self.order.StartCity }, function (a) {
                        self.order.StartLatitude = a.lat;
                        self.order.StartLongitude = a.lng;
                        send();
                    });
                }
                else send();

                return;
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
        this.order = Service.orders.Current;
        this.order.geocodeStatus = false;

        if (this.order.IsNew) {
            Map.geocode({ 'latLng': new google.maps.LatLng(PositionService.lat, PositionService.lng) }, function (a) {
                self.order.StartCity = a.City;
                self.order.StartAddress = a.Address;
                self.order.geocodeStatus = a.Status;
                self.order.StartLatitude = PositionService.lat;
                self.order.StartLongitude = PositionService.lng;
                self.showForm();
            });
        }
        else self.showForm();
    };
    this.showForm = function () {
            app.waiting(false);
            this.order.step = this.order.step || "fTaxiCompany";
            if (Service.companies)
                this.order.companiesItems = Service.companies.Items;
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