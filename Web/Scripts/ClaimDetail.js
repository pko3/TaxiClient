var ClaimDetail = function () {

    this.index = 4;
    this.initialize = function () {
        this.el = $('<div/>');
    };

    this.render = function() {
        this.el.html(ClaimDetail.template());
        return this;
    };

    this.onShow = function () {
        $("#claimback").click(function () { app.home(); });
        this.loadData();
    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        $("#claimDetailForm").html(ClaimDetail.detailTemplate(this.order));
    };

    this.initialize();
}

ClaimDetail.template = Handlebars.compile($("#claimdetail-tpl").html());
ClaimDetail.detailTemplate = Handlebars.compile($("#claimdetailForm-tpl").html());

