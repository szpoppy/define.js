/**
 作者:轨迹
 日期:2015-9-25
 功能:数据表格 两个数组，一个定义head 另一个定义 数据值
 */
define('sheet', ['util?[hash]'], function(U){

    function getData(target){
        var li = this.data[target];
        var rv = {};
        U.forEach(this.head, function(i,v){
            rv[v] = li[i];
        });
        return rv;
    }

    var sheet = U.createClass(function(prot){
        // 初始化
        prot.init = function(data, header){
            //数据体
            this.data = data;
            this.header = {};
            if(headheader){
                //头部
                for(var i = 0; i < header.length; i += 1){
                    this.header[header[i]] = i;
                }
            }
        }

        //获取当前指针下的数据
        prot.get = function(num, key){
            if(key == null){
                return getData.call(this, num);
            }
            return this.header[key] === undefined ? "" : this.data[num][this.header[key]];
        }
        // 排序
        prot.sort = function(key,flag){
            if(!this.data || !this.data.sort){
                return this;
            }
            if(typeof key == 'function'){
                this.data.sort(key);
                return this;
            }
            var i = this.header[key];
            var f1 = flag ? 1 : -1;
            var f2 = f1 == 1 ? -1 : 1;
            this.data.sort(function($1,$2){
                return $1[i] > $2[i]?f1:f2;
            });
            return this;
        }
        // 循环
        prot.forEach = function(fn, exe){
            return U.forEach(this.data, function(v, i){
                return fn.call(this, i);
            }, exe, this);
        }
    });

    return sheet;
});
