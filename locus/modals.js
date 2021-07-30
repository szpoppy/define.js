
define('modals', ['util?[hash]' ,'kite?[hash]'],function(U, Kite){

    // 销毁弹窗
    function destroy(){
        this.destroy();
    }

    // 默认
    var option = {
        title_text:'提示信息',
        con_text:'信息内容',
        close:'<div class="modals_close" kite="destroy"></div>'
    }

    // 更改默认配置
    function config(opt){
        return U.assign(option, opt);
    }

    // 获取当前 option
    function getOption(opt1, opt2){
        var opt = U.assign({}, option, opt2 || {});
        if(typeof opt1 == 'string'){
            opt.con_text = opt1
        }
        else{
            U.assign(opt, opt1);
        }
        return opt;
    }

    // 替换特殊表示的字符
    function replaceText(str, opt){
        return str.replace(/\{#(\w+)\}/g, function($0,$1){
             return opt[$1] || '';
        })
    }

    // ============ 自定义 弹窗  =====================
    var string_prompt = '<div class="locus-modals {#opt_class}"><div class="modals_cc">{#close}<div class="modals_t" kite="title">{#title_text}</div><div class="modals_c" kite="con">{#con_text}</div>{#buttons}</div></div>';
    // alert 弹窗
    var string_alert = string_prompt.replace(/\{#buttons\}/g,'<div class="modals_c_b1" kite="btns"><a href="javascript:void(0);" class="modals_btn" kite="btn_ok"><span>{#btn_ok_text}</span></a></div>');
    // confiorm 弹窗
    var string_confiorm = string_prompt.replace(/\{#buttons\}/g,'<div class="modals_c_b2" kite="btns"><a href="javascript:void(0);" class="modals_btn" kite="btn_cancel"><span>{#btn_cancel_text}</span></a><a href="javascript:void(0);" class="modals_btn" kite="btn_ok"><span>{#btn_ok_text}</span></a></div>');

    var Panel = Kite.Mask.extend(function(prot, sProt){
        prot.init = function(){
            sProt.init.apply(this, arguments);
        }
        // 通用弹窗
        prot.prompt = function(str,buttons){
            var opt = getOption(str, {buttons:buttons || ''});
            var x = this.create(replaceText(string_prompt,opt)).offset(.5,.5);
            if(!U.isTouch){
                x.drag('title');
            }
            return x;
        }
        // alert
        prot.alert = function(str, fn){
            var opt = getOption(str,{btn_ok_text: '确认'});
            var x = this.create(replaceText(string_alert,opt), 'btn_ok').offset(.5,.5).bind('btn_ok_vclick', fn || destroy);
            if(!U.isTouch){
                x.drag('title');
            }
            return x;
        },
        // confirm
        prot.confirm = function(str, fn, fn1){
            var opt = getOption(str, {btn_ok_text: '确认', btn_cancel_text: '取消'});
            var x = this.create(replaceText(string_confiorm, opt), 'btn_ok').offset(.5,.5).bind('btn_ok_vclick', fn || destroy).bind('btn_cancel_vclick', fn1 || destroy);
            if(!U.isTouch){
                x.drag('title');
            }
            return x;
        }
    },function(){

    });

    var  modals = new Panel('#000000', .5, 1000000);
    modals.config = config;
    modals.Kite = Kite;

    modals.Mask = Panel;
    return modals;
});
