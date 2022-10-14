define('kite', ['util?[hash]', 'dom?[hash]'], function(U, $){
    var $RV = {};

    var doc     = document,
        docEl   = doc.documentElement,
        bar     = 'kite',
        isTouch = U.isTouch;

    //isTouch = true;
    function getDClient(t){
        return docEl['client' + t] || window['inner' + t] || doc.body['client' + t];
    }
    //获得Scroll的值
    function getDScroll(t){
        t = 'scroll' + t;
        return docEl[t] || doc.body[t];
    }

    var matrixKeys = 'transform,-webkit-transform,-moz-transform,-o-transform,-ms-transform';
    function getOptOffset(d){
        if(isTouch){
            var matrix = '';
            var keys = matrixKeys.split(',');
            do{
                matrix = $.css(d,keys.shift());
            }while(keys.length && !/translate\(/.test(matrix) && !/matrix\(/.test(matrix));
            var ms =  matrix.split(/,+/);
            if(/translate\(/.test(matrix)){
                return [parseInt(ms[0].replace(/\D/g,'')) || 0,parseInt(ms[1]) || 0];
            }
            if(/matrix\(/.test(matrix)){
                return [parseInt(ms[4].replace(/\D/g,'')) || 0,parseInt(ms[5]) || 0];
            }
            return [0,0];
        }
        return [parseInt($.css(d,'left')) || 0,parseInt($.css(d,'top')) || 0];
    }
    function setOptOffset(d,x,y){
        var flag = false;
        if(isTouch){
            var v;
            if(x != null && y != null){
                flag = true;
                v = 'translate(' + x + 'px,' + y + 'px)';
            }
            else if(x != null){
                flag = true;
                v = 'translateX(' + x + 'px)';
            }
            else if(y != null){
                flag = true;
                v = 'translateY(' + y + 'px)';
            }
            else{
                return flag;
            }
            U.forEach(matrixKeys.split(','),function(k){
                $.css(d,k,v);
            });
            return flag;
        }
        else{
            if(x != null){
                flag = true;
                d.style.left = x + 'px';
            }
            if(y != null){
                flag = true;
                d.style.top = y + 'px';
            }
            return flag;
        }
    }

    function getOffset(d,left,top){
        var ps;
        if(left && left > 0 && left <= 1){
            ps = $.offset(d);
            left = Math.round(left*(getDClient('Width') - ps.width));
        }
        if(top && top > 0 && top <=1 ){
            ps || (ps = $.offset(d));
            top = Math.round(top*(getDClient('Height') - ps.height));
        }
        return {
            left:left,
            top:top
        }
    }

    /**
     * @param left
     * @param top
     */
    function getPos(left,top){
        var pos = {},ps;
        var isAbs = !this.isFixed;
        if(left != null){
            ps = getOffset(this.$,left,top);
            if(isAbs && left < 1){
                left = getDScroll('Left') + ps.left;
            }
            else{
                left = ps.left;
            }
            pos.left = left;
        }

        if(top != null){
            ps || (ps = getOffset(this.$,left,top));
            if(isAbs && top < 1){
                top = getDScroll('Top') + ps.top;
            }
            else{
                top = ps.top;
            }
            pos.top = top;
        }
        return pos;
    }

    function panelEventDestroy(){
        this.destroy();
    }
    function panelEventHide(){
        this.hide();
    }

    /**
     * 获取需要的节点
     * @param foc
     */
    function getBar(foc){
        var $$ = this.$$ = {};
        var $S = this.$S = {};
        var ds = this.$.getElementsByTagName('*');
        $S[''] = $.get([this.$]);
        for(var i= 0, b; i< ds.length; i+= 1){
            b = ds[i].getAttribute(bar);
            if(b){
                $$[b] = ds[i];
                if($S[b] == null){
                    $S[b] = $.get([]);
                }
                $S[b].push(ds[i]);
            }
        }

        // 点击销毁
        $S.destroy && this.bind('destroy', panelEventDestroy);
        // 点击隐藏
        $S.hide && this.bind('hide', panelEventHide);

        setTimeout(function(){
            try{
                ($$[foc] || $S[''][0]).focus();
            }catch(e){}
        },0);
    }

    /**
     * 拖动功能快开始
     */
    function dragStart(){
        if(this.dragData){
            return ;
        }
        var ev = $.getEvent();
        var optOffset = getOptOffset(this.$);
        this.dragData = {
            x : ev.clientX + (this.isFixed?0:getDScroll('Left')) - optOffset[0],
            y : ev.clientY + (this.isFixed?0:getDScroll('Top')) - optOffset[1],
            w : getScreen('Width') - this.$.offsetWidth,
            h : getScreen('Height') - this.$.offsetHeight,
            move: U.bind(dragMove,this),
            end: U.bind(dragEnd,this)
        };
        $.appendEvent(doc,'vmove',this.dragData.move,true);
        $.appendEvent(doc,'vup',this.dragData.end,true);
        docEl.style.WebkitUserSelect = 'none';
        this.emit('dragStart', ev);
    }
    /**
     * 拖动功能快 拖动中
     */
    function dragMove(){
        var m = this.dragData;
        if(!m){
            return ;
        }
        var ev  = $.getEvent(),
            st  = this.isFixed ? 0 : getDScroll('Top'),
            sl  = this.isFixed ? 0 : getDScroll('Left');
        var x,y;
        if(this.dragOver){
            y = ev.clientY - m.y + st;
            x = ev.clientX - m.x + sl;
        }
        else{
            y = Math.min(Math.max(ev.clientY - m.y + st, st),m.h + st);
            x = Math.min(Math.max(ev.clientX - m.x + sl, sl),m.w + sl);
        }
        setOptOffset(this.$, x, y);
        window.getSelection ? window.getSelection().removeAllRanges() : doc.selection.empty();
        this.emit('dragMove', ev);
    }
    /**
     * 拖动功能快结束
     */
    function dragEnd(){
        if(!this.dragData){
            return ;
        }
        $.removeEvent(doc,'vmove', this.dragData.move, true);
        $.removeEvent(doc,'vup', this.dragData.end, true);
        this.dragData = null;
        docEl.style.WebkitUserSelect = '';
        this.emit('dragEnd', $.getEvent());
    }

    // 面板函数
    var Panel = U.EventEmitter.extend(function(prot){
        prot.init = function(dom, focus, body){
            this._super('init');
            this.emit('create');
            this.$ = dom;
            body = body ? $(body) || doc.body : doc.body;
            body.appendChild(this.$);
            $.appendEvent(this.$, 'vdown', U.bind(this.focus, this));
            getBar.call(this, focus);
            var position = $.css(this.$, 'position');
            if(position != 'fixed'){
                position = 'absolute';
            }
            $.css(this.$, 'position', position);
            if(position == 'fixed'){
                this.isFixed = true;
            }
        }

        /**
         * 为元素绑定事件
         * @param k
         * @param fn
         */
        prot.bind = function(k, fn){
            if(typeof k == 'string'){
                var kk,ke;
                if(this.$S[k]){
                    kk = k;
                    ke = 'click';
                }
                else if(/_([a-z]+)$/.test(k)){
                    ke = RegExp.$1;
                    kk = k.replace(/_[a-z]+$/,'');
                }
                var ks = this.$S[kk];
                if(ks){
                    ks.appendEvent(ke,U.bind(fn,this));
                }
                return this;
            }
            for(var n in k){
                this.bind(n,k[n]);
            }
            return this;
        }

        // 绑定 live 事件
        prot.live = function(back, type, prefix){
            $.live(this.$, back, type, prefix || bar);
            return this;
        }
        prot.eLive = function(type, prefix, back){
            var i = $.eLive(this.$, 'vclick', prefix || bar, back);
            i.panel = this;
            return i;
        }

        /**
         * 添加拖动事件
         * @param id
         * @param ov
         */
        prot.drag = function(id,ov){
            ov !== undefined && (this.dragOver = ov);
            $.appendEvent(this.$$[id] || this.$, 'vdown', U.bind(dragStart,this));
            return this;
        }

        /**
         * 设定位置
         * @param left
         * @param top
         */
        prot.offset = function(left, top){
            //var ps = getOffset(this.$,left,top);
            if(isTouch){
                // top left 没赋值，默认使用 0
                if(left !== undefined){
                    $.css(this.$, 'left', 0);
                }
                if(top !== undefined){
                    $.css(this.$, 'top', 0);
                }
            }
            var pos = getPos.call(this, left, top);
            setOptOffset(this.$, pos.left, pos.top);
            return this;
        }

        /**
         * 替换 $ 中间的
         * @param html
         * @param foc
         */
        prot.html = function(html, foc){
            this.$.innerHTML = html;
            getBar.call(this, foc);
            return this;
        }

        /**
         * 关闭打开的
         */
        prot.destroy = function(){
            if(this.mask){
                removeMask.call(this.mask);
            }
            if(this._maskClickFn){
                $.removeEvent(this.mask.M, 'vclick', this._maskClickFn);
            }
            this.$.parentNode.removeChild(this.$);
            this.emit('destroy');
        }

        /**
         * 将弹框获得焦点
         * @param id
         */
        prot.focus = function(id){
            var z = ($.css(this.$,'z-index')*1 || 0) + 1;
            if(z < this.parent.Z){
                this.$.style.zIndex = this.parent.Z++;
            }
            try{
                this.$$[id].focus();
            }catch(e){}
            this.emit('focus');
            return this;
        }

        /**
         * 隐藏
         */
        prot.hide = function(){
            // this.$.style.display == 'none'
            if($.css(this.$, 'display') == 'none'){
                return this;
            }
            this.mask && removeMask.call(this.mask);
            $.hide(this.$);
            this.emit('hide');
            return this;
        }

        /**
         * 显示
         */
        prot.show = function(){
            if($.css(this.$, 'display') != 'none'){
                return this;
            }
            this.mask && showMask.call(this.mask);
            $.show(this.$);
            this.emit('show');
            return this;
        }


    });

    /**
     * 蒙板用
     */
    function getScreen(t){
        return getDClient(t);
    }

    //创建蒙板
    function createMask(){
        if(!this.M){
            this.M = $.create('div',{style:'position:fixed;overflow:hidden;top:0;left:0;right:0;bottom:0;display:none;z-index:' + this.Z + ';background:' + this.background},null,doc.body);
            this.Z += 1;
            $.opacity(this.M, this.opacity || 0);
        }
    }

    /**
     * 显示蒙板
     */
    function showMask(){
        this.nums += 1;
        if(this.nums != 1){
            return ;
        }
        $.show(this.M);
    }
    /**
     * 移除显示的蒙板
     */
    function removeMask(){
        this.nums -=1;
        if(this.nums<1){
            $.hide(this.M);
        }
    }

    //设置点击蒙版 关闭弹窗
    function _setMaskClick(type) {
        if(type == 'hide'){
            this.hide();
            return ;
        }
        if(typeof type == 'function'){
            type.call(this);
            return ;
        }
        this.destroy();
    }
    function setMaskClick(type){
        if(this._maskClickFn){
            return ;
        }
        this._maskClickFn = U.bind(_setMaskClick, this, type);
        $.appendEvent(this.mask.M, 'vclick', this._maskClickFn);
        return this;
    }

    /**
     * 弹窗 带蒙板
     */
    var Mask = U.createClass(function(prot){
        // 初始化
        prot.init = function(bg, opa, z){
            this.nums = 0;
            this.Z = z || $RV.zIndex;
            $RV.zIndex += 2000;
            this.background = bg || '#000';
            this.opacity = opa == null ? 0.2 : opa;
        }

        // 创建新的panel
        prot.create = function(){
            createMask.call(this);
            var panel = $RV.create.apply(this, arguments);
            panel.mask = this;
            panel.setMaskClick = setMaskClick;
            if($.css(panel.$, 'display') != 'none'){
                showMask.call(this);
            }
            return panel;
        }
    });

    //配置
    $RV.zIndex = 10000;

    //创建
    $RV.create = function(dom, foc, body){
        if(typeof dom === 'string'){
            if(/^#/.test(dom)){
                dom = $(dom.replace(/^#/,''));
            }
            else{
                dom = $.create('div', null, dom).firstChild;
            }
        }
        if(!dom.getAttribute('tabindex')){
            dom.setAttribute('tabindex', '999999999');
        }
        var panel = new Panel(dom, foc, body);
        panel.$.style.zIndex = this.Z++;
        panel.parent = this;
        return panel;
    };
    $RV.Z = 9000;
    //蒙版
    $RV.Mask = Mask;

    //弹框默认
    $RV.Panel = Panel;

    return $RV;
});
