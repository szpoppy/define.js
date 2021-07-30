// IE8 以及一下，使用 sizzle
define('dom', window.attachEvent && !window.addEventListener && ['util?[hash]', '../third/sizzle?[hash]'] || ['util?[hash]'], function (U, S) {
    function $$(str) {
        return typeof str == 'string' ? document.getElementById(str) : str;
    }

    function $(str, fn) {
        var v = $$(str);
        return typeof fn == 'function' ? fn.call(v || false) : v;
    }

    // 创建一个页面上可以使用的,不冲突的
    $.createID = function (prefix) {
        var id, el;
        do {
            id = (prefix || '') + U.getSole();
            el = $(id);
        } while (el);
        return id;
    }

    var doc = document;
    var toString = Object.prototype.toString;
    var slice = Array.prototype.slice;

    //清理选中
    $.clearSelection = function () {
        window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
    }

    // 页面宽 高
    var docEl = doc.documentElement;

    function getDClient(t) {
        return docEl['client' + t] || window['inner' + t] || doc.body['client' + t];
    }
    //获得Scroll的值
    function getDScroll(t) {
        t = 'scroll' + t;
        return docEl[t] || doc.body[t];
    }
    // 获取可视屏幕大小
    $.getScreen = function () {
        return {
            width: getDClient('Width'),
            height: getDClient('Height')
        }
    }
    // 获取内容宽和高
    $.getScreenScroll = function () {
        return {
            width: getDScroll('Width'),
            height: getDScroll('Height'),
            top: getDScroll('Top'),
            left: getDScroll('Left')
        }
    }

    //Dom筛选 简单
    //#a[2,t]x 多ID筛选
    var siftExpIds = /^#([\w\u00c0-\uFFFF\-]*)\[([\-\w,]+)\]([\w\u00c0-\uFFFF\-]*)/;

    function sift(selector, context) {
        var rv = [],
            flag;
        //ids 筛选 #ttp[1,2,3]xx
        selector = U.trim(selector).replace(siftExpIds, function ($0, q, c, h) {
            var rx = c.split(/[\s*,\s*]/),
                o = rv.$ = {};
            for (var i = 0; i < rx.length; i += 1) {
                rv.push(o[rx[i]] = $$(q + rx[i] + h));
            }
            flag = true;
            return '';
        });
        if (flag) {
            return rv;
        }
        if (S) {
            return S(selector, context);
        }
        var rs = (context && $(context) || document).querySelectorAll(selector) || [];
        try {
            rv = slice.call(rs);
        } catch (e) {
            for (var i = 0; i < rs.length; i += 1) {
                rv.push(rs[i]);
            }
        }
        return rv;
    }

    //将Dom产生的事件自动获取 并格式化
    //部分移动事件属性需要增加或者转移
    function getEvent(ev) {
        ev = ev || window.event || function (gs) {
            return gs[gs.length - 1];
        }(getEvent.caller.arguments);
        if (!ev) {
            return null;
        }

        //移动是多点触控，默认使用第一个作为clientX和clientY
        if (ev.clientX == null) {
            var touches = ev.targetTouches && ev.targetTouches[0] ? ev.targetTouches : ev.changedTouches;
            if (touches && touches[0]) {
                ev.clientX = touches[0].clientX;
                ev.clientY = touches[0].clientY;
            }
        }
        //code 统一处理
        ev.charCode == null && (ev.charCode = (ev.type == 'keypress') ? ev.keyCode : 0);
        if (!ev.keyCode) {
            ev.keyCode = ev.charCode || ev.which;
        }
        if (ev.key === undefined) {
            //ev.key = String.fromCharCode(ev.keyCode);
        }
        ev.eventPhase == null && (ev.eventPhase = 2);
        ev.isChar == null && (ev.isChar = ev.charCode > 0);
        ev.pageX == null && (ev.pageX = ev.clientX + doc.body.scrollLeft);
        ev.pageY == null && (ev.pageY = ev.clientY + doc.body.scrollTop);
        ev.preventDefault == null && (ev.preventDefault = function () {
            this.returnValue = false;
        });
        ev.stopPropagation == null && (ev.stopPropagation = function () {
            this.cancelBubble = true;
        });
        ev.target == null && (ev.target = ev.srcElement);
        ev.time == null && (ev.time = new Date().getTime());

        if (ev.relatedTarget == null && (ev.type == 'mouseout' || ev.type == 'mouseleave')) {
            ev.relatedTarget = ev.toElement;
        }
        if (ev.relatedTarget == null && (ev.type == 'mouseover' || ev.type == 'mouseenter')) {
            ev.relatedTarget = ev.fromElement;
        }
        if (ev.type == 'mousewheel' || ev.type == 'DOMMouseScroll') {
            if (ev.wheelDelta == null) {
                ev.wheelDelta = ev.detail * -40;
            }
            ev.wheelDeltaFlg = ev.wheelDelta < 0;
        }
        return ev;
    }
    $.getEvent = getEvent;

    //动态创建多节点
    var domCache = {};
    var create = $.create = function (t, b, h, y) {
        var rv;
        //制造节点
        if (typeof t == 'string') {
            if (b == 'text') {
                rv = doc.createTextNode(t);
                y = h;
            } else {
                b = b || {};
                t = t.toLowerCase();
                //IE中的只读属性
                if (U.IE && U.IE < 9 && (b.name || b.checked || b.hidefocus)) {
                    t = '<' + t;
                    if (b.name) {
                        t = t + ' name="' + b.name + '"';
                        delete b.name;
                    }
                    if (b.checked) {
                        t = t + ' checked="checked"';
                        delete b.checked;
                    }
                    if (b.hidefocus) {
                        t = t + ' hidefocus="true"';
                        delete b.hidefocus;
                    }
                    t = t + ' >';
                }
                if (!domCache[t]) {
                    domCache[t] = doc.createElement(t);
                }
                rv = domCache[t].cloneNode(false);
                if (typeof h == 'string' || typeof h == 'number') {
                    rv.innerHTML = h;
                } else if (toString.call(h) == '[object Array]') {
                    create(h, rv);
                }
                //设置属性
                $.attr(rv, b);
            }
        } else if (toString.call(t) == '[object Array]') {
            if (typeof t[0] == 'string') {
                rv = create.apply($, t);
            } else {
                rv = [];
                for (var i = 0; i < t.length; i += 1) {
                    rv.push(create.apply($, t[i]));
                }
            }
            y = b;
        }
        //加入
        y && $.append(y, rv);
        return rv;
    };

    // 类似jquery的date
    function data(d, k, v) {
        d = $$(d);
        var key = 'data_' + k;
        if (v === undefined) {
            return d.getAttribute('data_' + key) || '';
        }
        if (v == null) {
            d.removeAttribute('data_' + key);
        } else {
            d.setAttribute('data_' + key, v);
        }
    }
    $.data = data;

    //Dom 设置CSS
    $.css = function (d, k, v) {
        d = $$(d);
        if (typeof k == 'string') {
            if (k == 'opacity') {
                return $.opacity(d, v);
            }
            if (k == 'float') {
                k = U.IE ? 'styleFloat' : 'cssFloat';
            }
            k = k.replace(/\-([a-z])/g, function () {
                return arguments[1].toUpperCase();
            });
            if (v == null) {
                return d.style[k] || (d.currentStyle ? d.currentStyle[k] : d.ownerDocument.defaultView.getComputedStyle(d, null)[k]);
            }
            d.style[k] = v;
            return;
        }
        U.forEach(k, function (v, n) {
            $.css(d, n, v);
        });
    };

    //设置透明度
    $.opacity = U.IE && U.IE < 9 ? function (d, v) {
        d = $$(d);
        var ropacity = /opacity=([^)]*)/,
            ralpha = /alpha\([^)]*\)/,
            style = d.style,
            filter;
        if (v == null) {
            filter = style.filter || d.currentStyle.filter || '';
            return filter && filter.indexOf('opacity=') >= 0 ? parseFloat(ropacity.exec(filter)[1]) / 100 : 1;
        }
        var opacity = parseInt(v, 10) + '' === 'NaN' ? '' : 'alpha(opacity=' + v * 100 + ')';
        filter = style.filter || '';
        style.filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : opacity;
    } : function (d, v) {
        d = $$(d);
        if (v == null) {
            v = d.style.opacity || (d.currentStyle ? d.currentStyle.opacity : d.ownerDocument.defaultView.getComputedStyle(d, null).opacity);
            return v == '' ? 1 : v;
        }
        d.style.opacity = v;
    };

    // CSS3 translate变换 只支持平面的变换
    var matrixKeys = '-webkit-transform,-moz-transform,-o-transform,-ms-transform,transform';
    var matrix3dReg = /matrix3d\(((?:[\d\.\-]+\s*,\s*){12})([\d\.\-]+)\s*,\s*([\d\.\-]+)\s*,\s*([\d\.\-]+)\s*,\s*([\d\.\-]+)\s*\)/;
    var matrixReg = /matrix\(((?:[\d\.\-]+\s*,\s*){4})([\d\.\-]+)\s*,\s*([\d\.\-]+)\s*\)/;

    function translate(d, x, y) {
        var matrix = '';
        var keys = matrixKeys.split(',');
        do {
            matrix = $.css(d, keys.shift()) || '';
        } while (keys.length && matrix.indexOf('matrix') == -1);
        if (matrix.indexOf('matrix') == -1) {
            matrix = '';
        }
        var isGet = x == null && y == null;
        var rv = [0, 0, 0],
            u;

        function setRV(fn) {
            if (x != null) {
                rv[0] = x;
            }
            if (y != null) {
                rv[1] = y;
            }

            U.forEach(matrixKeys.split(','), fn);
        }
        if (u = matrix.match(matrix3dReg)) {
            rv[0] = parseInt(u[2]) || 0;
            rv[1] = parseInt(u[3]) || 0;
            rv[2] = parseInt(u[4]) || 0;
            if (isGet) {
                return rv;
            }
            setRV(function (key) {
                $.css(d, key, matrix.replace(matrix3dReg, 'matrix3d($1' + rv[0] + ', ' + rv[1] + ', ' + rv[2] + ', $5)'));
            });
            return;
        }
        if (u = matrix.match(matrixReg)) {
            rv[0] = parseInt(u[2]) || 0;
            rv[1] = parseInt(u[3]) || 0;
            if (isGet) {
                return rv;
            }
            setRV(function (key) {
                $.css(d, key, matrix.replace(matrixReg, 'matrix($1' + rv[0] + ', ' + rv[1] + ')'));
            });
            return;
        }
        if (!isGet) {
            setRV(function (key) {
                $.css(d, key, 'matrix(1, 0, 0, 1, ' + rv[0] + ', ' + rv[1] + ')');
            });
        }
    }
    $.translate = translate;

    function getDisplay(tag) {
        var x = doc.createElement(tag);
        doc.body.appendChild(x);
        x.style.cssText = 'position: absolute; visibility: hidden;';
        var dis = $.css(x, 'display');
        doc.body.removeChild(x);
        return dis;
    }
    var displayCacheKey = '_dom_show_';
    $.show = function (d, value) {
        d = $(d);
        $.css(d, 'display', value || d[displayCacheKey] || getDisplay(d.tagName) || '');
    };
    $.hide = function (d) {
        d = $$(d);
        var dis = $.css(d, 'display');
        if (dis != 'none') {
            d[displayCacheKey] = dis;
            $.css(d, 'display', 'none');
        }
    };
    $.isShow = function (d) {
        return $.css(d, 'display') !== 'none';
    }

    //CSS实际宽度
    void

    function () {
        //设置新的CSS属性，并把老的CSS属性返回
        function cssSwap(d, op) {
            var old = {};
            U.forEach(op, function (v, n) {
                old[n] = $.css(d, n);
                $.css(d, n, v);
            });
            return old;
        }

        //获取宽 高数据
        function getDomWH(d, t, c, a) {
            var v = d['offset' + t];
            if (v == 0) {
                var old = cssSwap(d, {
                    position: 'absolute',
                    visibility: 'hidden',
                    display: 'block'
                });
                v = d['offset' + t];
                cssSwap(d, old);
            }
            var i;
            if (c) {
                for (i = 0; i < c.length; i += 1) {
                    v -= parseFloat($.css(d, c[i])) || 0;
                }
            }
            if (a) {
                for (i = 0; i < a.length; i += 1) {
                    v += parseFloat($.css(d, a[i])) || 0;
                }
            }
            return v;
        }

        //CSS实际宽度
        $.width = function (d, v) {
            d = $$(d);
            if (v == null) {
                v = $.css(d, 'width');
                if (v && /px$/.test(v)) {
                    return parseInt(v) || 0;
                }
                return getDomWH(d, 'Width', ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']);
            }
            d.style.width = typeof v == 'number' ? v + 'px' : v;
        };

        //CSS实际高度
        $.height = function (d, v) {
            d = $$(d);
            if (v == null) {
                v = $.css(d, 'height');
                if (v && /px$/.test(v)) {
                    return parseInt(v) || 0;
                }
                return getDomWH(d, 'Height', ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']);
            }
            d.style.height = typeof v == 'number' ? v + 'px' : v;
        };

        // 获取某个节点的 left top width heiget 属性
        $.offset = function (d) {
            d = $$(d);
            var r = {},
                ds = d.style.display,
                old;
            if (ds == 'none') {
                old = cssSwap(d, {
                    position: 'absolute',
                    visibility: 'hidden',
                    display: 'block'
                });
            }
            r.left = 0;
            r.top = 0;
            if (d.getBoundingClientRect) {
                var box = d.getBoundingClientRect(),
                    body = doc.body,
                    docEl = doc.documentElement,
                    clientTop = docEl.clientTop || body.clientTop || 0,
                    clientLeft = docEl.clientLeft || body.clientLeft || 0,
                    zoom = 1;
                if (body.getBoundingClientRect) {
                    var bound = body.getBoundingClientRect();
                    zoom = (bound.right - bound.left) / body.clientWidth;
                }
                if (zoom > 1) {
                    clientTop = 0;
                    clientLeft = 0;
                }
                r.top = box.top / zoom + (window.pageYOffset || docEl && docEl.scrollTop / zoom || body.scrollTop / zoom) - clientTop;
                r.left = box.left / zoom + (window.pageXOffset || docEl && docEl.scrollLeft / zoom || body.scrollLeft / zoom) - clientLeft;
            } else {
                var e = d;
                while (e.offsetParent) {
                    r.left += (e.offsetLeft - e.scrollLeft);
                    r.top += (e.offsetTop - e.scrollTop);
                    e = e.offsetParent;
                }
            }
            r.width = d.offsetWidth;
            r.height = d.offsetHeight;
            if (old) {
                cssSwap(d, old);
            }
            return r;
        };
    }();

    //切换样式
    function toggleClass(d, v, f) {
        d = $$(d);
        v = U.trim(v);
        if (!v) {
            return;
        }
        if (f && !d.className) {
            d.className = v;
            return;
        }
        if (f === false && !d.className) {
            return;
        }
        var cn = ' ' + U.trim(d.className).replace(/\s+/g, ' ') + ' ',
            p = v.split(/\s+/);
        for (var i = 0; i < p.length; i += 1) {
            if (cn.indexOf(' ' + p[i] + ' ') >= 0) {
                if (!f) {
                    cn = cn.replace(' ' + p[i] + ' ', ' ');
                }
            } else {
                if (f || f == null) {
                    cn += (p[i] + ' ');
                }
            }
        }
        d.className = U.trim(cn);
    }
    $.toggleClass = function (d, v) {
        toggleClass(d, v);
    };
    //增加Class
    $.addClass = function (d, v) {
        toggleClass(d, v, true);
    };
    //增加Class
    $.hasClass = function (d, v) {
        d = $$(d);
        var cn = ' ' + U.trim(d.className || '').replace(/\s+/g, ' ') + ' ',
            p = U.trim(v).split(/\s+/);
        for (var i = 0; i < p.length; i += 1) {
            if (cn.indexOf(' ' + p[i] + ' ') == -1) {
                return false;
            }
        }
        return true;
    };
    //移除Class
    $.removeClass = function (d, v) {
        toggleClass(d, v, false);
    };

    //获得 HTML 或者设置HTML
    var htmlMap = {
        tr: ['table', 'tbody', 'tr'],
        tbody: ['table', 'tbody'],
        thead: ['table', 'tbody'],
        tfoot: ['table', 'tbody'],
        table: ['table', 'tbody'],
        colGroup: ['table', 'colGroup']
    };
    $.html = function (d, v) {
        d = $$(d);
        if (v == null) {
            return d.innerHTML;
        }
        try {
            d.innerHTML = v;
            return;
        } catch (e) {}

        // IE6789 表格插入 特殊处理
        $.clear(d);
        var tag = d.tagName.toLowerCase();
        var tags = htmlMap[tag] || [tag];
        var tagLen = tags.length - 1;
        var div = document.createElement('div');
        div.innerHTML = '<' + tags.join('><') + '>' + v + '</' + tags.join('></') + '>';
        var dix = div.firstChild;
        while (tagLen > 0) {
            dix = dix.firstChild;
            tagLen -= 1;
        }
        var divs = dix.childNodes;
        while (divs.length) {
            d.appendChild(divs[0]);
        }
        div = null;
        dix = null;
        divs = null;
    };
    //获得 HTML 或者设置HTML
    var domText = U.IE ? 'innerText' : 'textContent';
    $.text = function (d, v) {
        d = $$(d);
        if (v == null) {
            return d[domText];
        }
        d[domText] = v;
    };

    //清空字节点
    $.clear = function (d) {
        d = $$(d);
        while (d.childNodes.length) {
            d.removeChild(d.lastChild);
        }
    };
    //添加字节点
    $.append = function (d, v) {
        d = $$(d);
        if (toString.call(v) == '[object Array]') {
            for (var i = 0; i < v.length; i += 1) {
                $.append(d, v[i]);
            }
        } else {
            d.appendChild(v);
        }
    };

    //Dom事件
    void

    function () {
        var eventKeyDown = $.keydownConfig = {
            vkeyenter: 13,
            vkeybackspace: 8,
            vkeyspace: 32,
            vkeydel: 46,
            vkeyleft: 37,
            vkeyup: 38,
            vkeyright: 39,
            vkeydown: 40,
            vkeyesc: 27
        };

        //虚拟事件
        var vEvt = U.isTouch ? {
            vresize: 'orientationchange',
            vclick: 'mousedown',
            vdown: 'touchstart',
            vmove: 'touchmove',
            vup: 'touchend'
        } : {
            vresize: 'resize',
            vclick: 'click',
            vdown: 'mousedown',
            vmove: 'mousemove',
            vup: 'mouseup'
        };
        var vEvent = $.vEvents = U.forEach(vEvt, function (z) {
            return function (fn) {
                if (!fn) {
                    return z;
                }
                return [z, fn];
            };
        }, {});
        var exEvent = $.exEvents = [];
        //使得 火狐有 mousewheel mouseenter mouseleave 事件 以及 添加 keyenter事件
        function eventCut(e, fn, f) {
            //虚拟事件，需要转移只实体事件
            if (vEvent[e]) {
                return vEvent[e](fn, f);
            }

            //按键事件
            var ee;
            if (eventKeyDown[e]) {
                if (!fn) {
                    return 'keydown';
                }
                ee = '_dom_' + e + '_';
                if (f && !fn[ee]) {
                    fn[ee] = function (ev) {
                        var keyfun = eventKeyDown[e],
                            key = (ev || window.event).keyCode;
                        if (typeof keyfun == 'function' && keyfun(key)) {
                            return fn.call(this, ev);
                        }
                        if (keyfun == key) {
                            return fn.call(this, ev);
                        }
                    }
                }
                return ['keydown', fn[ee] || fn];
            }

            if (!U.IE && (e == 'mouseenter' || e == 'mouseleave')) {
                if (!fn) {
                    return e == 'mouseenter' ? 'mouseover' : 'mouseout';
                }
                ee = '_dom_mouse_el_';
                if (f && fn[ee] == null) {
                    fn[ee] = function (ev) {
                        var t = ev.relatedTarget;
                        if (t && !(t.compareDocumentPosition(this) & 8)) {
                            fn.call(this, ev);
                        }
                    }
                }
                return [e == 'mouseenter' ? 'mouseover' : 'mouseout', fn[ee] || fn];
            }

            if (U.IE && U.IE < 9 && e == 'input') {
                if (!fn) {
                    return 'propertychange';
                }
                ee = '_dom_input_';
                if (f && fn[ee] == null) {
                    fn[ee] = function (ev) {
                        if (window.event.propertyName.toLowerCase() == 'value') {
                            fn.call(this);
                        }
                    }
                }
                return ['propertychange', fn[ee] || fn];
            }

            if (U.Firefox && e == 'mousewheel') {
                return fn ? ['DOMMouseScroll', fn] : 'DOMMouseScroll';
            }

            //泛累虚拟事件
            for (var i = 0; i < exEvent.length; i += 1) {
                ee = exEvent[i](e, fn, f);
                if (ee) {
                    return ee;
                }
            }

            return fn ? [e, fn] : e;
        }

        //通过M.bind加入的事件，都会在这里留下缓存
        var evMap = new U.Cache();
        //对缓存的处理
        function eventHandle(d, e, f, fn, cap, a) {
            if (f) { //加入
                var data;
                if (evMap.has(d)) {
                    data = evMap.get(d);
                } else {
                    data = [];
                    evMap.set(d, data);
                }
                a.unshift(d);
                a.unshift(fn);
                var m = U.bind.apply(d, a);
                data.push([e, fn, m, cap]);
                return m;
            } else {
                var rv = [];
                if (evMap.has(d)) {
                    var c = evMap.get(d);
                    for (var i = 0; i < c.length;) {
                        if (c[i][0] == e && (fn == null || (fn && c[i][1] == fn))) {
                            rv.push([c[i][2], c[i][3]]);
                            c.splice(i, 1);
                        } else {
                            i += 1
                        }
                    }
                }
                return rv;
            }
        }

        //设置节点的属性
        void

        function () {
            //非IE下设置某些特殊属性 转义 以及节点缓存
            var domAttName = {
                className: 'class',
                htmlFor: 'for'
            };
            $.attr = function (d, k, v) {
                d = $$(d);
                if (typeof k == 'string') {
                    //转义
                    if (!U.IE && domAttName[k]) {
                        k = domAttName[k]
                    }
                    //取值
                    if (v == null) {
                        return k == 'style' ? d.style.cssText : (d[k] || d.getAttribute(k));
                    }
                    if (k == 'style') { //样式
                        typeof v == 'string' ? d.style.cssText = v : $.css(d, v);
                        return;
                    }
                    if (typeof v == 'function' && (/^on/.test(k) || eventKeyDown[k] || vEvent[k])) {
                        var f = eventCut(eventKeyDown[k] || vEvent[k] ? k : k.replace(/^on/, ''), v, true);
                        d['on' + f[0]] = f[1];
                        return;
                    }
                    if (k == 'className' || typeof v == 'function') {
                        d[k] = v;
                        return;
                    }
                    if (v === false) {
                        d.removeAttribute(k);
                        return;
                    }
                    d.setAttribute(k, v);
                    return;
                }
                U.forEach(k, function (v, n) {
                    $.attr(d, n, v);
                });
                return;
            };
        }();

        //添加/移除 事件
        var eventAppend = doc.addEventListener ? function (d, e, fn, cap) {
            d.addEventListener(e, fn, !!cap);
        } : function (d, e, fn, cap) {
            d.attachEvent('on' + e, fn);
            if (cap) {
                doc.documentElement.setCapture();
            }
        }
        var eventRemove = doc.removeEventListener ? function (d, e, fn, cap) {
            d.removeEventListener(e, fn, !!cap);
        } : function (d, e, fn, cap) {
            d.detachEvent('on' + e, fn);
            if (cap) {
                doc.documentElement.releaseCapture();
            }
        }
        //增加普通事件
        $.appendEvent = function (d, e, fn, cap) {
            d = $$(d);
            var f = eventCut(e, fn, true);
            eventAppend(d, f[0], f[1], cap);
        }
        //移除普通事件
        $.removeEvent = function (d, e, fn, cap) {
            d = $$(d);
            var f = eventCut(e, fn);
            eventRemove(d, f[0], f[1], cap);
        }
        //只执行一次的事件
        $.onec = function (d, e, fn, cap) {
            $.appendEvent(d, e, function () {
                fn.apply(this, arguments);
                $.removeEvent(d, e, arguments.callee, cap);
            }, cap);
        }
        //手动触发事件 获赠增加属性事件
        $.on = function (d, e, fn) {
            d = $$(d);
            var f = eventCut(e || 'vclick', fn, true);
            d['on' + f[0]] = f[1];
        }
        $.emit = doc.createEvent ? function (d, e, obj) {
            d = $$(d);
            var v = e || 'vclick',
                ev;
            ev = doc.createEvent('HTMLEvents');
            ev.initEvent(eventCut(v), true, true);
            if (obj) {
                U.assign(v, obj);
            }
            d.dispatchEvent(ev);
        } : function (d, e, obj) {
            d = $$(d);
            var v = e || 'vclick',
                ev;
            ev = doc.createEventObject();
            if (obj) {
                U.assign(ev, obj);
            }
            d.fireEvent('on' + eventCut(v), ev);
        }
        // 添加事件
        $.bind = function (d, e, f) {
            d = $$(d);
            var v = eventCut(e, f, true),
                m = eventHandle(d, e, true, v[1], false, Array.prototype.slice.call(arguments, 3));
            eventAppend(d, v[0], m);
        }
        // 添加事件 设置 setcapture
        $.bindCapture = function (d, e, f) {
            d = $$(d);
            var v = eventCut(e, f, true),
                m = eventHandle(d, e, true, v[1], true, Array.prototype.slice.call(arguments, 3));
            eventAppend(d, v[0], m);
        }
        //移除事件
        $.unbind = function (d, e, f) {
            d = $$(d);
            var v = f ? eventCut(e, f, false) : [eventCut(e, f, false), null],
                n = eventHandle(d, e, false, v[1]);
            for (var i = 0; i < n.length; i += 1) {
                eventRemove(d, v[0], n[i][0], n[i][1]);
            }
        }
        //点击事件
        $.vclick = function (d, f, cap) {
            if (typeof f == 'function') {
                $.appendEvent(d, 'vclick', f, cap);
            } else {
                $.emit(d, 'vclick', f);
            }
        }
    }();

    var live_prefix = 'live';
    var live_type = 'vclick';

    function live_fn(root, prefix, back) {
        return function () {
            var ev = getEvent();
            var target = ev.target;
            var fn, data, arg;
            while (target && target != root) {
                fn = target.getAttribute(prefix + ':fn');
                data = target.getAttribute(prefix + ':data');
                arg = [ev];
                if (data != null) {
                    arg.unshift(data);
                }
                if (back(target, fn, arg) === false) {
                    break;
                }

                target = target.parentNode;
            }
        }
    }

    $.eLive = function (id, type, prefix, back) {
        if (typeof type == 'function') {
            back = type;
            type = null;
            prefix = null;
        }
        if (typeof prefix == 'function') {
            back = prefix;
            prefix = null;
        }
        var i = new U.EventEmitter();
        $.appendEvent(id, type || live_type, live_fn($$(id), prefix || live_prefix, function (target, fn, arg) {
            if (fn) {
                i.target = target;
                arg.unshift(fn);
                if (!back || back.apply(i, arg) !== false) {
                    i.emit.apply(i, arg);
                }
                i.target = null;
            }
        }));
        return i;
    };

    //特殊事件提供
    $.live = function (id, back, type, prefix) {
        $.appendEvent(id, type || live_type, live_fn($$(id), prefix || live_prefix, function (target, fn, arg) {
            if (fn != null || arg.length > 1) {
                var fun = back;
                if (fn != null) {
                    fun = back[fn];
                }
                if (fun) {
                    return fun.apply(target, arg);
                }
            }
        }));
    };

    //设置输入框允许输入的字符串
    var iptAllowKeys = $.iptAllowKeys = {
        nums: '0123456789',
        letters: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
    };
    var iptCtrlKeys = 'vVxXcC';
    $.iptAllow = function (id, rule) {
        var d = $(id);
        var keys = iptAllowKeys[rule || 'nums'] || rule;
        $.appendEvent(d, 'keydown', function () {
            var ev = getEvent();
            var code = ev.keyCode;
            if (code == 13 || code == 8 || code == 9 || code == 46 || code == 27 || (code > 36 && code < 41) || (code > 111 && code < 124)) {
                return;
            }
            var key = (ev.key || '').replace(/^key/, '');
            var codeStr = ev.code;
            if (/^numpad(\d)$/ig.test(codeStr)) {
                key = RegExp.$1;
            }
            if (U.IE && U.IE < 10 && code == 96) {
                key = '0';
            }
            if (ev.ctrlKey && iptCtrlKeys.indexOf(key) >= 0) {
                // 剪切 复制 粘贴 允许
                return;
            }
            if (key && keys.indexOf(key) < 0) {
                ev.stopPropagation();
                ev.preventDefault();
                return false;
            }
        });
        $.appendEvent(d, 'input', function () {
            // 微信客户端 既然有 window.event 属性 日
            if (!window.event || window.event.propertyName === undefined || (window.event.propertyName || '').toLowerCase() == 'value') {
                var reg = new RegExp('[^' + keys + ']', 'g');
                var v = U.trim(d.value).replace(reg, '');
                if (v != d.value) {
                    d.value = v;
                }
            }
        });
    }

    var expandOne = $.expandOne = {};
    //对dom数组中的方法封装
    var expand = $.expand = {
        //不破坏当前this，生成新的对象 返回
        get: function (i) {
            if (typeof i == 'number') {
                return U.assign({
                    $: this[i]
                }, expandOne);
            }
            for (var n = 0, nl = this.length, r = [], o = {}, m; n < nl; n += 1) {
                m = eval(i);
                if (this[m] && !o[m]) {
                    r.push(o[m] = this[m]);
                }
            }
            return U.assign(r, expand);
        },
        //在当前对象数组中删除部分元素 返回本身
        wipe: function (i) {
            for (var n = 0, nl = this.length; n < nl; n += 1) {
                this[eval(i)] = null;
            }
            for (n = 0; n < nl;) {
                if (this[n]) {
                    n += 1;
                } else {
                    this.splice(n, 1);
                }
            }
            return this;
        },
        //迭代
        forEach: function () {
            var arg = slice.call(arguments);
            var fn = arg.shift();
            //console.log(toString.call(this));
            return U.forEach(this, function (v, i) {
                arg[0] = i;
                //console.log(v,i);
                return fn.apply(v, arg);
            }, arg[0], this);
        },
        //取值函数
        val: function () {
            var v = [],
                radio = true,
                rv, ckBox = true,
                cv = [],
                nn, tt;
            for (var i = 0; i < this.length; i += 1) {
                v.push(U.trim(this[i].value || this[i].getAttribute('value') || ''));
                nn = this[i].nodeName.toUpperCase();
                tt = this[i].type.toUpperCase();
                if (radio) {
                    radio = nn == 'INPUT' && tt == 'RADIO';
                    if (radio) {
                        ckBox = false;
                        if (this[i].checked) {
                            rv = this[i].value;
                        }
                    }
                }
                if (ckBox) {
                    ckBox = nn == 'INPUT' && tt == 'CHECKBOX';
                    if (ckBox && this[i].checked) {
                        cv.push(this[i].value);
                    }
                }
            }
            return radio ? rv : ckBox ? cv : v;
        }
    };
    $.setExpand = function (type, fn) {
        fn || (fn = $[type]);
        expand[type] = function () {
            Array.prototype.unshift.call(arguments, null);
            var ks = [];
            for (var i = 0, len = this.length; i < len; i += 1) {
                arguments[0] = this[i];
                ks[i] = fn.apply($, arguments);
            }
            return ks[0] == undefined ? this : ks;
        };
        expandOne[type] = function () {
            var d = this.$;
            var rv;
            if (d) {
                Array.prototype.unshift.call(arguments, d);
                rv = fn.apply($, arguments);
            }
            return rv == undefined ? this : rv;
        };
    }
    //继续扩展
    U.forEach(['data', 'attr', 'css', 'show', 'hide', 'isShow', 'opacity', 'width', 'height', 'html', 'text', 'clear', 'offset', 'bind', 'unbind', 'appendEvent', 'removeEvent', 'on', 'emit', 'addClass', 'removeClass', 'toggleClass', 'hasClass', 'live', 'eLive', 'vclick', 'iptAllow'], function (type) {
        $.setExpand(type);
    });
    //多节点查询，并附加方法
    $.get = function (els, context) {
        return U.assign(typeof els == 'string' ? sift(els, context) : els, expand);
    };
    $.id = function (id) {
        return U.assign({
            $: $$(id)
        }, expandOne);
    };
    return $;
});