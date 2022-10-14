define(["util?[hash]", "dom?[hash]", "anim?[hash]"], function (U, $, A) {
    //U.loadCSS(module.dir + 'css/focus.css');
    var bar = "focus";
    var anim_key = U.isTouch ? "translateX$" : "left$";
    var cssFn = U.isTouch ?
        function (dom, v) {
            //console.log('cssFn',v);
            $.translate(dom, v);
        } :
        function (dom, v) {
            $.css(dom, "left", v + "px");
        };

    var html =
        '<div class="c-rel"><div ' +
        bar +
        '="cImg" class="view-imgs" style="transform: translateX(0) translateY(0);">{#imgs}</div><div ' +
        bar +
        '="cDot" class="view-dots">{#dots}</div></div>';

    function setAuto() {
        var i = this;
        if (i.autoTime) {
            clearTimeout(i.timeout);
            i.timeout = setTimeout(function () {
                if (!i.dragData) {
                    i.next();
                }
            }, i.autoTime);
        }
    }

    function setTheTwo(diff) {
        var imgs = this.$imgs;
        var index = this.targetNum;
        var len = imgs.length;
        var img = imgs[index];

        var isNext = diff;
        var flag = true;
        if (typeof diff == "number") {
            if (Math.abs(diff) < img.offsetWidth - img.firstChild.offsetWidth) {
                imgs[(index - 1 + len) % len].className = "item prev";
                imgs[(index + 1) % len].className = "item next";
                flag = false;
            }
            isNext = diff < 0;
        }

        if (!flag) {
            return;
        }
        if (isNext) {
            imgs[(index + 2) % len].className = "item next2";
        } else {
            imgs[(index - 2 + len) % len].className = "item prev2";
        }
    }

    function play(flag) {
        setAuto.call(this);
        if (this.animFlag || this.dragData) {
            return;
        }
        var i = this;
        i.animFlag = true;
        var opt = {};
        opt.callback = function () {
            i.animFlag = null;
            i.setActive(i.targetNum + (!flag ? -1 : 1));
        };
        var w = i.$cImg.offsetWidth;
        if (flag) {
            w *= -1;
        }
        opt[anim_key] = w;
        setTheTwo.call(i, flag);
        //console.log(i.$cImg, opt);
        A.play(i.$cImg, opt);
    }

    //鼠标移动开始
    function dragDown() {
        var i = this;
        var ev = $.getEvent();
        if (!U.isTouch) {
            ev.preventDefault();
            i.scrollFlag = -1;
        }
        if (i.animFlag) {
            return;
        }
        if (i.dragData) {
            i.setActive(i.targetNum);
        }
        i.scrollFlag = 0;
        i.dragData = {
            cur: ev.clientX,
            move: U.bind(dragMove, i),
            up: U.bind(dragUp, i)
        };
        $.appendEvent(document, "vmove", i.dragData.move, true);
        $.appendEvent(document, "vup", i.dragData.up, true);
    }

    //鼠标移动中
    function dragMove() {
        var i = this;
        if (i.animFlag) {
            return;
        }
        if (i.scrollFlag == 1) {
            return;
        }
        if (i.dragData) {
            var ev = $.getEvent();
            var len = ev.clientX - i.dragData.cur;
            if (len == 0) {
                return;
            }
            if (i.scrollFlag == 0) {
                i.scrollFlag = Math.abs(len) > 0 ? -1 : 1;
            }
            if (i.scrollFlag == -1) {
                if (!U.isTouch) {
                    ev.preventDefault();
                }
                window.getSelection ?
                    window.getSelection().removeAllRanges() :
                    document.selection.empty();
                var w = i.$cImg.offsetWidth;
                var diff = Math.min(w, Math.max(w * -1, len));
                cssFn(i.$cImg, diff);
                setTheTwo.call(i, diff);
                //$.translate(i.$cImg,Math.round(len / i.$cImg.offsetWidth * 10000) / 100 + '%');
            }
        }
    }

    //鼠标抬起
    function dragUp() {
        var i = this;
        if (i.animFlag) {
            return;
        }
        if (i.dragData) {
            var ev = $.getEvent();
            $.removeEvent(document, "vup", i.dragData.up, true);
            $.removeEvent(document, "vmove", i.dragData.move, true);
            if (i.scrollFlag == -1) {
                var len = i.dragData.cur - ev.clientX;
                i.dragData = null;
                if (len == 0) {
                    setAuto.call(i);
                    return;
                }
                var xlen = Math.abs(len);
                if (xlen < 20) {
                    setAuto.call(i);
                    var opt = {};
                    opt[anim_key] = 0;
                    A.play(i.$cImg, opt);
                } else {
                    play.call(i, len > 0);
                }
            }
        }
    }

    var Focus = U.createClass(U.EventEmitter, function (prot) {
        prot.init = function () {
            this._super("init");
            this.targetNum = 0;
        };
        prot.render = function (cot, imgUrls) {
            this.imgs = imgUrls;
            var wCot = (this.wCot = $(cot));
            // 插入html节点
            var imgs = [];
            var dots = [];
            U.forEach(imgUrls, function (src) {
                imgs.push(
                    '<div class="item" ' +
                    bar +
                    '="img"><img src="' +
                    src.replace(/\"/g, "&#34;").replace(/\'/g, "&#39;") +
                    '" /></div>'
                );
                dots.push("<span " + bar + '="dot"></span>');
            });
            if (imgs.length == 2) {
                imgs.push(imgs[0]);
                imgs.push(imgs[1]);
            }

            $.html(
                wCot,
                html
                .replace(/\{#imgs\}/g, imgs.join(""))
                .replace(/\{#dots\}/g, dots.join(""))
            );
            this.$cImg = $.get("div[" + bar + "=cImg]", wCot)[0];
            // this.$cDot = $.get('div[' + bar + '=cDot]',wCot)[0];
            this.$imgs = $.get("div[" + bar + "=img]", wCot);
            this.$dots = $.get("span[" + bar + "=dot]", wCot);

            this.setActive(0);
            $.appendEvent(this.$cImg, "vdown", U.bind(dragDown, this), true);
            setAuto.call(this);
            return this;
        };
        prot.setActive = function (num) {
            cssFn(this.$cImg, 0);
            var index = this.targetNum || 0;
            var dots = this.$dots;
            var len = dots.length;
            // var isNext = num > index;
            var target = num % len;
            if (target < 0) {
                target += len;
            }
            dots[index].className = "";
            var imgs = this.$imgs;
            var lenx = imgs.length;
            imgs[index].className = "";
            imgs[(index + lenx - 1) % lenx].className = "item";
            imgs[(index + 1) % lenx].className = "item";

            imgs[(index + 2) % lenx].className = "item";
            imgs[(index + lenx - 2) % lenx].className = "item";

            this.targetNum = target;
            dots[target].className = "active";
            imgs[target].className = "item active";
            imgs[(target - 1 + lenx) % lenx].className = "item prev";
            imgs[(target + 1) % lenx].className = "item next";

            this.emit("view", imgs[target]);
        };
        // 设置自动播放
        prot.setAuto = function (time) {
            this.autoTime = time || 5000;
            setAuto.call(this);
            return this;
        };
        prot.next = function () {
            play.call(this, true);
        };
        prot.prev = function () {
            play.call(this, false);
        };
    });

    return Focus;
});