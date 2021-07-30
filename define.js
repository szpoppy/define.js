void (function() {
    "use strict";
    if (window.define) {
        // 防止重复加载
        return;
    }
    // 常量
    var doc = document;
    var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
    var slice = Array.prototype.slice;

    function extra(option, additional) {
        for (var n in additional) {
            option[n] = additional[n];
        }
    }

    function forEach(arr, fun) {
        if (arr.forEach) {
            arr.forEach(fun);
        } else {
            for (var i = 0; i < arr.length; i += 1) {
                fun(arr[i], i);
            }
        }
    }

    //当前脚本的script节点
    var baseMain = "data-main";
    var basePath = "data-base";
    var jsNode = (function() {
        var nodes = doc.getElementsByTagName("script");
        var node;
        for (var i = nodes.length - 1; i > -1; i -= 1) {
            var item = nodes[i];
            if (item.getAttribute(basePath) != null) {
                node = nodes[i];
                break;
            }
            if (!node && nodes[i].src) {
                node = nodes[i];
            }
        }
        return node;
    })();

    function getScriptSrc(node) {
        return (node.hasAttribute ? node.src : node.getAttribute("src", 4)) || window.location.href;
    }

    var linkA = document.createElement("a");
    /**
     * 获得url的真实地址
     * @param url
     * @returns {string}
     */
    function getFullUrl(url) {
        linkA.setAttribute("href", url);
        return linkA.hasAttribute ? linkA.href : linkA.getAttribute("href", 4);
    }

    var jsNodeFullUrl = getScriptSrc(jsNode);
    // 不带参数的URL
    var jsNodeUrl = jsNodeFullUrl.split(/[\?\#]/)[0];
    // base
    var jsMain = jsNode.getAttribute(baseMain) || "";
    var jsBase = getFullUrl(jsNode.getAttribute(basePath) || "./").replace(/\/*$/, "/");
    // 配置
    var $C = {
        baseURL: jsBase,
        suffix: jsNodeUrl
            .split(/\/+/)
            .pop()
            .replace(/^[^.]+/, ""),
        paths: {
            // locus 的当前路径
            "@": jsNodeUrl.replace(/\/[^\/]*$/, "/"),
            "~": jsBase
        },
        alias: {}
    };

    /**
     * amd 配置
     * @param option
     */
    function config(option) {
        if (!option) {
            return;
        }
        if (option.paths) {
            extra($C.paths, option.paths);
        }
        if (option.alias) {
            extra($C.alias, option.alias);
        }
        if (option.baseURL) {
            $C.baseURL = option.baseURL;
        }
        if (option.suffix) {
            $C.suffix = option.suffix;
        }
    }

    /**
     * 拼接url
     * @param url
     * @param base
     * @param flag
     * @returns {*}
     */
    function fixUrl(url, base) {
        if (/^(?:http(?:s)?|file):\/\//i.test(url) || /^\/{2}/i.test(url) || /^\//i.test(url)) {
            return getFullUrl(url);
        }
        var ps = $C.paths;
        for (var n in ps) {
            if (url.indexOf(n) == 0) {
                return fixUrl(url.replace(n, ps[n]), base);
            }
        }
        return getFullUrl((base || $C.baseURL) + url.replace(/^\.\//, ""));
    }

    // 别名转换为真实的 url
    var xAlias = {};

    /**
     *
     * @param src
     * @param base
     * @returns {Array|{index: number, input: string}|*|{ID, CLASS, NAME, ATTR, TAG, CHILD, POS, PSEUDO}|Boolean}
     */
    function getUrl(src, dir) {
        var x = xAlias[src] || $C.alias[src] || src;
        var u = x.match(/^([^?#]*)(?:\?*([^#]*))?(#.*)?$/);
        var u1 = u[1] || "";
        var u2 = u[2] || "";
        var u3 = u[3] || "";
        if (u2) {
            u2 = "?" + u2;
        }
        var url = fixUrl(/\.js|\.css$/.test(u1) ? u1 : u1 + $C.suffix, dir);
        return [url + u2 + u3, url + u2, url + u3, url, u2, u3];
    }

    /**
     * 加载 js
     * @param url
     * @param callback
     * @param charset
     * @returns {Element}
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
        if ("onload" in node) {
            node.onload = node.onerror = function() {
                node.onload = node.onerror = null;
                onload();
            };
        } else {
            node.onreadystatechange = function() {
                if (/loaded|complete/.test(node.readyState)) {
                    node.onreadystatechange = null;
                    onload();
                }
            };
        }

        node.async = true;
        head.appendChild(node);
        node.src = url;
        return node;
    }

    /**
     * 加载 css
     * @param url
     * @param charset
     */
    function loadCSS(url, charset) {
        var link = doc.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        if (charset) {
            link.setAttribute("charset", charset);
        }
        head.appendChild(link);
        link.href = url;
    }

    /**
     * 获取当前执行js的url
     * @returns {*}
     */
    function getCurrentScriptSrc() {
        //取得正在解析的script节点
        if (doc.currentScript) {
            //firefox 4+
            return getScriptSrc(doc.currentScript);
        }

        // 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
        var stack;
        try {
            //强制报错,以便捕获e.stack
            eval("a.b.c()");
        } catch (e) {
            //safari的错误对象只有line,sourceId,sourceURL
            stack = e.stack;
            if (!stack && window.opera) {
                //opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
                stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
            }
        }
        if (stack) {
            // console.log("stack", stack)
            // 取得错误的 js文件，需要更具 具体项目中来更变
            /**e.stack最后一行在所有支持的浏览器大致如下:
             *chrome23:
             * at http://113.93.50.63/data.js:4:1
             *firefox17:
             *@http://113.93.50.63/query.js:4
             *opera12:
             *@http://113.93.50.63/data.js:4
             *IE10:
             *  at Global code (http://113.93.50.63/data.js:4:1)
             */
            stack = stack.split(/\n/);
            var one = (stack[stack.length - 1] || "").split(/[@ ]/).pop();
            for (var j = stack.length - 1; j >= 0; j -= 1) {
                if (stack[j].indexOf("definePush") > -1) {
                    one = (stack[j + 2] || "").split(/[@ ]/).pop();
                    break;
                }
            }
            one = one[0] == "(" ? one.slice(1, -1) : one;
            return one.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
        }

        var nodes = doc.getElementsByTagName("script"); //只在head标签中寻找
        for (var i = 0, node; (node = nodes[i++]); ) {
            if (node.readyState === "interactive") {
                return getScriptSrc(node);
            }
        }

        return "";
    }
    // 模块事件
    var events = {};
    /**
     * 模块 define 触发的事件
     * @param key
     * @param fn
     * @returns {*|HTMLElement}
     */
    function onDefine(key, fn) {
        if (!/^#+/.test(key)) {
            key = getUrl(key)[2];
        }

        events[key] || (events[key] = []);
        events[key].push(fn);
    }

    function emitEvent(m) {
        // 触发事件
        var fns = [];
        var key = "#" + m.index;
        if (m.index && events[key]) {
            fns.push.apply(fns, events[key]);
        }
        key = m.url;
        if (events[key]) {
            fns.push.apply(fns, events[key]);
        }
        for (var i = 0; i < fns.length; i += 1) {
            fns[i](m.exports, m);
        }
    }

    // 是否支持无序加载
    var canDisorder = getCurrentScriptSrc() !== "";
    // canDisorder = false

    // 序列加载js文件
    var lastOrderlyLoad = jsNodeUrl;
    //
    var xModules = {};
    // 别名
    var xAlias = {};

    // 设置模块
    var noModIndex = 60000 + Math.floor(Math.random() * 5000);

    function setModule(index, deps) {
        var url = canDisorder ? getCurrentScriptSrc() : lastOrderlyLoad;
        var m = {};
        if (url) {
            url = url.split(/[?#]/)[0];
            if (jsBase && url == jsNodeUrl) {
                m.dir = jsBase;
            } else {
                m.dir = url.replace(/[^\/]*$/, "");
            }
        } else {
            noModIndex += Math.floor(Math.random() * 26);
            url = noModIndex.toString(36);
            m.dir = "";
        }
        m.index = index;
        m.deps = deps || [];
        m.exports = {};
        if (index) {
            if (!xModules[url]) {
                // 无默认,第一个就是默认的
                xModules[url] = m;
            }
            url += "#" + index;
            xAlias[index] = url;
        }
        m.url = url;
        xModules[url] = m;
        return m;
    }

    function getModule(id, dir) {
        var us = getUrl(id, dir);
        return xModules[id] || xModules[us[2]] || {};
    }

    function getExport(id, dir) {
        return getModule(id, dir).exports;
    }

    function getExports(deps, dir) {
        var arr = [];
        forEach(deps, function(dep) {
            var item = getExport(dep, dir);
            if (item != undefined) {
                arr.push(item);
            }
        });
        return arr;
    }

    //　验证　模块是否完成
    function isAllFinish(deps, dir) {
        var isOk = true;
        for (var i = 0, m; i < deps.length; i += 1) {
            var m = getModule(deps[i], dir);
            if (!m.isFinish) {
                isOk = false;
                break;
            }
        }
        return isOk;
    }

    // 事件

    // js加载器================
    //已经加载完毕的js
    var jsLoaded = {};
    jsLoaded[jsNodeUrl] = true;
    // 加载中
    var jsLoading = {};

    var orderlyLoadFlag;

    function hasJsLoading() {
        if (canDisorder) {
            for (var n in jsLoading) {
                return true;
            }
            return false;
        }
        return orderlyLoadFlag;
    }

    // 模块中的回调函数
    var jsFactorys = [];

    // 回调jsFactorys中的函数
    function callFactorys() {
        if (hasJsLoading()) {
            return;
        }
        if (jsFactorys.length == 0) {
            lastOrderlyLoad = null;
            return;
        }
        for (var i = jsFactorys.length - 1; i >= 0; i -= 1) {
            if (jsFactorys[i]()) {
                jsFactorys.splice(i, 1);
                callFactorys();
                return;
            }
        }
        throw "jsFactorys Error";
    }

    //　单个js加载
    function loadDepEnd(key) {
        delete jsLoading[key];

        // 没有代加载完成的ｊｓ　执行回调
        callFactorys();
    }

    function loadDep(dep, dir) {
        var us = getUrl(dep, dir);
        var key = us[3];
        var url = us[0];

        function callback() {
            jsLoaded[key] = true;
            setTimeout(function() {
                loadDepEnd(key);
            }, 0);
        }
        if (jsLoaded[key]) {
            // 已经加载
            callback();
            return;
        }

        if (jsLoading[key]) {
            //　正在加载中
            return;
        }

        // 加载
        jsLoading[key] = true;
        if (/\.css$/i.test(key)) {
            loadCSS(url);
            callback();
        } else {
            loadJS(url, callback);
        }
    }

    // 有序加载
    var orderlyLoads = [];

    function orderlyLoadDep() {
        if (orderlyLoadFlag) {
            // 有加载序列
            return;
        }
        if (orderlyLoads.length > 0) {
            var od = orderlyLoads.shift();
            var us = getUrl(od[0], od[1]);
            var key = us[3];
            var url = us[0];

            if (jsLoaded[key]) {
                orderlyLoadDep();
                return;
            }
            lastOrderlyLoad = url;
            orderlyLoadFlag = true;
            loadJS(url, function() {
                jsLoaded[key] = true;
                setTimeout(function() {
                    orderlyLoadFlag = false;
                    orderlyLoadDep();
                }, 0);
            });
            return;
        }
        // 没有代加载完成的ｊｓ　执行回调
        callFactorys();
    }

    function orderlyLoad(deps, dir) {
        forEach(deps, function(dep) {
            orderlyLoads.push([dep, dir]);
        });

        orderlyLoadDep();
    }
    // 无序加载
    function disorderLoad(deps, dir) {
        forEach(deps, function(dep) {
            loadDep(dep, dir);
        });
    }

    function requireJs(m, factory) {
        jsFactorys.push(function() {
            // 验证deps模块是否全部完成
            if (!isAllFinish(m.deps, m.dir)) {
                return false;
            }

            if (typeof factory == "function") {
                var ex = factory.apply(m, getExports(m.deps, m.dir));
                if (ex != null) {
                    m.exports = ex;
                }
            } else {
                m.exports = factory;
            }

            // 表示此模块　好了
            m.isFinish = true;

            emitEvent(m);

            return true;
        });
        canDisorder ? disorderLoad(m.deps, m.dir) : orderlyLoad(m.deps, m.dir);
    }

    // 加载
    function definePush(id, deps, factory) {
        // 设置模块
        var m = setModule(id, deps);
        requireJs(m, factory);
    }

    function define(index, deps, factory) {
        if (deps === undefined) {
            factory = index;
            index = undefined;
        } else if (factory === undefined) {
            factory = deps;
            if (typeof index != "string") {
                deps = index;
                index = undefined;
            }
        }

        definePush(index, deps, factory);
    }

    function require(urls, callback, jsBase) {
        if (arguments.length == 1 && typeof urls == "string" && !/\.css(?:[?#]+.*)?$/.test(urls)) {
            return getExport(arguments[0]);
        }

        if (typeof urls == "string") {
            urls = [urls];
        }
        definePush(null, urls, callback, jsBase);
    }

    // 部分使用
    define.amd = true;
    define.on = onDefine;
    define.config = config;

    window.require = require;
    window.define = define;

    // 启动mian
    function readyInit() {
        if (jsMain) {
            require([jsMain], null, jsBase);
        }
    }

    if ("interactive|complete".indexOf(document.readyState) > 0) {
        readyInit();
    } else {
        document.attachEvent
            ? document.attachEvent("onreadystatechange", function() {
                  if (document.readyState == "complete" || document.readyState == "loaded") {
                      readyInit();
                  }
              })
            : document.addEventListener("DOMContentLoaded", readyInit, false);
    }
})();
