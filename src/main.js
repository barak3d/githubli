//////////////////////////////////////////////////////////////////////////////////////////////
// Copyright(C) 2010 Abdullah Ali, voodooattack@hotmail.com                                 //
//////////////////////////////////////////////////////////////////////////////////////////////
// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php       //
//////////////////////////////////////////////////////////////////////////////////////////////

// Injects a script into the DOM, the new script gets executed in the original page's
// context instead of the active content-script context.
//
//    Parameters:
//            source: [string/function]
//            (2..n): Function arguments if a function was passed as the first parameter.
function injectScript(source) {
    // Utilities
    var isFunction = function (arg) {
        return (Object.prototype.toString.call(arg) == "[object Function]");
    };

    var jsEscape = function (str) {
        // Replaces quotes with numerical escape sequences to
        // avoid single-quote-double-quote-hell, also helps by escaping HTML special chars.
        if (!str || !str.length) return str;
        // use \W in the square brackets if you have trouble with any values.
        var r = /['"<>\/]/g, result = "", l = 0, c;
        do {
            c = r.exec(str);
            result += (c ? (str.substring(l, r.lastIndex - 1) + "\\x" +
                c[0].charCodeAt(0).toString(16)) : (str.substring(l)));
        } while (c && ((l = r.lastIndex) > 0))
        return (result.length ? result : str);
    };

    var bFunction = isFunction(source);
    var elem = document.createElement("script");    // create the new script element.
    var script, ret, id = "";

    if (bFunction) {
        // We're dealing with a function, prepare the arguments.
        var args = [];

        for (var i = 1; i < arguments.length; i++) {
            var raw = arguments[i];
            var arg;

            if (isFunction(raw))    // argument is a function.
                arg = "eval(\"" + jsEscape("(" + raw.toString() + ")") + "\")";
            else if (Object.prototype.toString.call(raw) == '[object Date]') // Date
                arg = "(new Date(" + raw.getTime().toString() + "))";
            else if (Object.prototype.toString.call(raw) == '[object RegExp]') // RegExp
                arg = "(new RegExp(" + raw.toString() + "))";
            else if (typeof raw === 'string' || typeof raw === 'object') // String or another object
                arg = "JSON.parse(\"" + jsEscape(JSON.stringify(raw)) + "\")";
            else
                arg = raw.toString(); // Anything else number/boolean

            args.push(arg);    // push the new argument on the list
        }

        // generate a random id string for the script block
        while (id.length < 16) id += String.fromCharCode(((!id.length || Math.random() > 0.5) ?
            0x61 + Math.floor(Math.random() * 0x19) : 0x30 + Math.floor(Math.random() * 0x9)));

        // build the final script string, wrapping the original in a boot-strapper/proxy:
        script = "(function(){var value={callResult: null, throwValue: false};try{value.callResult=((" +
            source.toString() + ")(" + args.join() + "));}catch(e){value.throwValue=true;value.callResult=e;};" +
            "document.getElementById('" + id + "').innerText=JSON.stringify(value);})();";

        elem.id = id;
    } else // plain string, just copy it over.
    {
        script = source;
    }

    elem.type = "text/javascript";
    elem.innerHTML = script;

    // insert the element into the DOM (it starts to execute instantly)
    document.head.appendChild(elem);

    if (bFunction) {
        // get the return value from our function:
        ret = JSON.parse(elem.innerText);

        // remove the now-useless clutter.
        elem.parentNode.removeChild(elem);

        // make sure the garbage collector picks it instantly. (and hope it does)
        delete (elem);

        // see if our returned value was thrown or not
        if (ret.throwValue)
            throw (ret.callResult);
        else
            return (ret.callResult);
    } else // plain text insertion, return the new script element.
        return (elem);
}

/**
 * Copyright(C) Barak Kinarti
 */
function main() {
    (function init() {
        let index = 0;
        const boxShadowValue = "rgb(78, 148, 181) 0px 0px 5px 5px";

        function selectListItem(list, index, ignoreFocus) {
            if (!ignoreFocus) {
                list[index].focus();
            }
            list[index].style.boxShadow = boxShadowValue;
            const loadMoreEl = document.querySelectorAll(".file")[index].querySelector(".js-diff-load .js-button-text");
            if (loadMoreEl) {
                loadMoreEl.click();
            }
        }

        function getFilesList() {
            return document.querySelectorAll('.js-reviewed-toggle');
        }

        let list;
        document.addEventListener("keydown", (event) => {
            if (event.target.tagName === "TEXTAREA" || !window.location.pathname.includes("files") ||
                event.metaKey || event.altKey || event.shiftKey || event.ctrlKey) {
                return true;
            }
            list = getFilesList();
            let lastSelectedIndex = index;
            if (event.code === "ArrowDown") {
                console.log("ArrowDown");
                list[index].style.boxShadow = "none";
                if (index !== list.length - 1) {
                    index++;
                    selectListItem(list, index);
                }
                lastSelectedIndex = index;
                console.log("File review index", index);
                event.preventDefault();
                event.stopPropagation();
            } else if (event.code === "ArrowUp") {
                console.log("ArrowUp");
                list[index].style.boxShadow = "none";
                if (index !== 0) {
                    index--;
                }
                selectListItem(list, index);
                console.log("File review index", index);
                event.preventDefault();
                event.stopPropagation();
            } else if (event.code === "Space") {
                window.setTimeout(() => {
                    list = getFilesList();
                    list[lastSelectedIndex].scrollIntoView(true);
                    window.scrollBy(0, -70);
                }, 300);
                list[index].focus();
                list[index].click();
                list[index].style.boxShadow = boxShadowValue;
                console.log("File review index", index);
            }
        });

        setInterval(() => {
            if (!window.location.pathname.includes("files")) {
                return true;
            }
            list = getFilesList();
            if (list && list[index]) {
                selectListItem(list, index, true);
            }
        }, 100);
    })();
}

injectScript(main);
