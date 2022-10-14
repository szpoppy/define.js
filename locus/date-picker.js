define(['util?[hash]', 'dom?[hash]'], function(U, $){
    var live_key = 'live';

    var format = U.formatDate;
    function getNow(){
        return new Date();
    }

    var root, rootData, rootDate;
    function isInValue(date){
        var vs = rootData.values;
        if(vs.length == 0){
            return false;
        }
        var type = rootData.type;
        var time = date.getTime();
        //console.log(vs[0].getTime() == date.getTime(),format(vs[0]),format(date));
        if(type == 1 || vs.length == 1){
            return vs[0].getTime() == time;
        }

        if(type == 2){
            var min = Math.min(vs[0].getTime(),vs[1].getTime());
            var max = Math.max(vs[0].getTime(),vs[1].getTime());
            //console.log(format(vs[0]),format(vs[1]),format(date),min <= time,time <= max);
            return min <= time && time <= max;
        }
        if(type == 3){
            for(var i = 0; i< vs.length; i+=1){
                if(vs[i].getTime() == time){
                    return true;
                }
            }
        }
        return false;
    }
    // 根据类型，设置values
    function setValues(date){
        var type = rootData.type;
        var vs = rootData.values;
        if(type == 1 || type == 4 || type == 5 || vs.length == 0){
            rootData.values = [date];
            return;
        }
        var time = date.getTime();
        if(type == 2){
            var t0 = vs[0]?vs[0].getTime():0;
            var t1 = vs[1]?vs[1].getTime():0;
            if(time == t0 || time == t1){
                return ;
            }
            vs.push(date);
            if(vs.length <= 2){
                return ;
            }
            if((time > t0 && time < t1) || (time < t0 && time > t1)){
                rootData.values = vs.slice(-2);
            }
            else if(time > t0 && time > t1){
                rootData.values = [t0 > t1?vs[1]:vs[0],date];
            }
            else{
                rootData.values = [t0 > t1?vs[0]:vs[1],date];
            }
            return
        }
        if(type == 3){
            var flag = true;
            for(var i = 0; i< vs.length; i+=1){
                if(vs[i].getTime() == time){
                    vs.splice(i, 1);
                    flag = false;
                    break;
                }
            }
            if(flag){
                vs.push(date);
            }
        }
    }

    //填充年份
    function fillYear(year){
        year || (year = rootDate.getFullYear());
        var html = ['<span class="b3" ' + live_key + ':fn="year_list" ' + live_key + ':data="' + (year - 23) + '">&lt;</span>'];
        var start = year - 11;
        var end = year + 11;
        for(var i=start;i<=end;i+=1){
            html.push('<span class="b3" ' + live_key + ':fn="year_elect" ' + live_key + ':data="' + i + '">' + i + '</span>');
        }
        html.push('<span class="b3" ' + live_key + ':fn="year_list" ' + live_key + ':data="' + (year + 23) + '">&gt;</span>');
        $.html('-date-picker-b-year',html.join(''))
    }
    function fillYearTxt(){
        var year = rootDate.getFullYear();
        $.text('-date-picker-txt-year',year + '年');
    }

    function fillMonthTxt(){
        var month = rootDate.getMonth() + 1;
        $.text('-date-picker-txt-month',month + '月');
    }

    function fillDay(){
        var date = rootDate;
        //console.log(format(date));
        var month = date.getMonth();
        //var today = format(rootIpt.getValue(),'YYYYMMDD');
        //var today = 1000;
        var day = new Date(format(date,'YYYY/MM/01'));
        day.setDate(day.getDate() - 1);
        day.setDate(day.getDate() - day.getDay());
        var html = [];
        //console.log(format(day));
        for(var i=0,t,m,n;i<42;i+=1){
            //console.log(format(day));
            t = format(day, 'YYYYMMDD');
            n = day.getDate();
            m = day.getMonth();
            html.push('<span ' + live_key + ':fn="day_elect" ' + live_key + ':data="' + format(day,'YYYY/MM/DD') + '" class="b2' + (month == m?'':' color1') + (isInValue(day)?' bg1':'') + '">' + n + '</span>');
            day.setDate(n + 1);
        }
        $.html('-date-picker-b-day',html.join(''));
    }

    function hideRoot(){
        root.style.display = "none";
        if(rootData){
            rootData.emit('close');
            rootData = null;
            rootDate = null;
        }
    }

    function setYear(year){
        rootDate.setFullYear(year);
        fillYear();
        fillYearTxt();
        fillMonthTxt();
        fillDay();
    }

    function setMonth(month){
        var y1 = rootDate.getFullYear();
        rootDate.setMonth(month);
        var y2 = rootDate.getFullYear();
        if(y1 != y2){
            fillYear();
            fillYearTxt();
        }
        fillMonthTxt();
        fillDay();
    }

    var rootEvent = {
        // 隐藏
        close:function(){
            hideRoot();
        },
        // 上一年
        year_prev:function(){
            setYear(rootDate.getFullYear() - 1);
            return false;
        },
        // 年份选择界面
        year:function(){
            var y = $('-date-picker-ccc');
            y.className = y.className == 'ccc for-year'?'ccc for-day':'ccc for-year';
        },
        // 下一年
        year_next:function(){
            setYear(rootDate.getFullYear() + 1);
            return false;
        },
        // 重新填充年份
        year_list:function(year){
            fillYear(year*1);
        },
        // 选择年份
        year_elect:function(year){
            setYear(year*1);
            if(rootData.type == 5){
                //console.log('year_elect+values',new Date(rootDate.getTime()))
                setValues(new Date(rootDate.getTime()));
                rootData.emit('elect');
                hideRoot();
            }
            $('-date-picker-ccc').className = 'ccc for-day';
        },
        // 上一月
        month_prev:function(){
            setMonth(rootDate.getMonth() - 1);
            return false;
        },
        // 显示月份
        month:function(){
            var m = $('-date-picker-ccc');
            m.className = m.className == 'ccc for-month'?'ccc for-day':'ccc for-month';
        },
        // 下一月
        month_next:function(){
            setMonth(rootDate.getMonth() + 1);
            return false;
        },
        // 月份选择
        month_elect:function(month){
            setMonth(month*1);
            if(rootData.type == 4){
                setValues(new Date(rootDate.getTime()));
                rootData.emit('elect');
                hideRoot();
            }
            $('-date-picker-ccc').className = 'ccc for-day';
        },
        // 快速选择
        quick_elect:function(num){
            var tody = getNow();
            tody.setDate(tody.getDate() + (num*1));
            rootEvent.day_elect(format(tody, 'YYYY/MM/DD'));
        },
        // 选择日期
        day_elect:function(day){
            setValues(new Date(day));
            rootData.emit('elect');
            fillDay();
            var type = rootData.type;
            if(type == 1 || type == 4 || type == 5){
                hideRoot();
            }
            //rootIpt.setValue(new Date(day));
            //
        },
        // 清空
        clear:function(){
            rootData.values = [];
            fillDay();
            rootData.emit('elect');
        }
    }

    function init(me, x, y){
        if(rootData != me){
            rootData = me;
            var date = rootData.values[rootData.values.length - 1];
            date = date?new Date(date.getTime()):getNow();
            rootDate = date;
            fillYear();
            fillYearTxt();
            fillMonthTxt();
            fillDay();
        }

        $('-date-picker-ccc').className = 'ccc for-day';
        root.style.display = "block";
        if(x == null){
            x = 0.5;
        }
        if(y == null){
            y = 0.5;
        }
        var ps = $.offset(root);
        var sc = $.getScreen();
        var dw = sc.width;
        if(x > 0 && x <= 1){
            x = Math.round(x*(dw - ps.width));
        }
        if(y > 0 && y <= 1){
            y = Math.round(y*(sc.height - ps.height));
        }
        if(x + ps.width + 32 > dw){
            x = dw - ps.width - 32;
        }
        root.style.cssText = 'left:' + x + 'px;top:' + y + 'px';

        // 单月 4 不显示 日
        if(rootData.type == 4){
            rootEvent.month();
        }
        else if(rootData.type == 5){
            rootEvent.year();
        }
    }

    var create = function(me, x, y){
        root = $.create('div',{className:'date-picker'},[
            '<div class="cc">',
            '<div class="close" ' + live_key + ':fn="close"></div>',
            '<div class="head">',
            '<div class="w1">',
            '<span class="fn1" ' + live_key + ':fn="year_prev"></span><span ' + live_key + ':fn="year" class="txt1" id="-date-picker-txt-year">-</span><span class="fn2" ' + live_key + ':fn="year_next"></span>',
            '</div>',
            '<div class="w1">',
            '<span class="fn1" ' + live_key + ':fn="month_prev"></span><span ' + live_key + ':fn="month" class="txt1" id="-date-picker-txt-month">-</span><span class="fn2" ' + live_key + ':fn="month_next"></span>',
            '</div>',
            '</div>',
            '<div class="ccc" id="-date-picker-ccc">',
            '<div class="fl-day">',
            '<div class="l2">',
            '<span class="b1">日</span>',
            '<span class="b1">一</span>',
            '<span class="b1">二</span>',
            '<span class="b1">三</span>',
            '<span class="b1">四</span>',
            '<span class="b1">五</span>',
            '<span class="b1">六</span>',
            '</div>',
            '<div class="l3" id="-date-picker-b-day"></div>',
            '</div>',
            '<div class="fl-month">',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="0" class="b4">1月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="1" class="b4">2月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="2" class="b4">3月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="3" class="b4">4月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="4" class="b4">5月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="5" class="b4">6月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="6" class="b4">7月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="7" class="b4">8月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="8" class="b4">9月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="9" class="b4">10月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="10" class="b4">11月</span>',
            '<span ' + live_key + ':fn="month_elect" ' + live_key + ':data="11" class="b4">12月</span>',
            '</div>',
            '<div class="fl-year" id="-date-picker-b-year"></div>',
            '</div>',
            '<div class="btns">',
            '<span ' + live_key + ':fn="quick_elect" ' + live_key + ':data="-1" class="b5">昨天</span>',
            '<span ' + live_key + ':fn="quick_elect" ' + live_key + ':data="0" class="b5">今天</span>',
            '<span ' + live_key + ':fn="quick_elect" ' + live_key + ':data="1" class="b5">明天</span>',
            '<span ' + live_key + ':fn="clear" class="b6">清空</span>',
            '<span ' + live_key + ':fn="close" class="b6">确定</span>',
            '</div>',
            '</div>',
            ''
        ].join(''),document.body);
        hideRoot();
        $.appendEvent(document,'vdown',hideRoot);
        $.appendEvent(root,'vdown',function(){
            $.getEvent().stopPropagation();
        });
        $.live(root,rootEvent,'vclick',live_key);
        //初始化
        (create = init)(me, x, y);
    };

    var formatText = ['','YYYY-MM-DD','YYYY-MM-DD','YYYY-MM-DD','YYYY-MM','YYYY'];

    // 日期选择
    var DatePicker = U.createClass(U.EventEmitter, {
        init: function(values, type){
            this._super('init');
            this.setType(type);
            var vs = [];
            if(values){
                U.forEach(values,function(v){
                    var date = new Date(v.replace(/\-/g, '/'));
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    if(!isNaN(date.getTime())){
                        vs.push(date);
                    }
                });
            }
            this.values = type == 3?vs:vs.slice(0,type == 2?2:1);
        },
        // 显示日期选择框
        show: function(x,y){
            create(this,x,y);
            return this;
        },
        setType: function (type) {
            if(type < 0 || type > 5){
                type = 1;
            }
            this.type = type || 1;
            this.emit('elect');
        },
        // 关闭
        close: function(){
            hideRoot();
        },
        setValue: function(){
            this.values = U.forEach(arguments,function(v){
                return U.createDate(v);
            },[]);
            this.emit('elect');
        },
        getValue: function(str){
            var type = this.type;
            var vs = this.values;
            if(!str && this.me){
                str = this.me.getAttribute('date-format') || formatText[this.type];
                if(!str){
                    if(this.type == 4){
                        str = 'YYYY-MM';
                    }
                    else if(this.type == 5){
                        str = 'YYYY';
                    }
                }
            }
            if(type == 1 || type == 4 || type == 5){
                return vs[0]?format(vs[0],str):'';
            }
            return U.forEach(vs,function(date){
                return format(date,str);
            },[]);
        }
    });

    var cache = DatePicker.cache = new U.Cache();
    function onelect(){
        var vs = this.getValue(),v;
        if(this.type == 2){
            // 时间段
            v = vs.join(' ~ ');
        }
        else if(this.type == 3){
            // 多选
            v = vs.join(';');
        }
        else{
            v = vs;
        }
        if(this.me && this.me.tagName.toLowerCase() == 'input'){
            this.me.value = v;
        }
        else{
            $.text(this.me, v);
        }
    }

    $.datePicker = DatePicker.bind = function(id, type, back){
        if(typeof type == 'function'){
            back = type;
            type = 1;
        }
        var me = $(id);
        var pick = new DatePicker((me.getAttribute('date-value') || me.value || '').split(/[~,]+/), type);
        pick.me = me;
        cache.set(id, pick);
        pick.onelect = back || onelect;
        function show(){
            var ps = $.offset(me);
            pick.show(ps.left, ps.top + ps.height);
        }
        function stop(){
            if(pick == rootData){
                $.getEvent().stopPropagation();
            }
        }
        $.appendEvent(me,'vclick',show);
        $.appendEvent(me,'focus',show);
        $.appendEvent(me,'vdown',stop);
        var forShow = me.getAttribute('for_show');
        if(forShow){
            $.get(forShow).appendEvent('vclick',show).appendEvent('vdown',stop);
        }
        pick.emit('elect');
        return pick;
    }

    $.setExpand('datePicker');

    return DatePicker;
});
