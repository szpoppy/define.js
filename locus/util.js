define('util', function() {
    var $RV = {};
    // 常量
    var doc = document;
    var head = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;
    var slice = Array.prototype.slice;
    var toString = Object.prototype.toString;
    var isTouch = $RV.isTouch = 'ontouchstart' in doc;

    // 自定义的循环
    var forEach = function() {
        function forpush(arr, v) {
            arr.push(v);
            return v;
        }

        function forappend(obj, v, k) {
            obj[k] = v;
        }

        function forback() {
            return arguments[1];
        }
        var types = '-[object array]-[object nodelist]-[object htmlcollection]-[object arguments]-';
        return function(obj, fun, exe, scope) {
            if (scope == null) {
                scope = this;
            }
            if (obj) {
                var doExe = exe ? exe.push ? forpush : forappend : forback;
                var len = obj.length;
                if (types.indexOf('-' + toString.call(obj).toLowerCase() + '-') > -1 || '[object htmlcollection]' == String(obj).toLowerCase()) {
                    for (var i = 0; i < len; i += 1) {
                        var item = fun.call(scope, obj[i], i);
                        if (item === false) {
                            break;
                        }
                        doExe(exe, item, i);
                    }
                } else {
                    for (var n in obj) {
                        if(obj.hasOwnProperty && obj.hasOwnProperty(n)){
                            var item = fun.call(scope, obj[n], n);
                            if (item === false) {
                                break;
                            }
                            doExe(exe, item, n);
                        }
                    }
                }
            }
            return exe || scope;
        }
    }();
    $RV.forEach = forEach;

    /**
     * 判断两组数据是否相同 前言 
     * @param {*} a 
     * @param {*} b 
     */
    function equal(a, b){
        if (a == null || b == null || (a === '' || b === '')){
            // null 和 '' 进行特殊比较
            return a === b;
        }
        var aC = toString.call(a).toLowerCase(), bC = toString.call(b).toLowerCase();
        var ns = '-[object string]-[object number]';
        if(ns.indexOf(aC) > 0 && ns.indexOf(bC) > 0){
            // 全部为 字符串 或者 数字 统一转数字 比较
            return '' + a === '' + b;
        }
        if(aC !== bC){
            // 类型不同
            return false;
        }
        switch (aC) {
            case '[object regexp]':
                return '' + a === '' + b;
            case '[object date]':
            case '[object boolean]':
                return +a === +b;
            case '[object array]':
                if(a.length != b.length){
                    // 长度不一致，返回 false
                    return false;
                }
            case '[object object]':
                if(Object.keys(a).length !== Object.keys(b).length){
                    // keys 不一致，返回 false
                    return false;
                }
                var flag = true;
                // 递归搜查每项是否一致
                forEach(a, function(val, key){
                    if(equal(val, b[key]) === false){
                        return flag = false;
                    }
                });
                return flag;
        }
        return a == b;
    }
    $RV.isEqual = equal;

    // 深度克隆
    function objectAssign(target, source) {
        forEach(source, function(item, n){
            if (typeof item == 'object') {
                target[n] = item instanceof Array ? [] : {};
                objectAssign(target[n], item);
            } else {
                target[n] = item;
            }
        });
        return target;
    }

    // 深度混合 相同类型
    function objectMixin(target, source) {
        forEach(source, function(item, n){
            if (typeof item == 'object') {
                if(target[n] == null || toString.call(target[n]) != toString.call(item)){
                    target[n] = item instanceof Array ? [] : {};
                }
                objectMixin(target[n], item);
            } else {
                target[n] = item;
            }
        });
        return target;
    }

    //扩展object
    function extra() {
        var ag = slice.call(arguments);
        if ('-string-number-'.indexOf('-' + (typeof ag[0]) + '-') > -1) {
            var param = {};
            param[ag[0]] = ag[1];
            ag = [param];
        }
        while (ag.length) {
            objectAssign(this, ag.shift());
        }
        return this;
    }

    // 继承
    function copyProt(){}
    function createClass(superClass, initFuns) {
        if (!initFuns) {
            initFuns = superClass
            superClass = null
        }

        var inArg
        var C = function() {
            if(this && this.constructor == C){
                this.init && this.init.apply(this, inArg || arguments)
                inArg = null
            }
            else{
                inArg = arguments
                return new C()
            }
        }
        C.extend = function() {
            return createClass(this, arguments[0])
        }
        var sProt = null;
        if(superClass){
            sProt = copyProt.prototype = superClass.prototype
            C.prototype = new copyProt
            C.prototype.constructor = C
        }
        var cProt = C.prototype;
        if (typeof initFuns == 'function') {
            initFuns(cProt, sProt)
        }
        else {
            objectAssign(cProt, initFuns)
        }

        if (!cProt.assign) {
            // 扩展
            cProt.assign = extra
        }

        // 调用父类方法
        cProt._super = function(){
            var ag = slice.call(arguments)
            var method = ag.shift() || 'init'
            if(!sProt || !sProt[method]){
                throw('no, ' + method + ' method')
                return
            }
            return sProt[method].apply(this, ag)
        }
        return C
    }
    $RV.createClass = createClass

    var EventEmitter = createClass(function(prot) {

        // 初始化
        prot.init = function(){
            // 克隆一份 事件
            this._monitor_ = this._monitor_ ? objectAssign({}, this._monitor_) : {}
        }
        /**
         * 绑定事件
         * @param type 事件名称
         * @param fun 事件方法
         * @returns {EventEmitter}
         */
        prot.on = function(type, fun) {
            var monitor = this._monitor_ || (this._monitor_ = {});
            monitor[type] || (monitor[type] = []);
            monitor[type].push(fun);
            return this;
        }

        /**
         * 判断是否还有特定事件
         * @param type
         * @returns {*}
         */
        prot.hasEvent = function(type) {
            var monitor = this._monitor_ && this._monitor_[type] || [];
            return monitor.length > 0 || !!this['on' + type];
        }

        /**
         * 只有执行一次的事件
         * @param type 事件名称
         * @param fun 事件方法
         * @returns {EventEmitter}
         */
        prot.onec = function(type, fun) {
            function funx() {
                fun.apply(this, arguments);
                this.off(type, funx);
            }
            this.on(type, funx);
            return this;
        }

        /**
         * 移除事件
         * @param type 事件名称
         * @param fun 事件方法
         * @returns {EventEmitter}
         */
        prot.off = function(type, fun) {
            var monitor = this._monitor_;
            if (monitor) {
                if (fun) {
                    var es = monitor[type];
                    if (es) {
                        var index = es.indexOf(fun);
                        if (index > -1) {
                            es.splice(index, 1);
                        }
                    }
                } else if (type) {
                    delete monitor[type];
                } else {
                    delete this._monitor_;
                }
            }
            return this;
        }

        /**
         * @returns {EventEmitter}
         */
        prot.emit = function() {
            var ag = slice.call(arguments, 0);
            var type = ag.shift();
            var es = this._monitor_ && this._monitor_[type] || [];
            if (es.length) {
                for (var i = 0; i < es.length; i += 1) {
                    es[i].apply(this, ag);
                }
            }
            var onFun = this['on' + type];
            onFun && onFun.apply(this, ag);
            return this;
        }
    });
    $RV.EventEmitter = EventEmitter;


    /**
     * 加载 js
     * @param url
     * @param callback
     * @param charset
     * @returns {Element}target
     */
    function loadJS(url, callback, charset) {
        var node = doc.createElement("script");
        node.setAttribute("type", "text/javascript");
        if (charset) {
            node.setAttribute("charset", charset);
        }

        function onload() {
            callback && callback();
            setTimeout(function() {
                //防止回调的时候，script还没执行完毕
                // 延时 2s 删除节点
                if (node) {
                    node.parentNode.removeChild(node);
                    node = null;
                }
            }, 2000);
        }
        if ('onload' in node) {
            node.onload = function() {
                node.onload = node.onerror = null;
                onload();
            };
            node.onerror = function() {
                node.onload();
            }
        } else {
            node.onreadystatechange = function() {
                if (/loaded|complete/.test(node.readyState)) {
                    node.onreadystatechange = null;
                    onload();
                }
            }
        }

        node.async = true;
        head.appendChild(node);
        node.src = url;
        return node;
    }
    $RV.loadJS = loadJS;

    var uAgent = window.navigator.userAgent.toLowerCase();
    var IE = (window.attachEvent && window.ActiveXObject && !window.opera) ? parseFloat(uAgent.match(/msie ([\d.]+)/)[1]) : 0;
    $RV.IE = IE;
    var Firefox = /firefox\/([\d.]+)/.test(uAgent) ? parseFloat(RegExp.$1) : 0;
    $RV.Firefox = Firefox;

    /**
     * 扩展第一个参数
     * @returns {*}
     */
    function assign() {
        var ag = slice.call(arguments);
        return extra.apply(ag.shift(), ag);
    }
    $RV.assign = assign;

    /**
     * 混合第一个参数
     */
    function mixin() {
        var ag = slice.call(arguments);
        var target = ag.shift();
        while(ag.length){
            objectMixin(target, ag.shift());
        }
        return target;
    }
    $RV.mixin = mixin;

    /**
     * 绑定函数
     * @returns {Function}
     */
    function bind() {
        var a = slice.call(arguments),
            m = a.shift(),
            o = a.shift();
        return function() {
            return m.apply(o == null ? this : o, a.concat(slice.call(arguments)));
        }
    }
    $RV.bind = bind;

    var soleTime = new Date().getTime() - 10000;
    var soleCount = 100;
    /**
     * 获取页面唯一的 id 值
     * @returns {string}
     */
    function getSole() {
        soleCount += 1;
        return Number(Math.round(Math.random() * 100 + soleCount) + '' + (new Date().getTime() - soleTime)).toString(36);
    }
    $RV.getSole = getSole;

    $RV.trim = function(str) {
        if (!str) {
            return '';
        }
        return str.trim && str.trim() || str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * 去除HTML编码 生成可以在html文档显示的字符
     * @param str
     * @returns {string}
     */
    function htmlEncode(str) {
        return (str || '').replace(/&([^#])/g, "&amp;$1").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&#34;").replace(/\'/g, "&#39;");
    }
    $RV.htmlEncode = htmlEncode;

    /**
     * 去除HTML编码 生成可以在html文档显示的字符, 多一个 br 转移
     * @returns {void|*|XML|string}
     */
    function htmlEncodeBr() {
        return exports.htmlEncode(str).replace(/\n/g, "<br />");
    }
    $RV.htmlEncodeBr = htmlEncodeBr;

    /**
     * json 数据格式化
     * @param str
     * @param safety  是否为标准的 默认为标准的
     * @returns {*}
     */
    function parseJSON(str, safety) {
        if (!str) {
            return null;
        }
        if (safety || safety === undefined) {
            if (window.JSON) {
                try {
                    return window.JSON.parse(str);
                } catch (e) {
                    return null;
                }
            }
            if (!/^[\],:{}\s]*$/.test(str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                //验证json字符串的安全性,不安全，直接返回 null
                return null;
            }
        }

        // 直接调用 eval 序列化
        try {
            return eval("(" + str + ")");
        } catch (e) {
            return null;
        }
    }
    $RV.parseJSON = parseJSON;

    function _stringifyJSON(obj) {
        var type = typeof obj;
        if (obj == null) {
            return "null";
        }
        if (type == "string") {
            return "\"" + obj.replace(/([\'\"\\])/g, "\\$1").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\f/g, "\\f").replace(/\r/g, "\\r") + "\"";
        }
        if (type == "number") {
            return obj.toString();
        }
        if (type == "boolean") {
            return obj + "";
        }
        var r = [],
            i, x;
        if (toString.call(obj) == "[object Array]") {
            var il = obj.length;
            for (i = 0; i < il; i += 1) {
                x = _stringifyJSON(obj[i]);
                x != null && r.push(x);
            }
            return "[" + r.join(",") + "]";
        }
        if (obj && obj.constructor == Object) {
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    x = _stringifyJSON(obj[i]);
                    x != null && r.push("\"" + i + "\":" + x);
                }
            }
            return "{" + r.join(",") + "}";
        }
        return null;
    }

    function stringifyJSON(obj) {
        if (window.JSON) {
            //调用系统的
            try {
                return window.JSON.stringify(obj);
            } catch (e) {}
        }
        return _stringifyJSON(obj);
    }
    $RV.stringifyJSON = stringifyJSON;


    // 获取对应cookie的建的值
    function getCookie(k) {
        return new RegExp("[?:; ]*" + k + "=([^;]*);?").test(document.cookie + "") ? decodeURIComponent(RegExp["$1"]) : "";
    }
    $RV.getCookie = getCookie;
    //设置Cookie 建 值 有效期 目录 域 安全
    function setCookie(k, v, t, p, m, s) {
        var r = k + "=" + encodeURIComponent(v);
        if (t) {
            if (typeof t == "string") {
                t = new Date(t.replace(/-/g, "/").replace(/\.\d+$/, ""));
            } else if (typeof t == "number") {
                t = new Date(new Date().getTime() + t * 60000);
            }
            r += "; expires=" + t.toGMTString();
        }
        if (p) {
            r += "; path=" + p;
        }
        if (m) {
            r += "; domain=" + m;
        }
        if (s) {
            r += "; secure";
        }
        document.cookie = r;
    }
    $RV.setCookie = setCookie;
    //删除Cookie
    function delCookie(k, p, m) {
        var r = k + "=; expires=" + (new Date(0)).toGMTString();
        if (p) {
            r += "; path=" + p;
        }
        if (m) {
            r += "; domain=" + m;
        }
        document.cookie = r;
    }
    $RV.delCookie = delCookie;

    /**
     * 简单获得 url上的参数
     * @param str
     * @returns {object}
     */
    function parseQS(str) {
        var data = {};
        forEach(str.replace(/^[\s#\?&]+/, "").replace(/&+/, "&").split(/&/), function(v) {
            var s = v.split("=");
            if (s[0] != "") {
                s[1] = decodeURIComponent(s[1] || "");
                if (data[s[0]] == null) {
                    data[s[0]] = s[1];
                } else if (data[s[0]].push) {
                    data[s[0]].push(s[1]);
                } else {
                    data[s[0]] = [data[s[0]], s[1]];
                }
            }
        });
        return data;
    }
    $RV.parseQS = parseQS;


    function getQS(key, str) {
        return new RegExp("[? ]*" + key + "=([^&]*)&?").test(str || document.location.search + "") ? decodeURIComponent(RegExp["$1"]) : "";
    }
    $RV.getQS = getQS;

    /**
     * 将 obj 转QS字符串
     * @param obj
     * @param k
     * @returns {string}
     */
    function stringifyQS(obj, k) {
        var result = [];
        forEach(obj, function(item, key) {
            if (item && item.constructor == Array) {
                for (var i = 0; i < item.length; i += 1) {
                    result.push(key + "=" + encodeURIComponent(key[i] || ''));
                }
            } else {
                result.push(key + "=" + encodeURIComponent(item || ''));
            }
        });
        return result.join(k || "&");
    }
    $RV.stringifyQS = stringifyQS;

    /**
     * 格式化时间对象
     * @param str
     * @returns {*}
     */
    function createDate(str) {
        if (str && str.constructor == Date) {
            return str;
        }
        if (typeof str == 'string') {
            if (IE && IE < 9 && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/g.test(str)) {
                var date = new Date();
                date.setUTCFullYear(RegExp.$1, RegExp.$2 - 1, RegExp.$3);
                date.setUTCHours(RegExp.$4, RegExp.$5, RegExp.$6);
                return date;
            }
            str = str.replace(/\-/g, '\/').replace(/T/, ' ').split(/\.+/)[0];
        }
        return str ? new Date(str) : new Date();
    }
    $RV.createDate = createDate;

    /**
     * 时间格式化为字符串
     * @param date
     * @param formatStr
     * @returns {*}
     */
    function formatDate(date, formatStr) {
        if (date === '') {
            return '';
        }
        date = createDate(date);
        return (formatStr || "YYYY-MM-DD").replace(/YYYY/g, date.getFullYear())
            .replace(/YY/g, String(date.getYear()).slice(-2))
            .replace(/MM/g, ("0" + (date.getMonth() + 1)).slice(-2))
            .replace(/M/g, date.getMonth() + 1)
            .replace(/DD/g, ("0" + date.getDate()).slice(-2))
            .replace(/D/g, date.getDate())
            .replace(/hh/g, ("0" + date.getHours()).slice(-2))
            .replace(/h/g, date.getHours())
            .replace(/mm/g, ("0" + date.getMinutes()).slice(-2))
            .replace(/m/g, date.getMinutes())
            .replace(/ss/g, ("0" + date.getSeconds()).slice(-2))
            .replace(/s/g, date.getSeconds());
    }
    $RV.formatDate = formatDate;

    /**
     * 异步执行所有函数
     */
    function async() {
        var arr = slice.call(arguments);
        var evData = typeof arr[0] == 'function' ? {} : arr.shift();
        var callBack = arr.pop();
        var arr_len = arr.length;
        var end = {};

        function complete(index) {
            end[index] = true;
            for (var i = 0; i < arr_len; i += 1) {
                if (!end[i]) {
                    return;
                }
            }
            callBack(evData);
        }
        forEach(arr, function(fun, index) {
            var cp = bind(complete, null, index);
            setTimeout(function() {
                fun(evData, cp, end);
            }, 0);
        });
    }

    /**
     * 序列化执行所有函数
     */
    function sequence() {
        var arr = slice.call(arguments);
        var flag = true;
        if (arr[0].constructor == Array) {
            forEach(arr[0], function(fn) {
                if (!typeof fn == 'function') {
                    flag = false;
                    return false;
                }
            });
        } else if (!typeof arr[0] == 'function') {
            flag = false;
        }
        var evData = flag ? arr.shift() : {};

        function next() {
            if (arr.length) {
                var fun = arr.shift();
                if (typeof fun == 'function') {
                    fun(evData, next);
                } else {
                    fun.unshift(evData);
                    fun.push(next);
                    async(fun);
                }
            }
        }
        next();
    }
    $RV.sequence = sequence;

    var linkA = document.createElement('a');
    /**
     * 获得url的真实地址
     * @param url
     * @returns {string}
     */
    function getFullUrl(url) {
        linkA.setAttribute('href', url);
        return linkA.hasAttribute ? linkA.href : linkA.getAttribute('href', 4);
    }
    $RV.getFullUrl = getFullUrl;

    // 兼容IE的本地存储
    var ls;
    try {
        ls = window.localStorage;
    } catch (e) {}
    if (!ls) {
        ls = function() {
            var userData, name = document.location.hostname;
            var init = function() {
                init = function() {
                    userData.load(name);
                };
                userData = document.createElement('input');
                userData.type = 'hidden';
                userData.style.display = 'none';
                userData.addBehavior("#default#userData");
                document.body.appendChild(userData);
                init();
            };

            return {
                //设置存储数据
                setItem: function(key, value) {
                    init();
                    userData.setAttribute(key, value);
                    userData.save(name);
                },
                getItem: function(key) {
                    init();
                    return userData.getAttribute(key);
                },
                removeItem: function(key) {
                    init();
                    userData.removeAttribute(key);
                    userData.save(name);
                }
            };
        }();
        try {
            window.localStorage = ls;
        } catch (e) {}
    }

    $RV.setLSItem = function(key, value) {
        ls.setItem(key, stringifyJSON(value));
    }
    $RV.getLSItem = function(key) {
        var value = ls.getItem(key);
        return parseJSON(value);
    }
    $RV.removeLSItem = function(key) {
        ls.removeItem(key);
    }

    // 缓存
    function indexOf(arr, val) {
        if (arr.indexOf) {
            return arr.indexOf(val);
        }
        for (var i = 0; i < arr.length; i += 1) {
            if (arr[i] === val) {
                return i;
            }
        }
        return -1;
    }

    var Cache = createClass(function(prot) {
        prot.init = prot.clear = function() {
            this.keys = [];
            this.values = [];
        }
        prot.set = function(key, value) {
            var i = indexOf(this.keys, key);
            if (i > -1) {
                this.vals[i] = value;
            } else {
                this.keys.push(key);
                this.values.push(value);
            }
        }
        prot.get = function(key) {
            return this.values[indexOf(this.keys, key)];
        }
        prot.del = function(key) {
            var i = indexOf(this.keys, key);
            if (i > -1) {
                this.keys.splice(i, 1);
                this.values.splice(i, 1);
            }
        }
        prot.has = function(key) {
            return indexOf(this.keys, key) >= 0;
        }
        prot.forEach = function(fn, scope) {
            var keys = this.keys;
            var vals = this.values;
            scope || (scope = this);
            for (var i = 0; i < keys.length; i += 1) {
                fn.call(scope, vals[i], keys[i]);
            }
        }
        prot.entrys = function() {
            var arr = [];
            this.each(function(val, key) {
                arr.push({ key: key, value: val });
            });
            return arr;
        }
        prot.isEmpty = function() {
            return this.keys.length == 0;
        }
        prot.size = function() {
            return this.keys.length;
        }
    });

    $RV.Cache = Cache;

    return $RV;
});