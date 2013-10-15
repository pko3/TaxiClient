var HelpView = function (store) {
    this.helpContent = $;
    this.index = 4;
    this.initialize = function () {
        this.el = $('<div/>');
        var header = $('<div class="header"><button data-route="orders" class="icon ico_back">&nbsp;</button></div>').appendTo(this.el);
        this.helpContent = $('<div id="helpcontent" />');
        $('<div  class="scrollBottom"/>').append(this.helpContent).appendTo(this.el);
    };

    this.render = function () {
        var self = this;
        jQuery.get('apphelp.html', function (data) {
            self.helpContent.html(data);
        });
        return this;
    };

    this.onShow = function () {
        
    }

    this.initialize();


}

