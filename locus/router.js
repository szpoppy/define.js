/**
 * 目前仅支持 hash 路由
 */

define(['util?[hash]'], function(util){
    // 返回值
    var rv = util.EventEmitter();

    var hashMap = {};
    var hashDef = '';
    function append(opt, prev, dir){
        prev || (prev = '');
        dir || (dir = '')
        util.forEach(opt, function(item, k){
            var key = prev + k;
            if(typeof item == 'string'){
                hashMap[key] = dir + item;
            }
            else{
                var ext;
                if(typeof item[0] == 'string'){
                    hashMap[key] = dir + item[0];
                    if(item[1]){
                        ext = item[1];
                    }
                }
                else{
                    ext = item;
                }
                if(ext){
                    append(ext, key, dir);
                }
            }
        })
    }
    // 添加路由
    rv.append = function(key, val){
        var opt;
        if(typeof key == 'string'){
            opt = {};
            opt[key] = val;
            val = ''
        }
        else{
            opt = key;
        }

        append(opt, '', val);
        return this;
    }

    // 路由id 
    var routerDom;

    // 添加路由 当前值 默认值 第一个路由
    var routerIndex, hashIndex;
    function goRouter(){
        var hashs = location.hash.replace(/^#*\/*/, '').split('?');
        var hashStr = hashs.shift()
        var hashQuery = util.parseQS(hashs.join('?') || '');
        var hash = hashMap[hashStr];

        if(!hash && hashMap[hashDef]){
            hashStr = hashDef;
            hash = hashMap[hashDef];
        }
        if(!hash){
            rv.emit('none')
        }
        else{
            if(routerIndex){
                routerIndex.destroy && routerIndex.destroy();
                routerIndex = null;
            }
            routerDom.innerHTML = '';
            var ePara = {
                path: hashStr,
                query: hashQuery,
                root: routerDom
            }
            rv.emit('start', ePara);
            hashIndex = hash;
            require([hash], function(mode){
                if(hashIndex == hash){
                    routerIndex = mode;
                    routerDom.innerHTML = mode.tpl;
                    mode.ready && mode.ready(ePara);
                    ePara.mode = mode
                    rv.emit('end', ePara);
                }
            });
        }
    }
 
    // 初始化
    rv.init = function(id){
        routerDom = typeof id == 'string' ? document.getElementById(id): id;
        window.addEventListener('hashchange', goRouter, false);
        goRouter();
        return this;
    }

    return rv;
});