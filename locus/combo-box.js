define(['util?[hash]', 'dom?[hash]'], function(U, $){

    var keybar = 'combo';

    var panelStr = [
        '<div class="rel">',
        '<div class="searchbar">',
        '<div class="ipt">',
        '<input '+keybar+'="filter" placeholder="请输入关键字筛选" type="text" />',
        '<em class="icon fa fa-search"></em>',
        '</div>',
        '</div>',
        '<div class="elect" '+keybar+'="list_all"></div>',
        '</div>'
    ].join('');

    function _stop(){
        if(this.$ && $.css(this.$, 'display') != 'none'){
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

    function getLiValue(data, key, flag){
        if(!data){
            return '';
        }
        var v = key == null? data: data[key];
        if(flag){
            return U.htmlEncode(v);
        }
        return v;
    }

    function filter(flag){
        var root = this;
        var str = U.trim(root.$$.filter.value);
        if(flag || str !== root._ipt_value){
            root._ipt_value = str;
            var elected = root.elected && root.elected.getAttribute('live:data') || '-1';
            $.html(root.$$.list_all,U.forEach(root.data,function(m,i){
                var v = getLiValue(m, root.key, true);
                if(elected == i){
                    root.ipt.value = v;
                }
                if(!str || v.indexOf(str) >= 0){
                    return '<div class="li' + (elected == i?' checked':'') + '" live:fn="elect" live:data="' + i + '"><span>' + v + '</span></div>';
                }
                return '';
            },[]).join(''));
            root.active = -1;
        }
    }

    function elect(root,index, me){
        if(root.elected && root.elected.getAttribute('live:data') == index){
            root.hide();
            return ;
        }
        if(root.elected){
            $.removeClass(root.elected,'checked');
        }
        root.elected = me;
        $.addClass(me, 'checked');

        root.ipt.value = getLiValue(root.get(),root.key);

        root.emit('change', index);
        root.hide();
    }

    function live_elect(index){
        elect(this.root, index, this.target);
    }

    function filter_keydown(){
        var ev = $.getEvent()
        var code = ev.keyCode;
        if(code == 13){
            // 确定使用
            if(this.active){
                elect(this, this.active.getAttribute('live:data'), this.active);
            }
            return ;
        }

        if(code == 38 || code == 40){
            // 上移一个 或者 下移一个
            if(this.active){
                $.removeClass(this.active, 'active');
            }
            if(code == 40){
                this.active = this.active.nextElementSibling;
                if(!this.active){
                    this.active = this.$$.list_all.firstChild;
                }
            }
            else{
                this.active = this.active.previousElementSibling;
                if(!this.active){
                    this.active = this.$$.list_all.lastChild;
                }
            }
            $.addClass(this.active, 'active');
            ev.stopPropagation()
            ev.preventDefault();
            return ;
        }
    }

    function _show(){
        if(showPanel == this || this.ipt.disabled){
            return this;
        }
        var offset = $.offset(this.iptFor);
        $.css(this.$,{left:offset.left + 'px',top:(offset.top + offset.height + 2) + 'px', width:(offset.width - 2) + 'px'});

        hidePanel();
        showPanel  = this;
        $.show(this.$);

        var $filter = this.$$.filter;
        if($filter && this.ipt.readOnly){
            setTimeout(function(){
                $filter.focus();
            },10);
        }

        this.emit('show');
        return this;
    }

    var ComboBox = U.createClass(U.EventEmitter, function(prot){
        // 初始化
        prot.init = function(ipt, data, key){
            this._super('init');
            var stop = U.bind(_stop, this);
            var show = U.bind(_show, this);
            ipt = this.ipt = $(ipt);
            this.iptFor = $(ipt.getAttribute('for_panel')) || ipt;
            var forShow = ipt.getAttribute('for_show');
            if(forShow){
                $.get(forShow).appendEvent('vclick', show).appendEvent('vdown', stop);
            }

            var r = this.$ = $.create('div',{className:'ui-combo-box'}, panelStr, document.body);
            $.hide(r);
            var $$ = this.$$ = {};
            $.get('[' + keybar + ']',r).forEach(function(){
                $$[this.getAttribute(keybar)] = this;
            });

            var live = $.eLive(r);
            live.root = this;
            live.on('elect', live_elect);

            $.appendEvent(r, 'vdown', stop);
            $.appendEvent(ipt, 'focus', function(){
                setTimeout(show, 10);
            });
            $.appendEvent(ipt, 'vdown', stop);
            $.appendEvent(ipt, 'vclick', show);

            //筛选
            $.appendEvent($$.filter, 'input', U.bind(filter, this, false));
            var fkd = U.bind(filter_keydown, this);
            $.appendEvent($$.filter, 'keydown', fkd);
            $.appendEvent(this.ipt, 'keydown', fkd);

            if(data || key){
                this.reSetData(data, key);
            }
        }

        // 显示
        prot.show = _show;

        // 隐藏
        prot.hide = function(){
            $.hide(this.$);
            this.emit('hide');
            if(this == showPanel){
                showPanel = null;
            }
            return this;
        }

        // 获取数据
        prot.get = function(index){
            if(index){
                return this.data[index];
            }
            if(this.elected){
                return this.data[this.elected.getAttribute('live:data')];
            }
            return null;
        }

        // 哪个选中
        prot.emitIndex = function(index){
            var xs = $.get(".li", this.$$.list_all);
            if(xs[index]){
                $.emit(xs[index]);
            }
            return this;
        }

        // 移除
        prot.removeIndex = function(index){
            var elected = this.elected?parseInt(this.elected.getAttribute('live:data')):-1;
            if((index === undefined || index === null) && this.elected){
                index = elected;
            }
            if(this.data[index]){
                this.data.splice(index, 1);
                var flag;
                if(index == elected){
                    flag = true;
                }
                else if(index < elected){
                    this.elected = $.get(['live:data=' + (elected - 1)],this.$$.list_all);
                }
                this.refresh(flag);
            }
            return this;
        }

        // 刷新
        prot.refresh = function(flag){
            var hasChange = false;
            if(flag){
                if(this.elected){
                    hasChange = true;
                }
                this.elected = null;
                this.active = null;
                this.ipt.value = '';
            }
            filter.call(this, true);
            if(hasChange){
                this.emit('change',null);
            }
            return this;
        }

        // 重新设置数据
        prot.reSetData = function(data, key){
            if(data){
                this.data = data;
            }
            if(key){
                this.key = key;
            }
            this.refresh(true);
            return this;
        }

        // 获取焦点
        prot.focus = function () {
            var ipt = this.ipt;
            ipt && ipt.focus();
        };
    });

    return ComboBox;
});
