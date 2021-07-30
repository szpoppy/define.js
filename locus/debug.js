//用户调试的代码
define('debug', ['util?[hash]'], function(U) {
    var traceDom, tarceI, tc = ["#F00", "#0F0", "#00F", "#FF0", "#F0F", "#0FF"],
        cc = ["#FFF", "#000", "#FFF", "#000", "#FFF", "#000"];

	var debug = function(){
		function single(){
			var strs = [];
			for (var i = 0; i < arguments.length; i += 1) {
				strs.push(typeof arguments[i] != "string" ? U.stringifyJSON(arguments[i]) : arguments[i]);
			}
			var div = document.createElement("div");
			div.style.cssText = 'padding: 5px; color:' + cc[tarceI] + '; word-wrap: break-word; background-color:' + tc[tarceI++];
			div.innerHTML = strs.join(' ， ');
			traceDom.appendChild(div);
			tarceI = tarceI % tc.length;
		}
		
		tarceI = 0;
		traceDom = document.createElement("div");
		traceDom.style.cssText = "position:absolute; top:0; left:0; right:0; z-index:999999999;";
		traceDom.onclick = function(ev) {
			this.innerHTML = "";
			ev.stopPropagation();
		}
		if (document.body) {
			if (document.body.firstChild) {
				document.body.insertBefore(traceDom, document.body.firstChild);
			} else {
				document.body.appendChild(traceDom);
			}
		} else {
			document.documentElement.appendChild(traceDom);
		}
		
		debug = single
		return single.apply(window, arguments)
	}

    window.onerror = function($1, $2, $3) {
        debug(String($1) + ':::' + String($2) + ':::' + String($3));
    }

    return function(){
		return debug.apply(window, arguments)
	}
});