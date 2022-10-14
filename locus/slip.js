/**
 作者:轨迹
 日期:2015-9-25
 功能:对dom的操作集合
 */
define(['util?[hash]', 'dom?[hash]'], function(U, $){
    var doc = document;

    var moveData;
    //鼠标移动开始
    function slipDown(self){
        if(moveData){
            return ;
        }
        var ev = $.getEvent();
        self.baseX = ev.clientX;
        self.baseY = ev.clientY;
        moveData = self;
        $.appendEvent(doc, 'vmove', slipMove, true);
        $.appendEvent(doc, 'vup', slipUp, true);
        self.emit('start');
    }

    function getSlipData(type){
        var ev = $.getEvent();
        moveData.emit(type, ev.clientX - moveData.baseX, ev.clientY - moveData.baseY, ev);
    }

    //鼠标移动中
    function slipMove(evt){
        if(moveData){
            window.getSelection ? window.getSelection().removeAllRanges() : doc.selection.empty();
            getSlipData('move', evt);
        }
    }

    //鼠标抬起
    function slipUp(evt){
        if(moveData){
            $.removeEvent(doc, 'vup', slipUp, true);
            $.removeEvent(doc, 'vmove', slipMove, true);
            getSlipData('end', evt);
            moveData = null;
        }
    }

    return U.createClass(U.EventEmitter, function(prot){
        // 初始化
        prot.init = function(id){
            this._super('init');
            this.dom = $(id);
            this.cur = 0;
            $.bind(this.dom, 'vdown', slipDown, this);
        }
    });
});