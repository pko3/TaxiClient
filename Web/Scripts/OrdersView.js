var OrdersView = function() {
    this.index = 1;
    this.initialize = function() {
        this.el = $('<div/>');
    };

    this.render = function () {
        this.el.html(OrdersView.template());
        return this;
    };

    this.loadData = function () {
        var self = this;

        $('.orders-list').hide();
        app.waiting();
        var orders = Service.getOrders();

        if (orders && orders.Items) {
            $.each(orders.Items, function () {
                this.FormatedDate = Service.formatJsonDate(this.Date);
                $('.orders-list').html(OrdersView.liTemplate(orders.Items));
            });
        }
        if (self.iscroll)
            self.iscroll.refresh();
        else
            self.iscroll = new iScroll($('.scroll', self.el)[0], { hScrollbar: false, vScrollbar: false });

        app.waiting(false);

        $(".up").click(function () { self.changeOffer($(this).parent(), "Up"); });
        $(".down").click(function () { self.changeOffer($(this).parent(), "Down"); });

        $('.orders-list').show();
    };
    this.changeOffer = function (btn, action) {
        var settings = Service.getSettings(), self = this;
        var data = {
            Action: action,
            IsTransporter: true,
            GUID_Transporter: settings.transporterId,
            Status_Transporter: settings.transporterState,
            GUID: btn.attr("data_GUID_Offer"),
            Status: btn.attr("data_StatusOffer"),
            GUID_TransporterOrder: btn.attr("data_Id"),
            Status_TransporterOrder: btn.attr("data_Status"),
            Latitude: PositionService.lat,
            Longitude: PositionService.lng
        };
        btn.removeClass().addClass("refWaiting");

        data.Latitude = PositionService.lat,
        data.Longitude = PositionService.lng
        Service.callService("transporteroffer", data);
    };
    this.onShow = function () {
        if (!navigator.app)
            $('#appExit').hide();
        $("#taxiHeader").click(function () { app.refreshData(["orders", "transporters"]); });
        this.loadData();
    };
    this.initialize();
}

OrdersView.template = Handlebars.compile($("#orders-tpl").html());
OrdersView.liTemplate = Handlebars.compile($("#orders-li-tpl").html());
OrdersView.unbreakTemplate = Handlebars.compile($("#orders-unbreak").html());