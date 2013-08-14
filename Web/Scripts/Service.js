var Service = {
    online: false,
    connectionError: undefined,
    orders: undefined,
    companies: undefined,
    settings: {
        userId: undefined,
        userPhone: undefined,
        url: "http://localhost/disp",
        sessionId: undefined,
        enableHighAccuracy: true
    },
    initialize: function (callback) {
        app.log("Service.initialize");
        
        //Cross domain !!!
        $.support.cors = true;
        $.ajaxSetup({
            cache: false,
            timeout: 30000,
            error: function (jqXHR, textStatus, errorThrown) {
                switch (jqXHR.status) {
                    case 403: Service.connectionError = "Chybné prihlásenie"; break;
                    case 404: Service.connectionError = "Služba sa nenašla: " + this.url; break;
                    default: Service.connectionError = errorThrown; break;
                }
            }
        });
        
        this.getSettings();
        this.getOrders();
        this.getCompanies();

        if (window.device)
            this.settings.sessionId = window.device.platform + "_" + window.device.uuid;
        else
            this.settings.sessionId = "";

        //this.login(callback);

        PositionService.startWatch();
        if (callback)
            callback();
    },
    waitingOffers: function () {
        var ret = [], self = this;
        $.each(this.orders.Items, function () {
            if (this.GUID && self.isOrderInProcess(this))
                ret.push(this.GUID);
        });
        return ret;
    },
    login: function (callback) {
        app.log("Service.login");
        Service.isAuthenticated = false;
        this.callService("login", { UserName: this.settings.name, Password: this.settings.password, RememberMe: true, TransporterId: this.settings.transporterId }, function (d) {
            Service.isAuthenticated = true;
            Service.settings.userId = d.userId;
            Service.settings.sessionId = d.sessionId;
            Service.saveSettings();
            PositionService.startWatch();
            if (callback) callback();

        }, function (d) {
            //PositionService.stopWatch();
            if (d.ErrorMessage)
                Service.connectionError = d.ErrorMessage;
            else
                Service.connectionError = "Chybné prihlásenie";
            Service.isAuthenticated = false;
            if (callback)
                callback();
        });
    },
    newOrder: function (id) {
        var order = this.findOrder(id);
        if (order) {
            if (this.isOrderInProcess(order)) {
                order = $.extend({}, order);
                order.IsNew = true;
            }
            else
                order.IsNew = false;
            
        }
        else {
            order = {};
            order.IsNew = true;
        }
        order.OrderSource = "Phone";
        order.localId = "o_" + this.getUid();
        order.step = "";
        //"Offered""Reserved""Waiting""Processing""Complete""Cancel"
        order.ErrorMessage = "";
        order.OrderToDate = Service.formatLocalIsoDate(new Date());
        if (this.settings.userPhone)
            order.CustomerPhone = this.settings.userPhone;

        this.orders.Current = order;
        app.route("order");
    },
    isOrderInProcess: function(order){
        return order && order.Status && (order.Status == "New" || order.Status == "Offered" || order.Status == "Reserved" || order.Status == "Waiting");
    },
    removeOrder: function (id, callback) {
        var order = this.findOrder(id), self = this;
        if (order) {
            if (order.Status != "" && order.GUID)
                app.showConfirm("Chcete zrušiť objednávku?","Objednávka", function () {
                    self.callService("OrderAction", { Action: "TaxiCustomerCancelOrder", GUID_TransporterOrder: order.GUID }, callback);
                });
            else {
                app.showConfirm("Zmazať z histórie?", "Objednávka", function () {
                    var o = self.orders;
                    o.Items = $.grep(self.orders.Items, function (o) { return o.localId && o.localId != id; })
                    self.saveOrders();
                    callback();
                });
            }
        }
        else
            callback();
    },
    findOrder: function(id){
        var r = $.grep(this.orders.Items, function (o) { return o.localId == id; });
        if (r.length > 0)
            return r[0];
        return undefined;
    },
    updateOrder: function (order) {
        var ret = false, self = this;
        $.each(this.orders.Items, function () {
            if (this.GUID == order.GUID && this.Status != order.StatusOrder) {
                self.orders.IsChanged = true;
                this.Status = order.StatusOrder;
                if (!self.isOrderInProcess(this))
                    this.Status = "";
                else 
                    ret |= true;
            }
        });
        return ret;
    },
    sendOrder: function (order, callback, errCalback) {
        if (order.IsNew)
        {
            order.IsNew = false;
            this.orders.Items.push(order);
            this.orders.Items.sort(function (a, b) {
                if (b.OrderToDate < a.OrderToDate)
                    return -1;
                if (b.OrderToDate > a.OrderToDate)
                    return 1;
                return 0;
            });
            this.orders.Items = this.orders.Items.slice(0, 10);
            this.saveOrders();
        }

        if (order.CustomerPhone && this.settings.userPhone != order.CustomerPhone) {
            this.settings.userPhone = order.CustomerPhone;
            this.saveSettings();
        }

        order.Status = "New";
        order.GUID = null;
        Service.callService("order", order, function (d) {
            order.GUID = d.Id;
            Service.saveOrders();
            callback(d);
        }, function (d) {
            order.Status = "";
            Service.saveOrders();
            errCalback(d);
        });
    },
    getOrders: function () {
        if (!this.orders)
        {
            var s = window.localStorage.getItem("orders");
            if (s)
                this.orders = JSON.parse(s);
            else
                this.orders = { Items: [], Current: {} };
        }
        return this.orders;
    },
    saveOrders: function () {
        window.localStorage.setItem("orders", JSON.stringify(this.orders));
        this.orders.IsChanged = false;
    },
    getDetail: function (entity, id, callback) {
        this.callService("itemmobile", { Id: entity + "_" + id }, callback, callback);
    },
    getSettings: function () {
        if (!Service.settings || !Service.settings.sessionId) {
            var s = window.localStorage.getItem("settings");
            if (s) {
                if (Service.settings)
                    Service.settings = $.extend(Service.settings, JSON.parse(s));
                else
                    Service.settings = JSON.parse(s);
            }
            else
                Service.settings = {};
        }
        if (TaxiClient) {
            Service.settings.url = TaxiClient.ServiceUrl;
        }
        return Service.settings;
    },
    saveSettings: function (data) {
        if(data)
            Service.settings = data;
        window.localStorage.setItem("settings", JSON.stringify(Service.settings));
    },
    getCompanies: function (version) {
        if (!this.companies) {
            var s = window.localStorage.getItem("companies");
            if (s) {
                this.companies = JSON.parse(s);
            }
            else
                this.companies = { Version: 0, Items: [] };

            if (TaxiClient.Companies && TaxiClient.Companies.Items && this.companies.version != TaxiClient.Companies.Version) {
                $.each(this.companies.Items, function () {
                    var c = this;
                    if (this.selected)
                        $.each(TaxiClient.Companies.Items, function () {
                            if (c.GUID_sysCompany == this.GUID_sysCompany)
                                this.selected = true;
                        });
                });
                this.companies = TaxiClient.Companies;
                this.saveCompanies();
            }
        }
        return this.companies;
    },
    saveCompanies: function () {
        window.localStorage.setItem("companies", JSON.stringify(Service.companies));
    },
    callService: function (method, data, successDelegate, errorDelegate) {
        app.log("Service.callService: " + method);
        Service.connectionError = null;
        if (!this.settings.url) {
            Service.connectionError = "Chýba adresa servisu";
            if (data)
                data.ErrorMessage = Service.connectionError;
            if (errorDelegate)
                errorDelegate(data);
        }
        else {
            if (data) {
                data.UserTicket = this.settings.sessionId;
            }
            $.post(this.settings.url + "/mobileclient/" + method, data)
                .done(function (d) {
                    if (d) {
                        app.log(method + ": OK");
                        if (d.Message) {
                            app.info(d.Message);
                        }

                        if (d.ErrorMessage) {
                            app.log("Service.callService - ErrorMessage: " + d.ErrorMessage);
                            Service.connectionError = d.ErrorMessage + " " + this.url;
                            if (errorDelegate)
                                errorDelegate(d);
                            else
                                app.showAlert(d.ErrorMessage + " " + this.url, "Chyba");
                        }
                        else if (d.RefreshDataId) {
                            app.refreshData(d.RefreshDataId, function () { if (successDelegate) successDelegate(d); });
                        }
                        else if(successDelegate)
                            successDelegate(d);
                    }
                    else if (successDelegate)
                       successDelegate();
                 })
                .fail(function () {
                    app.log("Service.callService - " + Service.connectionError + ": " + this.url);
                    app.waiting(false);
                    //Service.connectionError = "Spojenie sa nepodarilo " + this.url;
                    if (errorDelegate)
                        errorDelegate({ ErrorMessage: Service.connectionError });
                    else
                        app.showAlert(Service.connectionError + ": " + this.url, "Chyba");
                });
        }
    },
    parseJsonDate: function (jsonDate) {
        try{
            var offset = 0; // new Date().getTimezoneOffset() * 60000;
            var parts = /\/Date\((-?\d+)([+-]\d{2})?(\d{2})?.*/.exec(jsonDate);

            if (parts[2] == undefined)
                parts[2] = 0;

            if (parts[3] == undefined)
                parts[3] = 0;

            return new Date(+parts[1] + offset + parts[2] * 3600000 + parts[3] * 60000);
        }
        catch (err) {
            return undefined;
        }
    },
    formatJsonDate: function (jsonDate) {
        var d = Service.parseJsonDate(jsonDate);
        //return d.toLocaleDateString() + " <br/><strong>" + d.toLocaleTimeString().substring(0, 5) + "</strong>"; //
        return this.formatDate(d)
            
    },
    formatDate: function (d) {
        if (!d)
            return "";
        if (d.constructor === String)
            d = new Date(d);
        if (d)
            return d.getDate() + ". " + d.getMonth() + ". " + d.getFullYear() + " " + d.toTimeString().substring(0, 5);
        return "";
    },
    formatLocalIsoDate: function (d) {

        function pad(number) {
            var r = String(number);
            if (r.length === 1) {
                r = '0' + r;
            }
            return r;
        }

        if (d)
        return d.getFullYear()
              + '-' + pad(d.getMonth() + 1)
              + '-' + pad(d.getDate())
              + 'T' + pad(d.getHours())
              + ':' + pad(d.getMinutes());
              //+ ':' + pad(d.getUTCSeconds())
              //+ '.' + String((d.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5)
              //+ 'Z';
        

        //if (d)
        //    return d.toISOString().substr(0,16);
        
        return "";
    },
    getUid: function () {
        return Math.random().toString(16).replace(".", "") + (new Date()).valueOf().toString(16);
    }
}