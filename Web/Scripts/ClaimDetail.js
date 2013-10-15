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
        var self = this;
        $("#claimback").click(function () { app.home(); });
        $("#claimDetailSave").click(function () { sendClaim(); });

        this.loadData();
    };

    this.loadData = function () {
        this.order = Service.orders.Current;
        $("#claimDetailForm").html(ClaimDetail.detailTemplate(this.order));
    };

    this.sendClaim = function () {
        this.order = Service.orders.Current;
        var self = this;
        var d = $("#claimDetailForm").serialize();
        d.GUID_TransporterOrder = this.order.GUID;
        d.UserPhone = this.order.CustomerPhone;
        d.Status = "New";

        var send = function () {
            Service.sendclaim(d, function (data) {

                alert(order.claimDescription);

            }, function (data) {

            });
        }

        //back
        app.home();

    }

    this.initialize();
}

ClaimDetail.template = Handlebars.compile($("#claimdetail-tpl").html());
ClaimDetail.detailTemplate = Handlebars.compile($("#claimdetailForm-tpl").html());

