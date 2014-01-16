var RateDetail = function () {

    this.rate = {}
    this.order = {}
    this.index = 4;

    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function() {
        var self = this;
        this.el.html(RateDetail.template());
        $("#rateback").click(function () { app.route("detail"); });
        $("#rateDetailSave").click(function () { self.sendRate(); });
        return this;
    };

    this.onShow = function () {
        this.loadData();
    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        $("#ratedetailForm").html(RateDetail.detailTemplate(this.order));
    };

    this.initialize();

    this.sendRate = function ()
    {
        this.order = Service.orders.Current;
        var self = this;
        var d = $("#ratedetailForm").serializeArray(), data = {};
        //serializeObject
        $.each(d, function (i, v) { data[v.name] = v.value; });

        data.GUID_Entity = this.order.GUID;
        data.Title_Entity = "TransporterOrder";
        data.TaxiCompanyLocalId = this.order.TaxiCompanyLocalId;

        Service.sendrate(data, function () { app.home(); });
    }
}


RateDetail.template = Handlebars.compile($("#ratedetail-tpl").html());
RateDetail.detailTemplate = Handlebars.compile($("#ratedetailForm-tpl").html());