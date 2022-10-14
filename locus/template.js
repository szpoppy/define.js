define(['util?[hash]', 'dom?[hash]'], function(util, $) {
    // 替换字符串中 特殊字符 
    function replaceTpl(str){
        // \ ' " 需要双重转移
        return str.replace(/\\/g, '\\\\').replace(/\"/g, '\\\"').replace(/\'/g, '\\\'').replace(/>\s+</g, '><').replace(/\n+/g, '\\n')
    }
    
    // 讲模板编译为一个 函数，加快执行速度
    function tpl(str){
        var tplFn = ['var str = "";'];
        var endStr = util.trim(str).replace(/([\s\S]*?)<%(?:\s*([=@]?))([\s\S]*?)%>/g, function($0, $1, $2, $3){
            tplFn.push('str += "' + replaceTpl($1) + '";');
            if($2 == '='){
                $3 = 'str += ' + $3 + ';'
            }
            if($2 == '@'){
                $3 = util.trim($3).replace(/^([\w]+)([\s\S]*)$/, function(s0, s1, s2){
                    return garammar[s1] && garammar[s1](s2) || '';
                })
            }
            tplFn.push($3)
            return ''
        })
        tplFn.push('str += "' + replaceTpl(endStr) + '"; return str;');
        var it = {};
        var fn = {};
        //console.log(tplFn.join('\n'))
        var back = new Function('it', 'fn', tplFn.join('\n'));
        return back;
    }

    // 自定义语法扩展
    var garammar = tpl.garammar = {
        'for': function(str){
            var arr = util.trim(str).match(/^(\w+)\s*(,\s*\w+)?\s+in\s+([\s\S]+)$/);
            if(arr){
                return 'fn.forEach(' + arr[3] + ', function(' + arr[1] + (arr[2] || '') + '){'
            }
        },
        'end': function(str){
            return '})'
        }
    }

    // 格式化参数
    function valueEncode(v, flag){
        if(v == null){
            v = "";
        }
        v = String(v);
        if(flag){
            v = v.replace(/&([^#])/g, "&amp;$1").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
        return  v.replace(/\"/g, "&#34;").replace(/\'/g, "&#39;");
    }
    var formatFn = tpl.fn = {
        //格式化字符串 使得次字符串执行innerHTML的时候，按照次字符串原本的内容显示
        htmlEncode: function(v){
            return valueEncode(v, true);
        },
        //格式化字符串，并将回车替换为<br />
        htmlEncodeBr: function(v){
            return valueEncode(v, true).replace(/\n/g, "<br />");
        },
        //格式化为页面节点的属性值 比如value值
        valueEncode: function(v){
            return valueEncode(v);
        },
        formatDate:function(v, str){
            return util.formatDate(v, str);
        },
        // 迭代
        forEach: util.forEach
    }

    // 初始化一个
    function init(str, defData, defFn){
        var tplFn = tpl(str);
        var format = {};
        util.assign(format, formatFn, defFn || {});
        return function(data, fn){
            var val = data instanceof Array ? [] : {};
            defData && util.mixin(val, defData);
            data && util.mixin(val, data);
            return tplFn(val, util.mixin(format, fn || {}));
        }
    }
    tpl.init = init;

    //  ===========DOM绑定类==========
    var Panel = util.createClass(function(prot){
        // 初始化
        prot.init = function(){
            var ag = Array.prototype.slice.call(arguments);
            this.$ = $(ag.shift());
            this.tplFn = tpl.init.apply(tpl, ag);
        }
        // 绑定 live 事件
        prot.live = function(back, type, prefix){
            $.live(this.$, back, type, prefix);
            return this;
        }
        // 
        prot.eLive = function(type, prefix, back){
            var i = $.eLive(this.$, type, prefix, back);
            i.panel = this;
            return i;
        }
        // 显示
        prot.show = function (display) {
            $.show(this.$, display);
            return this;
        }
        prot.hide = function () {
            $.hide(this.$);
            return this;
        }
        prot.clear = function () {
            $.clear(this.$);
            return this;
        }
        prot.render = function(data, fn){
            $.html(this.$, this.tplFn(data, fn));
            return this;
        }
    });

    tpl.panel = Panel;
    
    return tpl;
});