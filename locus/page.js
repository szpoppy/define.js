define('page', ['util?[hash]', 'dom?[hash]'], function(U, $){
    var C = {
        bar_key: 'page',
        live_key: 'live',
        txt_first: '首页',
        txt_prev: '上一页',
        txt_next: '下一页',
        txt_last: '末页'
    };

    // 创建相关的节点
    var moduleFn = {
        // 首页按钮
        first : function(){
            var txt = this.txt_first || C.txt_first;
            var title = this.txt_title_first || C.txt_title_first;
            return '<a href="javascript:void(0);"' + (title?' title="' + title + '"':'') + ' hidefocus="true" ' + C.live_key + ':data="goFirst" class="key-first" ' + C.bar_key + '="first"><b>' + txt + '</b></a>';
        },
        // 上一页
        prev : function(){
            var txt = this.txt_prev || C.txt_prev;
            var title = this.txt_title_prev || C.txt_title_prev;
            return '<a href="javascript:void(0);"' + (title?' title="' + title + '"':'') + ' hidefocus="true" ' + C.live_key + ':data="goPrev" class="key-prev" ' + C.bar_key + '="prev"><b>' + txt + '</b></a>';
        },
        // 分页数字 Cot
        txtRank: function(){
            return '<span class="rank"><span class="rank-c" ' + C.bar_key + '="rank"></span></span>';
        },
        // 下一页
        next : function(){
            var txt = this.txt_next || C.txt_next;
            var title = this.txt_title_next || C.txt_title_next;
            return '<a href="javascript:void(0);"' + (title?' title="' + title + '"':'') + ' hidefocus="true" ' + C.live_key + ':data="goNext" class="key-next" ' + C.bar_key + '="next"><b>' + txt + '</b></a>';
        },
        // 末页
        last : function(){
            var txt = this.txt_last || C.txt_last;
            var title = this.txt_title_last || C.txt_title_last;
            return '<a href="javascript:void(0);"' + (title?' title="' + title + '"':'') + ' hidefocus="true" ' + C.live_key + ':data="goLast" class="key-last" ' + C.bar_key + '="last"><b>' + txt + '</b></a>';
        }
    };

    function getAllModuleFn(){
        return U.forEach(moduleFn,function(fn,k){
            return k;
        },[]);
    }

    // 刷新节点的特定样式
    var refreshFn = {
        //刷新第一页节点
        first : function(){
            this.$first.className = this.pCurr > 1 ? "key-first" : "key-first-dis";
        },
        //刷新上一页节点
        prev: function(){
            this.$prev.className = this.pCurr > 1 ? "key-prev" : "key-prev-dis";
        },
        //分页数字 刷新
        txtRank	: function(){
            var startNo	=	1,
                endNo	=	this.pCount,
                minNo	=	parseInt(this.pCount / 2) || 1,
                endFlg	=	false;

            if(this.pCount > this.pRank){
                minNo	=	Math.max(Math.floor(this.pRank / 2) - 1,0) || 1;
                startNo	=	(this.pCurr - minNo) > 0 ? this.pCurr - minNo : 1;
                endNo	=	startNo + this.pRank - 1;
                if(endNo > this.pCount){
                    endNo	=	this.pCount;
                    startNo	=	(endNo - this.pRank) > 0 ? endNo - this.pRank + 1 : 1;
                }
            }

            if(this.pCount - endNo > 0){
                endNo	-=	2;
                endFlg	=	true;
            }

            var tags = [];
            for(var i = startNo; i <= endNo; i += 1){
                if(i == this.pCurr){
                    tags.push('<a href="javascript:void(0);" hidefocus="true" class="key-rank-view">' + i + '</a>');
                }
                else{
                    tags.push('<a href="javascript:void(0);" ' + C.live_key + ':data="go:' + i + '" hidefocus="true" class="key-rank">' + i + '</a>');
                }
            }

            if (endFlg){
                tags.push('<b class="ellipsis-rank">..</b>');
                tags.push('<a href="javascript:void(0);" ' + C.live_key + ':data="go:' + this.pCount + '" hidefocus="true" class="key-rank">' + this.pCount + '</a>');
            }

            this.$rank.innerHTML = tags.join('');
        },
        //刷新下一页节点
        next	: function(){
            this.$next.className = this.pCurr < this.pCount ? "key-next" : "key-next-dis";
        },
        //刷新末页节点
        last	: function(){
            this.$last.className = this.pCurr < this.pCount ? "key-last" : "key-last-dis";
        }
    };

    var Page = U.createClass(U.EventEmitter, function(prot){
        // 初始化
        prot.init = function(){
            this._super('init');
            this.pCount = 1;
            this.pCurr = 1;
            this.pRank = 10;
            if(arguments.length > 0){
                this.set.apply(this, arguments);
            }
        }

        // 设置
        prot.set = function(pCount, pCurr, pRank){
            var flag;
            if(pCount){
                if(this.pCount != pCount){
                    flag = true;
                }
                this.pCount = pCount*1;
            }
            if(pCurr){
                if(this.pCurr != pCurr){
                    flag = true;
                }
                this.pCurr = pCurr*1;
            }
            if(pRank){
                pRank = Math.max(pRank*1 || 0, 3);
                if(this.pRank != pRank){
                    flag = true;
                }
                this.pRank = pRank;
            }
            // 有改变，调用刷新
            flag && this.refresh();
            return this;
        }

        //跳转首页
        prot.goFirst = function(){
            this.go(1);
            return this;
        }

        //跳转 上一页
        prot.goPrev = function(){
            this.go(this.pCurr - 1);
            return this;
        }

        //跳转下一页
        prot.goNext = function(){
            this.go(this.pCurr + 1);
            return this;
        }

        //跳转 末页
        prot.goLast = function(){
            this.go(this.pCount);
            return this;
        }

        //跳转固定页
        prot.go = function(num, same){
            num = num*1;
            num = num < 1 ? 1 : num > this.pCount ? this.pCount : num;
            if(!same && this.pCurr == num){
                // 默认，页码相同，不做改变
                return this;
            }
            this.pCurr = num;
            this.emit("change", num);
            this.refresh();
            return this;
        }

        //刷新 指定项或者所有 的Element节点
        prot.refresh = function(key){
            if(!this.wCot){
                return this;
            }
            if(key){
                var fn = refreshFn[key];
                fn && fn.call(this);
                return this;
            }
            U.forEach(this.moduleArr, function(key){
                var fn = refreshFn[key];
                fn && fn.call(this);
            }, null, this);
            return this;
        }

        prot.hide = function(){
            if(this.wCot){
                $.hide(this.wCot);
            }
            return this;
        }

        prot.show = function(){
            if(this.wCot){
                $.show(this.wCot);
            }
            return this;
        }

        // 讲 控件渲染到目标dom中
        prot.render = function(wCot, moduleArr){
            var i = this;
            wCot = i.wCot = $(wCot);

            // 加入事件
            $.live(wCot, function(data){
                var fs = data.split(':');
                var key = fs.shift();
                //console.log(key,fs);
                $.clearSelection();
                try{
                    i[key].apply(i,fs);
                }catch(e){}
            }, 'vclick', C.live_key);

            // 模块生成
            i.moduleArr = moduleArr || (moduleArr = getAllModuleFn());
            wCot.innerHTML = U.forEach(moduleArr, function(key){
                return (moduleFn[key] || key).call(this);
            }, [], this).join('');

            // 获取模块的关键节点
            //console.log(wCot.getElementsByTagName('*'),Object.prototype.toString.call(wCot.getElementsByTagName('*')));
            U.forEach(wCot.getElementsByTagName('*'), function(dom){
                var key = dom.getAttribute(C.bar_key);
                if(key){
                    ///console.log(key);
                    i['$' + key] = dom;
                }
            });
            //debugger ;
            i.refresh();
            return i;
        }
    });

    Page.options = C;

    return Page;
});
