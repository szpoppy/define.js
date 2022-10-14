define(['util?[hash]', 'dom?[hash]'], function(U, $){
    var An = {};

    //动画帧率 默认50
    An.FPS  = 50;
    //动画默认算法
    An.rule = 'cos';

    var css = $.css;

    //动画开始的时候 计算各方面的初始值
    var initial = An.initial = {
        //一般CSS属性
        natural: function(d, n, m, arr, mx, un, sp, ed, ng){
            var val = css(d, n);
            var unx = val.replace(/[\d\-.]|auto/g, '');
            arr[n]  = unx == '' && (n == 'width' || n == 'height') ? $[n](d) : (parseInt(val) || 0);
            var end = ed ? m : arr[n] + m;
            mx[n]   = (ng || end >= 0 ? end : 0) - arr[n];
            un[n]   = unx || 'px';
            return mx[n] && (sp > 10 ? sp : Math.abs(mx[n]) * sp);
        },
        //透明度
        opacity: function(d, m, arr, mx, un, sp, ed){
            var n   = 'opacity', val = css(d, n);
            arr[n]  = parseFloat(val) || 0;
            var end = Math.max(0,Math.min(1,ed ? m : arr[n] + m));
            //mx[n] = end <= 0 ? 0 - arr[n] : end > 1 ? 1 - arr[n] : m;
            mx[n]   = end - arr[n];
            //alert(mx[n]);
            un[n]   = '';
            return mx[n] && (sp > 200 ? sp : Math.abs(mx[n]) * sp * 400);
        }
    };
    //执行过程
    var execution = An.execution = {
        //CSS值设置 默认值无负数
        natural:function(d, n, r, s, t, u){
            var v = Math.max(r * t + s, 0) + u;
            css(d, n, v);
            return v;
        },
        //透明度设置 无单位
        opacity:function(d, r, s, t){
            var v = r * t + s;
            css(d, 'opacity', v);
            return v;
        }
    };
    //复制 负值的属性
    U.forEach(['marginLeft', 'marginRight', 'marginTop', 'marginBottom', 'top', 'left', 'bottom', 'right'], function(n){
        initial[n] = function(d, m, arr, mx, un, sp, ed){
            return initial.natural(d, n, m, arr, mx, un, sp, ed, true);
        };
        execution[n] = function(d, r, s, t, u){
            var v = r * t + s + u;
            css(d, n, r * t + s + u);
            return v;
        };
    });
    //动画规则 所有设置的 请返回 总长的百分比
    var rules = An.rules = {
        cos:function(t, d){
            return (-Math.cos(t / d * Math.PI) / 2) + 0.5;
        },
        linear:function(t, d){
            return t / d;
        },
        regularEaseIn : function(t,d) {
            return (t /= d) * t;
        },
        regularEaseOut : function(t,d) {
            return -1 * (t /= d) * (t - 2);
        },
        regularEaseInOut : function(t,d) {
            if ((t /= d / 2) < 1) {
                return 0.5 * t * t;
            }
            return -0.5 * ((--t) * (t - 2) - 1);
        },
        cubicEaseIn: function(t,d){
            return (t/=d)*t*t;
        },
        cubicEaseOut: function(t,d){
            return ((t=t/d-1)*t*t + 1);
        },
        cubicEaseInOut: function(t,d){
            if ((t/=d/2) < 1) return 0.5*t*t*t;
            return 0.5*((t-=2)*t*t + 2);
        },
        quartEaseIn: function(t,d){
            return (t/=d)*t*t*t;
        },
        quartEaseOut: function(t,d){
            return -((t=t/d-1)*t*t*t - 1);
        },
        quartEaseInOut: function(t,d){
            if ((t/=d/2) < 1) return 0.5*t*t*t*t;
            return -0.5 * ((t-=2)*t*t*t - 2);
        },
        strongEaseIn : function(t,d) {
            return (t /= d) * t * t * t * t;
        },
        strongEaseOut : function(t,d) {
            return ((t = t / d - 1) * t * t * t * t + 1);
        },
        strongEaseInOut : function(t,d) {
            if ((t /= d / 2) < 1) {
                return 0.5 * t * t * t * t * t;
            }
            return 0.5 * ((t -= 2) * t * t * t * t + 2);
        },
        sineEaseIn: function(t,d){
            return -1 * Math.cos(t/d * (Math.PI/2)) + 1;
        },
        sineEaseOut: function(t,d){
            return Math.sin(t/d * (Math.PI/2));
        },
        sineEaseInOut: function(t,d){
            return -0.5 * (Math.cos(Math.PI*t/d) - 1);
        },
        expoEaseIn: function(t,d){
            return (t==0) ? 0 : Math.pow(2, 10 * (t/d - 1));
        },
        expoEaseOut: function(t,d){
            return (t==d) ? 1 : (-Math.pow(2, -10 * t/d) + 1);
        },
        expoEaseInOut: function(t,d){
            if (t==0) return 0;
            if (t==d) return 1;
            if ((t/=d/2) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
            return 0.5 * (-Math.pow(2, -10 * --t) + 2);
        },
        circEaseIn: function(t,d){
            return -1 * (Math.sqrt(1 - (t/=d)*t) - 1);
        },
        circEaseOut: function(t,d){
            return 1 * Math.sqrt(1 - (t=t/d-1)*t);
        },
        circEaseInOut: function(t,d){
            if ((t/=d/2) < 1) return -0.5 * (Math.sqrt(1 - t*t) - 1);
            return 0.5 * (Math.sqrt(1 - (t-=2)*t) + 1);
        },
        backEaseIn : function(t,d) {
            return (t /= d) * t * (2.70158 * t - 1.70158);
        },
        backEaseOut : function(t,d) {
            var s = 1.70158;
            return ((t = t / d - 1) * t * (2.70158 * t + 1.70158) + 1);
        },
        backEaseInOut : function(t,d) {
            var s = 1.70158;
            if ((t /= d / 2) < 1) {
                return 0.5 * (t * t * (((s *= (1.525)) + 1) * t - s));
            }
            return 0.5 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
        },
        bounceEaseOut : function(t,d) {
            if ((t /= d) < (1 / 2.75)) {
                return (7.5625 * t * t);
            }
            else if (t < (2 / 2.75)) {
                return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
            }
            else if (t < (2.5 / 2.75)) {
                return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
            } else {
                return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
            }
        },
        bounceEaseIn : function(t,d) {
            return 1 - this.bounceEaseOut(d - t, d);
        },
        bounceEaseInOut : function(t,d) {
            if (t < d / 2) {
                return this.bounceEaseIn(t * 2, d) * 0.5;
            }
            else{
                return this.bounceEaseOut(t * 2 - d, d) * 0.5 + 0.5;
            }
        },
        elasticEaseIn : function(t,d) {
            if (t == 0){
                return 0;
            }
            if ((t /= d) == 1){
                return 1;
            }
            var p = d * 0.3,s = p / 4;
            return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p));
        },
        elasticEaseOut : function(t,d) {
            if (t == 0){
                return 0;
            }
            if ((t /= d) == 1){
                return 1;
            }
            var p = d * 0.3,s = p / 4;
            return (Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + 1);
        },
        elasticEaseInOut : function(t,d) {
            if (t == 0) {
                return 0;
            }
            if ((t /= d / 2) == 2) {
                return 1;
            }
            var p = d * (0.3 * 1.5),s = p / 4;
            if (t < 1) {
                return -0.5 * (Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p));
            }
            return Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + 1;
        }
    };

    //获得Color值 数组 支持 #FFF #FFFFFF rgb(1,2,3)
    function getAnimColor(str){
        var color = str.match(/^#?(-?)(\w{1})(-?)(\w{1})(-?)(\w{1})$/);
        if(color && color.length == 7){
            return [parseInt(color[1] + color[2] + color[2], 16), parseInt(color[3] + color[4] + color[4], 16), parseInt(color[5] + color[6] + color[6], 16)];
        }
        color = str.match(/^#?(-?\w{2})(-?\w{2})(-?\w{2})$/);
        if(color && color.length == 4){
            return [parseInt(color[1], 16), parseInt(color[2], 16), parseInt(color[3], 16)];
        }
        color = str.match(/^rgb\((-?\d{1,3}),\s*(-?\d{1,3}),\s*(-?\d{1,3})\)$/);
        if(color && color.length == 4){
            return [parseInt(color[1], 10), parseInt(color[2], 10), parseInt(color[3], 10)];
        }
        return [255, 255, 255];
    }

    //颜色数值属性设置
    U.forEach(['backgroundColor', 'color', 'borderColor', 'borderLeftColor', 'borderRightColor', 'borderTopColor', 'borderBottomColor'], function(n){
        execution[n] = function(d, r, s, t){
            for(var i = 0, h = [], v; i < 3; i += 1){
                v     = r * t[i] + s[i];
                h[i]  = (v >= 0 ? v <= 255 ? Math.round(Math.abs(v)) : 255 : 0);
            }
            v = 'rgb(' + h.join(',') + ')';
            css(d, n, v);
            return v;
        };
        initial[n] = function(d, m, arr, mx, un, sp, ed){
            arr[n]  = getAnimColor(css(d, n));
            m       = getAnimColor(m);
            mx[n]   = [];
            for(var i = 0, end; i < 3; i += 1){
                end = ed ? m[i] : arr[n][i] + m[i];
                mx[n][i] = (end >= 0 ? end <= 255 ? end : 255 : 0) - arr[n][i];
            }
            if(mx[n].join(',') == '0,0,0'){
                return 0;
            }
            return sp;
        }
    });

    function translateXY(d, m, arr, mx, un, sp, ed, key){
        var n   = 'translate' + key;
        arr[n]  = $.translate(d)[key == 'X'?0:1];
        var end = ed ? m : arr[n] + m;
        mx[n]   = end - arr[n];
        un[n]   = '';
        return mx[n] && (sp > 10 ? sp : Math.abs(mx[n]) * sp);
    }

    initial.translateX = function(d, m, arr, mx, un, sp, ed){
        return translateXY(d, m, arr, mx, un, sp, ed, 'X');
    }
    initial.translateY = function(d, m, arr, mx, un, sp, ed){
        return translateXY(d, m, arr, mx, un, sp, ed, 'Y');
    }

    execution.translateX = function(d, r, s, t, u){
        var v = r * t + s + u;
        $.translate(d, r * t + s + u);
        return v;
    }
    execution.translateY = function(d, r, s, t, u){
        var v = r * t + s + u;
        $.translate(d, null, r * t + s + u);
        return v;
    }

    //动画集体、定时器句柄
    var shake = new U.Cache(), animHandle;

    //添加震荡
    function appendShake(d, fn){
        shake.set(d, fn);
        if(animHandle == null){
            animHandle = setInterval(shakeing, 1000 / An.FPS);
        }
    }

    //删除震荡
    function removeShake(d, flg){
        if(shake.has(d)){
            flg && shake.get(d)(flg);
            shake.del(d);
        }
        if(shake.size() < 1){
            clearInterval(animHandle);
            animHandle = null;
        }
        return this;
    }

    //震荡
    function shakeing(){
        shake.forEach(function(fn){
            fn();
        })
    }

    //开始动画
    function playAnim(d,option){
        d = $(d);
        //如果这个节点已经在执行 移除
        removeShake(d, 1);;
        var an  = U.assign({}, option),
            arr = {},
            mx  = {},
            un  = {},
            mt  = 0,
            sp  = an.speed || 1.2, //速度
            jb  = an.callback || null, //回调
            run = an['run'], //执行的时候回调
            ru  = An.rules[an.rule] ? an.rule : An.rule, //动画方式
            hm  = an.homing !== false, //程序强制结束 是否要归位 默认需要
            rs  = {};							//为每个增加动画效果
        delete an.speed;
        delete an.callback;
        delete an.rule;
        delete an.homing;
        delete an['run'];
        U.forEach(an, function(v, n){
            n = n.replace(/\-([a-z])/g,function(){
                return arguments[1].toUpperCase();
            }).split(/_/);
            var ed = /\$$/.test(n[0]), r = n[1] || '';
            n = n[0].replace(/\$$/, '');
            rs[n] = An.rules[r] ? r : ru;
            mt = Math.max(initial[n] ? initial[n](d, v, arr, mx, un, sp, ed) : initial.natural(d, n, v, arr, mx, un, sp, ed), mt);
        });
        //alert(mt);
        if(mt == 0){
            jb && jb.call(d, an);
            return this;
        }
        sp < 10 && (sp = Math.max(mt, 400));
        var et = new Date().getTime() + sp;
        //每次滚动的 变换
        function step(fg){
            fg = fg || 0;
            var p = sp - et + new Date().getTime(),
                flg = fg != 0 || p >= sp, ro = {};
            if(flg){
                if(fg < 1 || (fg != 0 && hm)){//程序强制结束 是否要归位 默认需要
                    U.forEach(arr,function(v,n){
                        ro[n] = execution[n] ? execution[n](d, 1, v, mx[n], un[n]) : execution.natural(d, n, 1, v, mx[n], un[n]);
                    });
                }
                //正常结束 移除
                fg == 0 && removeShake(d);
                fg < 1 && jb && jb.call(d, ro);
                return ;
            }
            //debugger;
            U.forEach(arr,function(v,n){
                var r = rules[rs[n]](p, sp);
                if(execution[n]){
                    ro[n] = execution[n](d, r, v, mx[n], un[n]);
                }
                else{
                    ro[n] = execution.natural(d, n, r, v, mx[n], un[n]);
                }
            });
            run && run.call(d, ro);
        }

        appendShake(d, step);
        return this;
    }

    An.play = playAnim;
    An.stop = function(d){
        if(d){
            removeShake($(d), -1);
            return An;
        }
        shake.forEach(function(fn, key){
            fn(-1);
            shake.del(key);
        })
        return An;
    };

    // 按照固定顺序 做动画
    var Sequence = An.Sequence = U.createClass(function(prot){
        prot.init = function(dom){
            this.dom = dom;
            this.sequence = [];
        }
        prot.append = function(option, dom){
            this.sequence.push([dom || this.dom,option]);
            return this;
        }
        prot.next = function(){
            var i = this;
            if(!i.isPaly){
                return ;
            }
            if(i.curr){
                An.stop(i.curr[0]);
                return i;
            }
            if(i.sequence.length == 0){
                i.stop();
                return i;
            }
            var curr = i.curr = i.sequence.shift();

            var option = U.assign({}, typeof curr[1] === 'function'? curr[1](): curr[1]);
            var callback = option.callback;
            option.callback = function(){
                callback && callback();
                if(i.loop){
                    i.sequence.push(i.curr);
                }
                i.curr = null;
                i.next();
            };
            An.play(curr[0],option);
            return i;
        },
        prot.play = function(loop){
            this.loop = loop;
            this.isPaly = true;
            this.next();
            return this;
        }
        prot.stop = function(){
            if(!this.isPaly){
                return ;
            }
            this.isPaly = false;
            this.curr && An.stop(this.curr[0]);
        }
    });

    An.append = function(dom, option){
        return new Sequence(dom).append(option);
    };

    return An;
});
