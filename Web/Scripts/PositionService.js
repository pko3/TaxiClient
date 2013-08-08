var PositionService = {
    lat:0,
    lng: 0,
    _lat: 0,
    _lng: 0,
    poolID: undefined,
    watchID: undefined,
    startWatch: function () {
        PositionService.startPool();

        setTimeout(function () {
            if (this.watchID)
                navigator.geolocation.clearWatch(this.watchID);

            this.watchID = navigator.geolocation.watchPosition(function (position) {
                app.info("Presnosť pozície: " + position.coords.accuracy + "m");
                PositionService.lat = position.coords.latitude;
                PositionService.lng = position.coords.longitude;
            }, function (err) {
                app.info(err.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 27000
            });
        }
        , 1000);
    },
    startPool: function () {
        if (this.poolID)
            clearTimeout(this.poolID);
        this.poolID = setTimeout(PositionService.pool, 6000);
    },
    stopWatch: function () {
        if (this.poolID)
            clearTimeout(this.poolID);
        if (this.watchID)
            navigator.geolocation.clearWatch(this.watchID);
        this.poolID = undefined;
    },
    pool: function () {
        this.poolID = undefined;
            PositionService.callService();
    },
    callService: function () {
        if (Service.waitingOffer()) {
            try {
                //app.info("Posielam ...");
                var s = Service.getSettings();

                var posChanged = PositionService._lat != PositionService.lat && PositionService._lng != PositionService.lng;
                if (posChanged) {
                    PositionService._lat = PositionService.lat;
                    PositionService._lng = PositionService.lng;
                }

                Service.callService("pool", {
                    Id: s.sessionId,
                    Lat: posChanged ? PositionService.lat : 0,
                    Lng: posChanged ? PositionService.lng : 0,
                },
                function (d) { PositionService.startPool(); PositionService.refreshVersionData(d); },
                function (d) { PositionService.startPool(); if (d.ErrorMessage) app.info(d.ErrorMessage); PositionService.refreshVersionData(d); });
            }
            catch (err) {
                PositionService.startPool();
                app.info(err.message);
            }
        }
        else
            PositionService.startPool();
    },
    refreshVersionData: function (d) {
        if (d.oVer && d.oVer != Service.ordersVer) {
            Service.ordersVer = d.oVer;
            app.playNew();
            app.refreshData(["orders"]);
        }
    }
}