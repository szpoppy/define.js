define(['util?[hash]', 'dom?[hash]', 'date-picker?[hash]'], function(U, $){
    var keybar = 'di';
    var panelStr = [
        '<div class="close"' + keybar + '="hide"></div>',
        '<div class="ipts">',
        '<div class="lw1">',
        '<div class="ipt">',
        '<input type="text" ' + keybar + '="start" readonly placeholder="开始日期" />',
        '</div>',
        '</div>',
        '<div class="lw1">',
        '<div class="ipt">',
        '<input type="text" ' + keybar + '="end" readonly placeholder="结束日期" />',
        '</div>',
        '</div>',
        '</div>',
        '<div class="li" live:fn="elect" live:data="today">',
        '<span>今天</span>',
        '</div>',
        '<div class="li" live:fn="elect" live:data="lastDay7">',
        '<span>最后7天</span>',
        '</div>',
        '<div class="li" live:fn="elect" live:data="thisWeek">',
        '<span>本周</span>',
        '</div>',
        '<div class="li" live:fn="elect" live:data="lastDay30">',
        '<span>最后30天</span>',
        '</div>',
        '<div class="li" live:fn="elect" live:data="thisMonth">',
        '<span>本月</span>',
        '</div>',
        '<div class="li" live:fn="elect" live:data="clear">',
        '<span class="clear">清空</span>',
        '</div>'
    ].join('');

    function stop(){
        if(this.$ && $.css(this.$,'display') != 'none'){
            var ev = $.getEvent();
            //ev.preventDefault();
            ev.stopPropagation();
        }

    }

    var showPanel;
    function hidePanel(){
        if(showPanel){
            showPanel.hide();
            showPanel = null;
        }
    }

    $.appendEvent(document, 'vdown', hidePanel);
    $.appendEvent(document, 'vkeyesc', hidePanel);

    function elect(root){
        var flag = false;
        var v1 = root.start.getValue();
        if(v1 != root.start._value){
            root.start._value = v1;
            flag = true;
        }

        var v2 = root.end.getValue();
        if(v2 != root.end._value){
            root.end._value = v2;
            flag = true;
        }
        if(flag){
            var x = [];
            if(v1){
                x.push(v1);
            }
            if(v2){
                x.push(v2);
            }
            root.ipt.value = x.join('~');
            root.emit('change');
        }
    }

    function formatDate(d, str){
        return U.formatDate(d, str || 'YYYY-MM-DD');
    }

    function createDate(d){
        return U.createDate(d);
    }

    var live_elect_mothod = {
        clear: function (root) {
            root.start.setValue();
            root.end.setValue();
        },
        today: function(root){
            var d = createDate();
            root.start.setValue(d);
            root.end.setValue(d);
        },
        yesterday: function(root){
            var d = createDate();
            d.setDate(d.getDate() - 1);
            root.start.setValue(d);
            root.end.setValue(d);
        },
        thisWeek: function(root){
            var d = createDate();
            d.setDate(d.getDate() - d.getDay());
            root.start.setValue(formatDate(d));
            d.setDate(d.getDate() + 6);
            root.end.setValue(formatDate(d));
        },
        thisMonth: function(root){
            var d = createDate();
            root.start.setValue(formatDate(d, 'YYYY-MM-01'));
            d.setDate(1);
            d.setMonth(d.getMonth() + 1);
            d.setDate(0);
            root.end.setValue(formatDate(d));
        },
        lastDay7: function(root){
            var d = createDate();
            root.end.setValue(formatDate(d));
            d.setDate(d.getDate() - 6);
            root.start.setValue(formatDate(d));
        },
        lastDay30: function(root){
            var d = createDate();
            root.end.setValue(formatDate(d));
            d.setDate(d.getDate() - 29);
            root.start.setValue(formatDate(d));
        }
    };

    function live_elect(method){
        live_elect_mothod[method](this.root);
        this.root.hide();
    }

    function electIptDate(){
        elect(this.root);
    }

    var DateInterval = U.createClass(U.EventEmitter, {
        init: function(id){
            this._super('init');
            var _stop = U.bind(stop, this);
            var _show = U.bind(this.show, this);
            var ipt = this.ipt = $(id);
            this.iptFor = $(ipt.getAttribute('for_panel')) || ipt;
            this.dateFormat = ipt.getAttribute('date-format') || 'YYYY-MM-DD';
            var forShow = ipt.getAttribute('for_show');
            if(forShow){
                $.get(forShow).appendEvent('vclick', _show).appendEvent('vdown',_stop);
            }

            var r = this.$ = $.create('div', {className:'date-interval'}, panelStr, document.body);
            $.hide(r);
            var $$ = this.$$ = {};
            $.get('[' + keybar + ']',r).forEach(function(){
                $$[this.getAttribute(keybar)] = this;
            });

            var value = U.trim(ipt.getAttribute('date-value') || ipt.value || '').split(/[~,]+/);
            if(value[0]){
                $$.start.value = formatDate(value[0], this.dateFormat);
            }
            if(value[1]){
                $$.end.value = formatDate(value[1], this.dateFormat);
            }

            this.start = $.datePicker($$.start, 1).on('elect', electIptDate);
            this.start.root = this;
            this.start._value = $$.start.value;
            this.end = $.datePicker($$.end, 1).on('elect', electIptDate);
            this.end.root = this;
            this.end._value = $$.end.value;

            $$.start.setAttribute('date-format', this.dateFormat || '');
            $$.end.setAttribute('date-format', this.dateFormat || '');

            var live = $.eLive(r);
            live.root = this;
            live.on('elect', live_elect);

            $.appendEvent(r, 'vdown', _stop);

            $.appendEvent($$.hide, 'vclick',U.bind(this.hide, this));

            $.appendEvent(ipt, 'focus', _show);
            $.appendEvent(ipt, 'vclick', _show);
            $.appendEvent(ipt, 'vdown', _stop);
        },
        show: function(){
            if(showPanel == this){
                return this;
            }
            var offset = $.offset(this.iptFor);
            $.css(this.$,{left:offset.left + 'px',top:(offset.top + offset.height + 2) + 'px', width:(offset.width - 2) + 'px'});

            hidePanel();
            showPanel  = this;
            $.show(this.$);

            this.emit('show');
            return this;
        },
        hide: function(){
            $.hide(this.$);
            this.emit('hide');
            if(this == showPanel){
                showPanel = null;
            }
            return this;
        },
        get: function(){
            return [this.start.getValue(),this.end.getValue()];
        }
    });

    return DateInterval;
});
