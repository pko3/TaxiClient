var ClaimDetail = function () {

    this.index = 4;
    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function() {
        this.el.html(ClaimDetail.detailTemplate());
        return this;
    };

    this.onShow = function () {
        Map.initialize($("#orderDetailMap"));
        $("#claimback").click(function () { app.home(); });
        this.loadData();
    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        $("#orderDetailForm").html(OrderDetail.detailTemplate(this.order));
        if (this.order.StartLatitude)
            Map.setMap(this.order.StartLatitude, this.order.StartLongitude, this.order.TaxiLatitude, this.order.TaxiLongitude);
    };

    this.initialize();
}

ClaimDetail.detailTemplate = Handlebars.compile($("#claimdetail-tpl").html());