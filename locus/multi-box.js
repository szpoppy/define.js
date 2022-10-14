define(['util?[hash]', 'dom?[hash]', 'kite?[hash]'], function(U, $, $K){
    var K = $K.Mask();

    var panelStr = [
        '<div class="multi-box"><div class="rel">',
        '<div class="close" kite="hide"></div>',
        '<div class="searchbar">',
        '<div class="ipt" kite="filterc">',
        '<input kite="filter" placeholder="请输入关键字筛选" type="text" />',
        '<i class="fa fa-search"></i>',
        '</div>',
        '</div>',
        '<div class="elected" kite="list_elected"></div>',
        '<div class="elect" kite="list_all"></div>',
        '</div></div>'
    ].join('');

    //function stop(){
    //    var ev = $.getEvent();
    //    ev.preventDefault();
    //    ev.stopPropagation();
    //}

    var showPanel;
    function hidePanel(){
        if(showPanel){
            showPanel.hide();
            showPanel = null;
        }
    }

    //$.appendEvent(document,'vdown',hidePanel);
    $.appendEvent(document, 'vkeyesc', hidePanel);

    function getLiValue(data, key, flag){
        var v = key == null?data:data[key];
        if(flag){
            return U.htmlEncode(v);
        }
        return v;
    }

    function filter(){
        var root = this.root;
        var str = U.trim(this.$$.filter.value);
        if(str !== root._ipt_value){
            root._ipt_value = str;
            $.html(this.$$.list_all,U.forEach(root.data,function(m,i){
                var v = getLiValue(m, root.key, true);
                if(!str || v.indexOf(str) >= 0){
                    return '<div class="li' + (root.dataElected[i]?' checked':'') + '" live:fn="elect" live:data="' + i + '"><span>' + v + '</span></div>';
                }
                return '';
            },[]).join(''));
        }
    }

    function removeElected(root,index){
        var ed = root.dataElected;
        ed[index].parentNode.removeChild(ed[index]);
        delete ed[index];
        root.dataElectedLength -= 1;

        root.emit('change', index, false);
    }

    function live_remove(index){
        var root = this.root;
        $.get('div[live\\:data="'+index+'"]', root.panel.$$.list_all).removeClass('checked');
        removeElected(root,index);
    }

    function live_elect(index){
        var root = this.root;
        var me = this.target;
        var ed = root.dataElected;

        if(ed[index]){
            $.removeClass(me, 'checked');
            removeElected(root, index);
        }
        else{
            if(root.dataElectedLength >= root.maxNum){
                return ;
            }
            // 增加
            $.addClass(me,'checked');
            ed[index] = $.create('span',{'live:fn': 'remove', 'live:data': index},getLiValue(root.data[index], root.key, true) + '<i class="fa fa-close"></i>',root.panel.$$.list_elected);
            root.dataElectedLength += 1;
            root.emit('change', index, true);
        }
    }

    var MultiBox = U.createClass(U.EventEmitter, {
        init: function(data, key){
            this._super('init');
            var p = this.panel = K.create(panelStr);
            p.drag();
            p.root = this;
            this.data = data;
            this.key = key;
            this.maxNum = Number.MAX_VALUE;
            this.dataElected = {};
            this.dataElectedLength = 0;

            var live = $.eLive(p.$);
            live.root = this;
            live.on('elect', live_elect);
            live.on('remove', live_remove);

            //筛选
            p.bind('filter_input', filter);

            //隐藏
            p.bind('hide', function(){
                this.root.hide();
            });

            p.bind('filterc_vdown', function(){
                $.getEvent().stopPropagation();
            });
            //$.appendEvent(p.$, 'vdown', stop);
            //p.bind('filter_vdown', stop);

            filter.call(p);
        },
        setMaxNum: function(num){
            this.maxNum = num;
            return this;
        },
        show: function(){
            var p = this.panel;
            p.show().offset(.5, .5);
            setTimeout(function(){
                p.$$.filter.focus();
            },10);
            showPanel = this;
            this.emit('show');
            return this;
        },
        hide: function(){
            this.panel.hide();
            this.emit('hide');
            if(this == showPanel){
                showPanel = null;
            }
            return this;
        },
        get: function(index){
            return this.data[index];
        },
        getElected: function(key){
            return U.forEach(this.dataElected, function(v,index){
                var data = this.data[index];
                return key == null? data: data[key];
            },[],this);
        },
        bind: function(id){
            var dom = $(id);
            var root = this;
            $.appendEvent(dom, 'vclick', function(){
                root.show();
            });
            return this;
        }
    });

    return MultiBox;
});
