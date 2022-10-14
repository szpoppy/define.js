# define.js

标准化的 AMD 模块化加载的实现

## 模块化加载的使用

### html 引入

`<script src="define.js" data-main="pages/index"></script>`

-   src 引入的地址
-   data-main 页面的执行 js 文件(可选)

### 使用示例

```js
"use strict";

// 关联引用
// @locus/dom @表示define.js所在的目录 $为引用变量
// api.js 为 /page/api.js 的引用
define(["@locus/dom", "/page/api.js"], function ($, api) {
    // 这里为一些代码逻辑处理
    var topbarDoms = $.get("#topbar-[home,weixin]").$;
    var topbarAct = null;

    function setTopbarActive(index) {
        var key = index.split(/\/+/)[0];
        if (topbarAct) {
            $.removeClass(topbarAct, "active");
        }
        if (topbarDoms[key]) {
            $.addClass((topbarAct = topbarDoms[key]), "active");
        }
    }

    api.router
        .append(
            {
                home: "home/home?53f678a",

                weixin: "weixin/weixin?b7bb9a5",
            },
            "/home/pages/"
        )
        .on("start", function (para) {
            setTopbarActive(para.path);
        })
        .setHome("/weixin")
        .init("router");
});
```

### 为插件设置拦截事件

```js
// 为ajax设置全局的一个取消函数
var inAjax = {};
define.on("#ajax", function (ajax) {
    // 这里是当 插件ajax载入时，会给Ajax的加上全局的拦截器
    var Fn = ajax.prototype;

    // 页面发送是的拦截器
    Fn.on("send", function () {
        if (!this._sole) {
            this._sole = util.getSole();
        }
        inAjax[this._sole] = this;
    });

    // 数据验证时的拦截器
    Fn.on("verify", function (res, req) {
        delete inAjax[this._sole];

        var item = res.result || {};
        res.pKey = item.key || "";

        if (item.err) {
            res.err = item.msg || "未知错误";
        }
    });
});

// 取消全部在操作的ajax
// 主要用于单页路由跳转后，一些还没返回数据的ajax
function cancelAjax() {
    for (let key in inAjax) {
        inAjax[key].abort();
        delete inAjax[key];
    }
}
```

## 已有功能插件说明

## 功能

| 名称                                   | 说明                                 |
| -------------------------------------- | ------------------------------------ |
| [Ajax](docs/ajax.md)                   | 封装了一套 ajax 处理，支持 jsonp     |
| [util](docs/util.md)                   | 一些常用的方法处理                   |
| [anim](docs/anim.md)                   | 一套动画库                           |
| [combo-box](docs/combo-box.md)         | 关键字查询 UI                        |
| [date-interval](docs/date-interval.md) | 日期段选择控件                       |
| [date-picker](docs/date-picker.md)     | 日期选择                             |
| [debug](docs/debug.md)                 | 方便移动端调试的 js                  |
| [dom](docs/dom.md)                     | dom 操作封装                         |
| [editer](docs/editer.md)               | 一套简易的富文本编辑器，支持插件接入 |
| [focus](docs/focus.md)                 | 焦点轮播图控件                       |
| [kite](docs/kite.md)                   | 弹窗位置拖动控件                     |
| [modals](docs/modals.md)               | 弹窗控件                             |
| [multi-box](docs/multi-box.md)         | 复选框控件                           |
| [page](docs/page.md)                   | 分页控件                             |
| [router](docs/router.md)               | 简易 hash 路由实现单页应用           |
| [sheet](docs/sheet.md)                 | 数据表格支持                         |
| [slip](docs/slip.md)                   | 通用滑动支持                         |
| [template](docs/template.md)           | 一套模板组件                         |
| [base64](docs/base64.md)               | (第三方)base64                       |
| [md5](docs/md5.md)                     | (第三方)md5                          |
| [pinyin](docs/pinyin.md)               | (第三方)将汉字转拼音                 |
| [sizzle](docs/sizzle.md)               | (第三方)jquery 的一个筛选器          |
