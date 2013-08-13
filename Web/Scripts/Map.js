var Map = {
    date: null,
    marker: null,
    map: null,
    mapOut: null,
    mapMessage: null,
    mapDiv: null,
    mess: null,
    messError: null,
    apiIsOk: false,
    geocoder: null,
    initialize: function (el) {
        var header = $('<div class="header"><button data-route="orders" class="icon ico_back">&nbsp;</button></div>').appendTo(el);
        var sc = $('<div class="scrollBottom"/>').appendTo(header);
        Map.mapDiv = $('<div id="mapDiv"/>').appendTo(sc);
        Map.mapMessage = $('<div id="mapMessage">Waiting ...</div>').appendTo(sc);
        Map.mapOut = $('<div id="mapOut"/>').appendTo(header);

        if (Map.mess) {
            Map.message(Map.mess, Map.messError);
        }
    },
    apiOK: function () {
        Map.apiIsOk = true;
        Map.geocoder = new google.maps.Geocoder();
    },
    geocode: function (props, postback) {
        var self = this, a = {}, lat, lng;
        if (self.geocoder)
        self.geocoder.geocode(props, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        a = self.placeToAddress(results[0]);
                        lat = a.Latitude;
                        lng = a.Longitude;
                    }
                }

                if (postback) {
                    postback({
                        lat: lat, lng: lng,
                        City: a.City,
                        Status: status,
                        Address: (a.Street ? a.Street + " " + (a.StreetNumber ? a.StreetNumber : "") : (a.PointOfInterest ? a.PointOfInterest + " " : ""))
                    });
                }
            });
        else
            postback({});
    },
    placeToAddress: function (place) {
        var address = {};
        if (place.geometry) {
            address.Latitude = place.geometry.location.lat();
            address.Longitude = place.geometry.location.lng();
        }
        $(place.address_components).each(
            function () {
                var a = this;
                if (a.types.length > 0)
                    switch (a.types[0]) {
                        case "country":
                            address.Country = a.long_name;
                            address.CountryShortName = a.short_name;
                            break;
                        case "locality":
                            address.City = a.long_name;
                            break;
                        case "sublocality":
                            address.sublocality = a.long_name;
                            break;
                        case "postal_code":
                            address.PostalCode = a.long_name;
                            break;
                        case "route":
                            address.Street = a.long_name;
                            break;
                        case "street_number":
                            address.StreetNumber = a.long_name;
                            break;
                        case "point_of_interest":
                            address.PointOfInterest = a.long_name;
                            break;
                        case "establishment":
                            address.PointOfInterest = a.long_name;
                            break;
                    }
            }
        );
        return address;
    },
    success: function (position) {
        Map.date = new Date().toTimeString();
        Map.message("Pozícia " + Map.date);
        var d = 'Latitude: ' + position.coords.latitude + '<br />' +
       'Longitude: ' + position.coords.longitude + '<br />' +
        "Presnosť pozície: " + position.coords.accuracy + "m";
        //'Altitude: ' + position.coords.altitude + '<br />' +
        //'Accuracy: ' + position.coords.accuracy + '<br />' +
        //'Altitude Accuracy: ' + position.coords.altitudeAccuracy + '<br />' +
        //'Heading: ' + position.coords.heading + '<br />' +
        //'Speed: ' + Math.ceil(position.coords.speed * 3.6) + ' km/h<br />';// +
        //'Timestamp: ' + new Date(position.timestamp) + '<br />';
        Map.mapOut.html(d);
        Map.setMap(position);
        PositionService.lat = position.coords.latitude;
        PositionService.lng = position.coords.longitude;
    },
    error: function (err) {
        Map.message("Error: " + err.message, true);
    },
    message: function (t, err) {
        if (Map.mapMessage) {
            Map.mapMessage.html(t);
            Map.mapMessage.css("color", err ? "red" : "black");
        }
        else {
            Map.mess = t;
            Map.messError = err;
        }
    },
    setMap: function (position) {
        try {
            if (Map.apiIsOk) {
                Map.point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                if (!Map.marker) {
                    Map.mapDiv.css("display", "block");
                    Map.map = new google.maps.Map(Map.mapDiv[0], { zoom: 15, disableDefaultUI: true, mapTypeId: google.maps.MapTypeId.ROADMAP });
                    Map.map.setCenter(Map.point);
                    Map.marker = new google.maps.Marker({
                        clickable: false,
                        map: Map.map
                    });
                }
                google.maps.event.trigger(Map.map, "resize");
                Map.map.setCenter(Map.point);
                Map.marker.setPosition(Map.point);
            }
            else {
                Map.message("Mapy sú nedostupné", true);
            }
        }
        catch (err) {
            Map.message(err.message, true);
        }
    },
    showPosition: function () {
        Map.message("Hľadám pozíciu ...");
        try {
            navigator.geolocation.getCurrentPosition(Map.success, Map.error, { enableHighAccuracy: true }); //, { frequency: 2000 }
        }
        catch (err) {
            Map.message(err.message, true);
        }
    }
};