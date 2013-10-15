var RateDetail = function () {

    this.rate = {}
    this.order = {}
    this.index = 4;

    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function() {
        this.el.html(RateDetail.template());
        return this;
    };

    this.onShow = function () {
        $("#rateback").click(function () { app.home(); });
        $("#rateDetailSave").click(function () { sendRate(); });
        this.loadData();
    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        $("#ratedetailForm").html(RateDetail.detailTemplate(this.order));
    };

    this.initialize();

    sendRate = function ()
    {
        this.order = Service.orders.Current;
        var self = this;
        //var rateValue = $("#rateValue").value;
        //var rateDescription = $("#rateDescription").value;

        alert(order.rateValue + " " + order.rateDescription);

        var send = function () {
            Service.sendrate(self.order, function (data) {

            }, function (data) {

            });
        }

        //back
        app.home();

    }
}


RateDetail.template = Handlebars.compile($("#ratedetail-tpl").html());
RateDetail.detailTemplate = Handlebars.compile($("#ratedetailForm-tpl").html());