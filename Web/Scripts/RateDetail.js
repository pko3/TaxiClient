var RateDetail = function () {

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
        this.loadData();
    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        $("#ratedetailForm").html(RateDetail.detailTemplate(this.order));
    };

    this.initialize();
}


RateDetail.template = Handlebars.compile($("#ratedetail-tpl").html());
RateDetail.detailTemplate = Handlebars.compile($("#ratedetailForm-tpl").html());