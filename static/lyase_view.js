/**
 * Copyright (c) 2006, Yusuke Inuzuka<yuin@inforno.net>(http://inforno.net)
 *
 * License :
 *   Articstic License 2.0
 *
 * Lyase.View :
 *   This class is a part of javascript framework "Lyase"(under making...)
 *   This class requires prototype.js(http://prototype.conio.net/)
 *
 * Description : 
 *
 *   Lyase.View provides simple way to embed javascript codes 
 *   within any plain text.
 *
 * Usage and examples :
 *
 *   using text
 *   -------------
 *   var template = "The value of x is:<%= context.x%>";
 *   document.write(Lyase.View.render({text:template}, {x : 10}));
 *
 *   using innerHTML
 *   -------------
 *   //in HTML
 *   <textarea id="template" style="display:none">
 *     The value of x is:<%= context.x%>
 *   </textarea>
 *   //code
 *   document.write(Lyase.View.render({element:"template"}, {x : 10}));
 *
 *   using a template file
 *   -------------
 *   //in /template.jhtml
 *   The value of x is:<%= context.x%>
 *   //code
 *   document.write(Lyase.View.render({file:"/template.jhtml"}, {x : 10}));
 *
 *   Of course, you can embed more complex codes.
 *   //in HTML, with prototype.js
 *   <textarea id="template" style="display:none">
 *     <% context.list.each(function(pair){%>
 *          The value of <%= pair.name %> is: <%= pair.value%>
 *     <% }) %>
 *   </textarea>
 *   //code
 *   document.write(Lyase.View.render({element:"template"}, 
 *     {list :[{name : "x", value : 10}, {name : "y", value : 20}]}));
 *
 *
 * Recognized Tags :
 *
 *   <% javascript code %>
 *   <%= javascript expression %>
 *   <%\* comment *\%>(\ is meaning of /)
 */
var Lyase = {};
Lyase.View = {
    _cache : {},
    parse : function(template, id) {
        var self = Lyase.View,parsed = ["var __out=[],render = Lyase.View.render;"]
        var tokens = template.split("<%");
        for(var i = 0, l = tokens.length; i<l; i++) {
            var token = tokens[i];
            if(token.indexOf("%>") == -1){
                parsed.push(self._string(token));
                continue;
            }
            var parts = token.split("%>");
            parsed.push(self[(parts[0].charAt(0) == "=")?"_value":"_code"](parts[0]));
            parsed.push(self._string(parts[1]));
        }
        parsed.push("return __out.join('');");
        var templateFunc = new Function("context", parsed.join(""));
        if(id) self._cache[id] = templateFunc;
            return templateFunc;
    },

    render : function(options, values) {
        var self = Lyase.View, template, id;
        if(options.text) return self.parse(options.text, null)(values);
            if(options.element) var element = $(options.element);
                id = (options.file) ? options.file : element.id;
        if(self._cache[id]) return self._cache[id](values);
            if(options.element) {
                template = self._elementTemplate(element);
            }else {
                //template = (new Ajax.Request(options.file,{asynchronous : false})).transport.responseText;
                $.ajax({
                    async: false,
                    type: "GET",
                    url: options.file,
                    success: function(data) {
                        template = data;
                    }
                });
            }
            return self.parse(template, id)(values);
    },

    _elementTemplate : function(element) {
        var template = element.innerHTML;
        if(element.tagName.toLowerCase() != "textarea") {
            template = template.split("<!--[CDATA[").last().split("]]-->").first();
        }else if(template.indexOf("&lt;") != -1) {
            template = template.unescapeHTML();
        }
        return template.replace(/\n|\r/g, "");
    },

    _string : function(string) {
        return ["__out.push('",string.replace(/\n|\r/g,"").replace(/'/g, "\\'"),"');"].join("");
    },

    _value  : function(string) {
        return ["__out.push(",string.replace(/\n|\r/g,"").substring(1),");"].join("");
    },

    _code   : function(string) {
        string = string.replace(/\n|\r/g,"");
        if(string.charAt(string.length-1) != ";") string += ";";
            return string;
    }
}
