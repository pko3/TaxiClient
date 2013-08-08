var Service = {
    online: false,
    ordersVer: undefined,
    transporterVer: undefined,
    transporter: null,
    isSendloginHistory: false,
    waitingOffer: function () {
        return false;
    },
    connectionError: undefined,
    _orders: undefined,
    _settings: {
        userId: undefined,
        userPhone: undefined,
        transporterId: undefined,
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
                    default: Service.connectionError = "Služba sa nenašla: " + this.url; break;
                }
            }
        });
        
        if (window.device)
            this._settings.sessionId = window.device.platform + "_" + window.device.uuid;
        else
            this._settings.sessionId = "";

        //this.login(callback);
        if (callback)
            callback();
    },
    login: function (callback) {
        app.log("Service.login");
        this.getSettings();
        Service.isAuthenticated = false;
        this.callService("login", { UserName: this._settings.name, Password: this._settings.password, RememberMe: true, TransporterId: this._settings.transporterId }, function (d) {
               Service.isAuthenticated = true;
               var s = Service.getSettings();
               s.userId = d.userId;
               s.sessionId = d.sessionId;
               Service.saveSettings(s);
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
    newOrder: function (order) {
        order = order || {};
        order.IsNew = true;
        order.Status = "New";//"Offered""Reserved""Waiting""Processing""Complete""Cancel"
        this.getOrders().Current = order;
        app.route("order");
    },
    sendOrder: function (order, callback, errCalback) {
        if (order.IsNew)
        {
            order.IsNew = false;
            this.getOrders().Items.push(order);
            this.saveOrders();
        }

        if (order.CustomerPhone)
            this._settings.userPhone = order.CustomerPhone;

        if (callback)
            setTimeout(function () { callback(order); }, 2000);
    },
    getOrders: function () {
        if (!this._orders)
        {
            var s = window.localStorage.getItem("orders");
            if (s)
                this._orders = JSON.parse(s);
            else
                this._orders = { Items: [], Current: {} };
        }
        return this._orders;
    },
    saveOrders: function(){
        window.localStorage.setItem("orders", JSON.stringify(this._orders));
    },
    getDetail: function (entity, id, callback) {
        this.callService("itemmobile", { Id: entity + "_" + id }, callback, callback);
    },
    getSettings: function () {
        if (!Service._settings || !Service._settings.url) {
            var s = window.localStorage.getItem("settings");
            if(s)
                Service._settings = JSON.parse(s);
            else
                Service._settings = {};
        }
        return Service._settings;
    },
    saveSettings: function (data) {
        if(data)
            Service._settings = data;
        window.localStorage.setItem("settings", JSON.stringify(Service._settings));
    },
    callService: function (method, data, successDelegate, errorDelegate) {
        app.log("Service.callService: " + method);
        Service.connectionError = null;
        if (!this._settings.url) {
            Service.connectionError = "Chýba adresa servisu";
            if (errorDelegate)
                errorDelegate(d);
        }
        else {
            if (data) {
                data.UserTicket = this._settings.sessionId;
            }
            $.post(this._settings.url + "/mobileclient/" + method, data)
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
                            if (d.oVer)
                                Service.ordersVer = d.oVer;
                            if (d.tVer)
                                Service.transporterVer = d.tVer;
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
        if (d)
            return d.getDate() + ". " + d.getMonth() + ". " + d.getFullYear() + " " + d.toTimeString().substring(0, 5);
        return "";
    },
    formatDate: function (d) {
        if (d)
            return d.getDate() + ". " + d.getMonth() + ". " + d.getFullYear() + " " + d.toTimeString().substring(0, 5);
        return "";
    }
}