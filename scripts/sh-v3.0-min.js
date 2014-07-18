//
// Begin anonymous function. This is used to contain local scope variables without polutting global scope.
//
var SyntaxHighlighter = function() { 
	// Shortcut object which will be assigned to the SyntaxHighlighter variable.
	// This is a shorthand for local reference in order to avoid long namespace 
	// references to SyntaxHighlighter.whatever...
	var sh = {
		defaults : {
			/** Additional CSS class names to be added to highlighter elements. */
			'class-name' : '',
			
			/** First line number. */
			'first-line' : 1,
			
			/**
			 * Pads line numbers. Possible values are:
			 *
			 *   false - don't pad line numbers.
			 *   true  - automaticaly pad numbers with minimum required number of leading zeroes.
			 *   [int] - length up to which pad line numbers.
			 */
			'pad-line-numbers' : false,
			
			/** Lines to highlight. */
			'highlight' : null,
			
			/** Title to be displayed above the code block. */
			'title' : null,
			
			/** Enables or disables smart tabs. */
			'smart-tabs' : true,
			
			/** Gets or sets tab size. */
			'tab-size' : 4,
			
			/** Enables or disables gutter. */
			'gutter' : true,
			
			/** Enables or disables toolbar. */
			'toolbar' : true,
			
			/** Enables quick code copy and paste from double click. */
			'quick-code' : true,
			
			/** Forces code view to be collapsed. */
			'collapse' : false,
			
			/** Enables or disables automatic links. */
			'auto-links' : true,
			
			/** Gets or sets light mode. Equavalent to turning off gutter and toolbar. */
			'light' : false,
			
			'html-script' : false
		},
		
		config : {
			space : '&nbsp;',
			
			/** Enables use of <SCRIPT type="syntaxhighlighter" /> tags. */
			useScriptTags : true,
			
			/** Blogger mode flag. */
			bloggerMode : false,
			
			stripBrs : false,
			
			/** Name of the tag that SyntaxHighlighter will automatically look for. */
			tagName : 'pre',
			
			strings : {
				expandSource : 'expand source',
				help : '?',
				alert: 'SyntaxHighlighter\n\n',
				noBrush : 'Can\'t find brush for: ',
				brushNotHtmlScript : 'Brush wasn\'t configured for html-script option: ',
				
				// this is populated by the build script
				aboutDialog : '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><title>About SyntaxHighlighter</title></head><body style="font-family:Geneva,Arial,Helvetica,sans-serif;background-color:#fff;color:#000;font-size:1em;text-align:center;"><div style="text-align:center;margin-top:1.5em;"><div style="font-size:xx-large;">SyntaxHighlighter</div><div style="font-size:.75em;margin-bottom:3em;"><div>version 3.0.83 (July 02 2010)</div><div><a href="http://alexgorbatchev.com/SyntaxHighlighter" target="_blank" style="color:#005896">http://alexgorbatchev.com/SyntaxHighlighter</a></div><div>JavaScript code syntax highlighter.</div><div>Copyright 2004-2010 Alex Gorbatchev.</div></div>	<div><a href="http://ajblk.github.io/codeSyntaxHighlight-Generator/Online-Tool.html" target="_blank" >Online Syntax Highlight Generator</a><br> for faster and better styled code in your website<br> <a href="http://codeworkout.blogspot.in/2014/07/online-generator-tool-for-code-syntax_18.html" target="_blank"  style="color:#005896">Demo on its Usage</a></div></div></body></html>'
			}
		},

		/** Internal 'global' variables. */
		vars : {
			discoveredBrushes : null,
			highlighters : {}
		},

		toolbar: {
			
			/**
			 * Event handler for a toolbar anchor.
			 */
			handler: function(e,hId)
			{ 
				var target = e.target,
					className = target.className || ''
					;

				function getValue(name)
				{
					var r = new RegExp(name + '_(\\w+)'),
						match = r.exec(className)
						;

					return match ? match[1] : null;
				};
				
				// var 	highlighternode = findParentElement(target, '.syntaxhighlighter'),
				//		highlighterid = highlighternode.id,									
				var highlighterid = this.highlighter.params.highlighterMainDivId+'_'+hId,
					commandName = getValue('command')
					;
				
				// execute the toolbar command
				if (highlighterid && commandName)
					sh.toolbar.items[commandName].execute(highlighterid);

				// disable default A click behaviour
				e.preventDefault();
			},
			
			/** Collection of toolbar items. */
			items : {
				// Ordered lis of items in the toolbar. Can't expect `for (var n in items)` to be consistent.
				list: ['expandSource', 'help'],

				expandSource: {			
					execute: function(highlighterid)
					{ 
						var div = document.getElementById(highlighterid);
						
						removeClass(div, 'collapsed');
					}
				},

				/** Command to display the about dialog window. */
				help: {
					execute: function(highlighter)
					{ 
						var wnd = popup('', '_blank', 500, 250, 'scrollbars=0'),
							doc = wnd.document
							;
						
						doc.write(sh.config.strings.aboutDialog);
						doc.close();
						wnd.focus();
					}
				}
			}
		},
		
		/**
		 * Shorthand to highlight all elements on the page that are marked as 
		 * SyntaxHighlighter source code.
		 * 
		 * @param {Object} gArgs		Optional parameters which override element's 
		 * 									parameters. Only used if element is specified.
		 * 
		 * @param {Object} element	Optional element to highlight. If none is
		 * 							provided, all elements in the current document 
		 * 							are highlighted.
		 */ 
		initialize: function(globalargs)
		{
			var elements = findHighlighterDivs("highlighterMainDiv");
			
			if (elements.length === 0) 
				return;
		
		
			var gArgs = globalargs, // alias
				presourcecode 			=(typeof gArgs.presourcecode !=='undefined')? gArgs.presourcecode : "presourcecode",	
				highlighterMainDivId	=(typeof gArgs.highlighterMainDivId !=='undefined')? gArgs.highlighterMainDivId : "highlighterMainDiv",		
				containerId				=(typeof gArgs.containerId !=='undefined')? gArgs.containerId : "container",		
				toolbarContainerId		=(typeof gArgs.toolbarContainerId !=='undefined')? gArgs.toolbarContainerId : "toolbarContainer",		
				codeContainerId			=(typeof gArgs.codeContainerId !=='undefined')? gArgs.codeContainerId : "codeContainer",	
				custSettingsVar			=(typeof gArgs.custSettingsVar !=='undefined')? gArgs.custSettingsVar : "settings",
				tempParams = {
								"presourcecode":presourcecode,
								"highlighterMainDivId":highlighterMainDivId,
								"containerId":containerId,
								"toolbarContainerId":toolbarContainerId,
								"codeContainerId":codeContainerId
				},
				mrgdGArgs = merge(gArgs, tempParams);
		
			for (var i = 0; i < elements.length; i++) 
			{	

				var hDiv = elements[i],
					hId = extractHighlighterId(hDiv.id,highlighterMainDivId),	
					preElement = document.getElementById(presourcecode+'_'+hId),
					settings = ""
					;
				
				for(j=0;j<preElement.attributes.length;j++)
				{
					if(preElement.attributes[j].nodeName==custSettingsVar)
					{
						settings = preElement.attributes[j].value;
						break;
					}
				}	
				
				var	params = merge(merge(mrgdGArgs, parseParams(settings)),{"hId":hId}),
					code;			
				
				//code = preElement[innerHTML];
				code = preElement.innerHTML;
				code = trimFirstAndLastLines(code)
											.replace(/\r/g, ' '); // IE lets these buggers through
				
				highlighter = new SyntaxHighlighter.Highlighter();	
				highlighter.id=hId;
				
				highlighter.originalCode = code;
				
				highlighter.init(params);
				// highlighter.Maindiv = document.getElementById(highlighterMainDivId);
				highlighter.setEventHandlers();
			}	
		
		}			
	};

	sh['all']			= sh.all;
	sh['highlight']		= sh.highlight;

	/**
	 * Main Highlither class.
	 * @constructor
	 */
	sh.Highlighter = function()
	{ 
		// not putting any code in here because of the prototype inheritance
	};
	sh.Highlighter.prototype = {

		/**
		 * Returns value of the parameter passed to the highlighter.
		 * @param {String} name				Name of the parameter.
		 * @param {Object} defaultValue		Default value.
		 * @return {Object}					Returns found value or default value otherwise.
		 */
		getParam: function(name, defaultValue)
		{
			var result = this.params[name];
			return toBoolean(result == null ? defaultValue : result);
		},
		
		init: function(params)
		{ 
			
			// register this instance in the highlighters list
			storeHighlighter(this);		
	
			// local params take precedence over defaults
			this.params = merge(sh.defaults, params || {})
			
			// process light mode
			if (this.getParam('light') == true)
				this.params.toolbar = this.params.gutter = false;
		},
		setEventHandlers: function()	
		{	
			//var highlighterMainDivId="highlighter_907327"; //ajblk// 
			//var Maindiv = document.getElementById(highlighterMainDivId); //ajblk// 

			// create main HTML
			//ajblk// Maindiv.innerHTML = this.getHtml(code);
				
			// set up click handlers
			if (this.getParam('toolbar'))
			{
				// var node = findElement(this.Maindiv, '.toolbar');
				var node = document.getElementById(this.params.toolbarContainerId+'_'+this.params.hId);
				attachEvent(node, 'click', sh.toolbar.handler,undefined,this.params.hId);
			}
			
			if (this.getParam('quick-code'))
			{
				//var node = findElement(this.Maindiv, '.code');
				var node = document.getElementById(this.params.codeContainerId+'_'+this.params.hId);
				attachEvent(node, 'dblclick', this.quickCodeHandler,undefined,this.params.hId);			
			}
		},	

		/**
		 * Quick code mouse double click handler.
		 */
		quickCodeHandler:	function(e,hId)
		{			
			/*
			var target = e.target,
				highlighterDiv = findParentElement(target, '.syntaxhighlighter'),
				container = findParentElement(target, '.container'),
				textarea = document.createElement('textarea'),
				highlighter
				;			
			*/
			
			var target = e.target,
				highlighterId = this.highlighter.params.highlighterMainDivId+'_'+hId,
				highlighterDiv = document.getElementById(highlighterId),
				container = document.getElementById(this.highlighter.params.containerId+'_'+hId),
				textarea = document.createElement('textarea'),
				highlighter
				;

			if (!container || !highlighterDiv)
				return;

			//ajblk// highlighter = getHighlighterById(highlighterDiv.id);
			// highlighter = highlighterDiv.id;
			
			// add source class name
			addClass(highlighterDiv, 'source');

			// Have to go over each line and grab it's text, can't just do it on the
			// container because Firefox loses all \n where as Webkit doesn't.
			
			/* //disabled due to 3rd method //
			var lines = container.childNodes,
				code = []
				;				
			*/
			
			/*  // 1st original method
			for (var i = 0; i < lines.length; i++)
				code.push(lines[i].innerText || lines[i].textContent);		
			*/	
			
			/*	// 2nd method to remove excess lines
			for (var i = 0; i < lines.length; i++)
			{
				var textcontent = lines[i].textContent.replace(/^[\n]*\s*|[\n*\s*]*$/g, '');
				if(textcontent=='')
					continue;
				code.push(lines[i].innerText || textcontent);
			}
			*/
			
			// 3rd method with direct code extracted from pre code
		//	var code= this.SyntaxHighlighter.vars.highlighters[this.highlighter.params.highlighterMainDivId+'_'+hId].originalCode;
			var code= this.SyntaxHighlighter.vars.highlighters[highlighterId].originalCode;
					
			
			// using \r instead of \r or \r\n makes this work equally well on IE, FF and Webkit
			//disabled due to 3rd method // code = code.join('\r');
			
			// inject <textarea/> tag
			textarea.appendChild(document.createTextNode(code));
			container.appendChild(textarea);
			
			// preselect all text
			textarea.focus();
			textarea.select();
			
			// set up handler for lost focus
			attachEvent(	textarea, 
							'blur', 
							function(e,id)
							{
								textarea.parentNode.removeChild(textarea);
								removeClass(highlighterDiv, 'source');
							},
							undefined,
							hId
						);
		},
		
	};
	
	function extractHighlighterId(elementid,prefix)
	{
		var r = new RegExp(prefix + '_(\\d+)'),
		match = r.exec(elementid);
		return match ? match[1] : null;		
	}
	
	function findHighlighterDivs(prefix)
	{
		var elements = [];
		var hdivs = document.getElementsByTagName("div");
		for(var i = 0; i < hdivs.length; i++) 
		{
			if(hdivs[i].id.indexOf(prefix) == 0) 
			{
				elements.push(hdivs[i]);
			}
		}
		
		return elements;
	};

	/**
	 * Checks if target DOM elements has specified CSS class.
	 * @param {DOMElement} target Target DOM element to check.
	 * @param {String} className Name of the CSS class to check for.
	 * @return {Boolean} Returns true if class name is present, false otherwise.
	 */
	function hasClass(target, className)
	{
		return target.className.indexOf(className) != -1;
	};

	/**
	 * Adds CSS class name to the target DOM element.
	 * @param {DOMElement} target Target DOM element.
	 * @param {String} className New CSS class to add.
	 */
	function addClass(target, className)
	{
		if (!hasClass(target, className))
			target.className += ' ' + className;
	};

	/**
	 * Removes CSS class name from the target DOM element.
	 * @param {DOMElement} target Target DOM element.
	 * @param {String} className CSS class to remove.
	 */
	function removeClass(target, className)
	{
		target.className = target.className.replace(className, '');
	};

	/**
	 * Removes all white space at the begining and end of a string.
	 * 
	 * @param {String} str   String to trim.
	 * @return {String}      Returns string without leading and following white space characters.
	 */
	function trim(str)
	{
		return str.replace(/^\s+|\s+$/g, '');
	};

	/**
	 * This is a special trim which only removes first and last empty lines
	 * and doesn't affect valid leading space on the first line.
	 * 
	 * @param {String} str   Input string
	 * @return {String}      Returns string without empty first and last lines.
	 */
	function trimFirstAndLastLines(str)
	{
		return str.replace(/^[ ]*[\n]+|[\n]*[ ]*$/g, '');
	};

	/**
	 * Unindents a block of text by the lowest common indent amount.
	 * @param {String} str   Text to unindent.
	 * @return {String}      Returns unindented text block.
	 */
	function unindent(str)
	{
		var lines = splitLines(fixInputString(str)),
			indents = new Array(),
			regex = /^\s*/,
			min = 1000
			;
		
		// go through every line and check for common number of indents
		for (var i = 0; i < lines.length && min > 0; i++) 
		{
			var line = lines[i];
			
			if (trim(line).length == 0) 
				continue;
			
			var matches = regex.exec(line);
			
			// In the event that just one line doesn't have leading white space
			// we can't unindent anything, so bail completely.
			if (matches == null) 
				return str;
				
			min = Math.min(matches[0].length, min);
		}
		
		// trim minimum common number of white space from the begining of every line
		if (min > 0) 
			for (var i = 0; i < lines.length; i++) 
				lines[i] = lines[i].substr(min);
		
		return lines.join('\n');
	};

	/**
	 * Parses key/value pairs into hash object.
	 * 
	 * Understands the following formats:
	 * - name: word;
	 * - name: [word, word];
	 * - name: "string";
	 * - name: 'string';
	 * 
	 * For example:
	 *   name1: value; name2: [value, value]; name3: 'value'
	 *   
	 * @param {String} str    Input string.
	 * @return {Object}       Returns deserialized object.
	 */
	function parseParams(str)
	{
		var match, 
			result = {},
			arrayRegex = new XRegExp("^\\[(?<values>(.*?))\\]$"),
			regex = new XRegExp(
				"(?<name>[\\w-]+)" +
				"\\s*:\\s*" +
				"(?<value>" +
					"[\\w-%#]+|" +		// word
					"\\[.*?\\]|" +		// [] array
					'".*?"|' +			// "" string
					"'.*?'" +			// '' string
				")\\s*;?",
				"g"
			)
			;

		while ((match = regex.exec(str)) != null) 
		{
			var value = match.value
				.replace(/^['"]|['"]$/g, '') // strip quotes from end of strings
				;
			
			// try to parse array value
			if (value != null && arrayRegex.test(value))
			{
				var m = arrayRegex.exec(value);
				value = m.values.length > 0 ? m.values.split(/\s*,\s*/) : [];
			}
			
			result[match.name] = value;
		}
		
		return result;
	};

	/**
	 * Merges two objects. Values from obj2 override values in obj1.
	 * Function is NOT recursive and works only for one dimensional objects.
	 * @param {Object} obj1 First object.
	 * @param {Object} obj2 Second object.
	 * @return {Object} Returns combination of both objects.
	 */
	function merge(obj1, obj2)
	{

		var result = {}, name;

		for (name in obj1) 
			result[name] = obj1[name];
		
		for (name in obj2) 
			result[name] = obj2[name];
			
		return result;
	};

	/**
	 * Attempts to convert string to boolean.
	 * @param {String} value Input string.
	 * @return {Boolean} Returns true if input was "true", false if input was "false" and value otherwise.
	 */
	function toBoolean(value)
	{
		var result = { "true" : true, "false" : false }[value];
		return result == null ? value : result;
	};

	/**
	 * Opens up a centered popup window.
	 * @param {String} url		URL to open in the window.
	 * @param {String} name		Popup name.
	 * @param {int} width		Popup width.
	 * @param {int} height		Popup height.
	 * @param {String} options	window.open() options.
	 * @return {Window}			Returns window instance.
	 */
	function popup(url, name, width, height, options)
	{
		var x = (screen.width - width) / 2,
			y = (screen.height - height) / 2
			;
			
		options +=	', left=' + x + 
					', top=' + y +
					', width=' + width +
					', height=' + height
			;
		options = options.replace(/^,/, '');

		var win = window.open(url, name, options);
		win.focus();
		return win;
	};

	/**
	 * Adds event handler to the target object.
	 * @param {Object} obj		Target object.
	 * @param {String} type		Name of the event.
	 * @param {Function} func	Handling function.
	 */
	function attachEvent(obj, type, func, scope, arg)
	{
		function handler(e,hId)
		{
			e = e || window.event;
			
			
			if (!e.target)
			{
				e.target = e.srcElement;
				e.preventDefault = function()
				{ 
					this.returnValue = false;
				};
			}
				
			func.call(scope || window,e ,hId);
		};
		
		if (obj.attachEvent) 
		{
		 //	obj.attachEvent('on' + type, handler);
			obj.attachEvent('on' + type, function(event){handler(event,arg)});
		}
		else 
		{
		 // obj.addEventListener(type, handler, false);
			obj.addEventListener(type, function(event){handler(event,arg)}, false);
			
		}
	};

	/**
	 * Generates HTML ID for the highlighter.
	 * @param {String} highlighterId Highlighter ID.
	 * @return {String} Returns HTML ID.
	 */
	function getHighlighterId(id)
	{
		
		var prefix = 'highlighterMainDiv_';
		return id.indexOf(prefix) == 0 ? id : prefix + id;
	};

	/**
	 * Stores highlighter so that getHighlighterById() can do its thing. Each
	 * highlighter must call this method to preserve itself.
	 * @param {Highilghter} highlighter Highlighter instance.
	 */
	function storeHighlighter(highlighter)
	{
		sh.vars.highlighters[getHighlighterId(highlighter.id)] = highlighter;
	};

	/**
	 * Looks for a child or parent node which has specified classname.
	 * Equivalent to jQuery's $(container).find(".className")
	 * @param {Element} target Target element.
	 * @param {String} search Class name or node name to look for.
	 * @param {Boolean} reverse If set to true, will go up the node tree instead of down.
	 * @return {Element} Returns found child or parent element on null.
	 */
	function findElement(target, search, reverse /* optional */)
	{
		if (target == null)
			return null;
			
		var nodes			= reverse != true ? target.childNodes : [ target.parentNode ],
			propertyToFind	= { '#' : 'id', '.' : 'className' }[search.substr(0, 1)] || 'nodeName',
			expectedValue,
			found
			;

		expectedValue = propertyToFind != 'nodeName'
			? search.substr(1)
			: search.toUpperCase()
			;
			
		// main return of the found node
		if ((target[propertyToFind] || '').indexOf(expectedValue) != -1)
			return target;
		
		for (var i = 0; nodes && i < nodes.length && found == null; i++)
			found = findElement(nodes[i], search, reverse);
		
		return found;
	};

	/**
	 * Looks for a parent node which has specified classname.
	 * This is an alias to <code>findElement(container, className, true)</code>.
	 * @param {Element} target Target element.
	 * @param {String} className Class name to look for.
	 * @return {Element} Returns found parent element on null.
	 */
	function findParentElement(target, className)
	{
		return findElement(target, className, true);
	};

return sh;
}(); // end of anonymous function



var XRegExp;
if (XRegExp) throw Error("can't load XRegExp twice in the same frame");
(function () {
    function r(f, e) {
        if (!XRegExp.isRegExp(f)) throw TypeError("type RegExp expected");
        var a = f._xregexp;
        f = XRegExp(f.source, t(f) + (e || ""));
        if (a) f._xregexp = {
            source: a.source,
            captureNames: a.captureNames ? a.captureNames.slice(0) : null
        };
        return f
    }

    function t(f) {
        return (f.global ? "g" : "") + (f.ignoreCase ? "i" : "") + (f.multiline ? "m" : "") + (f.extended ? "x" : "") + (f.sticky ? "y" : "")
    }

    function B(f, e, a, b) {
        var c = u.length,
            d, h, g;
        v = true;
        try {
            for (; c--;) {
                g = u[c];
                if (a & g.scope && (!g.trigger || g.trigger.call(b))) {
                    g.pattern.lastIndex = e;
                    if ((h = g.pattern.exec(f)) && h.index === e) {
                        d = {
                            output: g.handler.call(b, h, a),
                            match: h
                        };
                        break
                    }
                }
            }
        } catch (i) {
            throw i
        } finally {
            v = false
        }
        return d
    }

    function p(f, e, a) {
        if (Array.prototype.indexOf) return f.indexOf(e, a);
        for (a = a || 0; a < f.length; a++)
            if (f[a] === e) return a;
        return -1
    }
    XRegExp = function (f, e) {
        var a = [],
            b = XRegExp.OUTSIDE_CLASS,
            c = 0,
            d, h;
        if (XRegExp.isRegExp(f)) {
            if (e !== undefined) throw TypeError("can't supply flags when constructing one RegExp from another");
            return r(f)
        }
        if (v) throw Error("can't call the XRegExp constructor within token definition functions");
        e = e || "";
        for (d = {
            hasNamedCapture: false,
            captureNames: [],
            hasFlag: function (g) {
                return e.indexOf(g) > -1
            },
            setFlag: function (g) {
                e += g
            }
        }; c < f.length;)
            if (h = B(f, c, b, d)) {
                a.push(h.output);
                c += h.match[0].length || 1
            } else if (h = n.exec.call(z[b], f.slice(c))) {
            a.push(h[0]);
            c += h[0].length
        } else {
            h = f.charAt(c);
            if (h === "[") b = XRegExp.INSIDE_CLASS;
            else if (h === "]") b = XRegExp.OUTSIDE_CLASS;
            a.push(h);
            c++
        }
        a = RegExp(a.join(""), n.replace.call(e, w, ""));
        a._xregexp = {
            source: f,
            captureNames: d.hasNamedCapture ? d.captureNames : null
        };
        return a
    };
    XRegExp.version = "1.5.0";
    XRegExp.INSIDE_CLASS = 1;
    XRegExp.OUTSIDE_CLASS = 2;
    var C = /\$(?:(\d\d?|[$&`'])|{([$\w]+)})/g,
        w = /[^gimy]+|([\s\S])(?=[\s\S]*\1)/g,
        A = /^(?:[?*+]|{\d+(?:,\d*)?})\??/,
        v = false,
        u = [],
        n = {
            exec: RegExp.prototype.exec,
            test: RegExp.prototype.test,
            match: String.prototype.match,
            replace: String.prototype.replace,
            split: String.prototype.split
        },
        x = n.exec.call(/()??/, "")[1] === undefined,
        D = function () {
            var f = /^/g;
            n.test.call(f, "");
            return !f.lastIndex
        }(),
        y = function () {
            var f = /x/g;
            n.replace.call("x", f, "");
            return !f.lastIndex
        }(),
        E = RegExp.prototype.sticky !== undefined,
        z = {};
    z[XRegExp.INSIDE_CLASS] = /^(?:\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S]))/;
    z[XRegExp.OUTSIDE_CLASS] = /^(?:\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S])|\(\?[:=!]|[?*+]\?|{\d+(?:,\d*)?}\??)/;
    XRegExp.addToken = function (f, e, a, b) {
        u.push({
            pattern: r(f, "g" + (E ? "y" : "")),
            handler: e,
            scope: a || XRegExp.OUTSIDE_CLASS,
            trigger: b || null
        })
    };
    XRegExp.cache = function (f, e) {
        var a = f + "/" + (e || "");
        return XRegExp.cache[a] || (XRegExp.cache[a] = XRegExp(f, e))
    };
    XRegExp.copyAsGlobal = function (f) {
        return r(f, "g")
    };
    XRegExp.escape = function (f) {
        return f.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    };
    XRegExp.execAt = function (f, e, a, b) {
        e = r(e, "g" + (b && E ? "y" : ""));
        e.lastIndex = a = a || 0;
        f = e.exec(f);
        return b ? f && f.index === a ? f : null : f
    };
    XRegExp.freezeTokens = function () {
        XRegExp.addToken = function () {
            throw Error("can't run addToken after freezeTokens")
        }
    };
    XRegExp.isRegExp = function (f) {
        return Object.prototype.toString.call(f) === "[object RegExp]"
    };
    XRegExp.iterate = function (f, e, a, b) {
        for (var c = r(e, "g"), d = -1, h; h = c.exec(f);) {
            a.call(b, h, ++d, f, c);
            c.lastIndex === h.index && c.lastIndex++
        }
        if (e.global) e.lastIndex = 0
    };
    XRegExp.matchChain = function (f, e) {
        return function a(b, c) {
            var d = e[c].regex ? e[c] : {
                    regex: e[c]
                },
                h = r(d.regex, "g"),
                g = [],
                i;
            for (i = 0; i < b.length; i++) XRegExp.iterate(b[i], h, function (k) {
                g.push(d.backref ? k[d.backref] || "" : k[0])
            });
            return c === e.length - 1 || !g.length ? g : a(g, c + 1)
        }([f], 0)
    };
    RegExp.prototype.apply = function (f, e) {
        return this.exec(e[0])
    };
    RegExp.prototype.call = function (f, e) {
        return this.exec(e)
    };
    RegExp.prototype.exec = function (f) {
        var e = n.exec.apply(this, arguments),
            a;
        if (e) {
            if (!x && e.length > 1 && p(e, "") > -1) {
                a = RegExp(this.source, n.replace.call(t(this), "g", ""));
                n.replace.call(f.slice(e.index), a, function () {
                    for (var c = 1; c < arguments.length - 2; c++)
                        if (arguments[c] === undefined) e[c] = undefined
                })
            }
            if (this._xregexp && this._xregexp.captureNames)
                for (var b = 1; b < e.length; b++)
                    if (a = this._xregexp.captureNames[b - 1]) e[a] = e[b];
                    !D && this.global && !e[0].length && this.lastIndex > e.index && this.lastIndex--
        }
        return e
    };
    if (!D) RegExp.prototype.test = function (f) {
        (f = n.exec.call(this, f)) && this.global && !f[0].length && this.lastIndex > f.index && this.lastIndex--;
        return !!f
    };
    String.prototype.match = function (f) {
        XRegExp.isRegExp(f) || (f = RegExp(f));
        if (f.global) {
            var e = n.match.apply(this, arguments);
            f.lastIndex = 0;
            return e
        }
        return f.exec(this)
    };
    String.prototype.replace = function (f, e) {
        var a = XRegExp.isRegExp(f),
            b, c;
        if (a && typeof e.valueOf() === "string" && e.indexOf("${") === -1 && y) return n.replace.apply(this, arguments);
        if (a) {
            if (f._xregexp) b = f._xregexp.captureNames
        } else f += ""; if (typeof e === "function") c = n.replace.call(this, f, function () {
            if (b) {
                arguments[0] = new String(arguments[0]);
                for (var d = 0; d < b.length; d++)
                    if (b[d]) arguments[0][b[d]] = arguments[d + 1]
            }
            if (a && f.global) f.lastIndex = arguments[arguments.length - 2] + arguments[0].length;
            return e.apply(null, arguments)
        });
        else {
            c = this + "";
            c = n.replace.call(c, f, function () {
                var d = arguments;
                return n.replace.call(e, C, function (h, g, i) {
                    if (g) switch (g) {
                    case "$":
                        return "$";
                    case "&":
                        return d[0];
                    case "`":
                        return d[d.length - 1].slice(0, d[d.length - 2]);
                    case "'":
                        return d[d.length - 1].slice(d[d.length - 2] + d[0].length);
                    default:
                        i = "";
                        g = +g;
                        if (!g) return h;
                        for (; g > d.length - 3;) {
                            i = String.prototype.slice.call(g, -1) + i;
                            g = Math.floor(g / 10)
                        }
                        return (g ? d[g] || "" : "$") + i
                    } else {
                        g = +i;
                        if (g <= d.length - 3) return d[g];
                        g = b ? p(b, i) : -1;
                        return g > -1 ? d[g + 1] : h
                    }
                })
            })
        } if (a && f.global) f.lastIndex = 0;
        return c
    };
    String.prototype.split = function (f, e) {
        if (!XRegExp.isRegExp(f)) return n.split.apply(this, arguments);
        var a = this + "",
            b = [],
            c = 0,
            d, h;
        if (e === undefined || +e < 0) e = Infinity;
        else {
            e = Math.floor(+e);
            if (!e) return []
        }
        for (f = XRegExp.copyAsGlobal(f); d = f.exec(a);) {
            if (f.lastIndex > c) {
                b.push(a.slice(c, d.index));
                d.length > 1 && d.index < a.length && Array.prototype.push.apply(b, d.slice(1));
                h = d[0].length;
                c = f.lastIndex;
                if (b.length >= e) break
            }
            f.lastIndex === d.index && f.lastIndex++
        }
        if (c === a.length) {
            if (!n.test.call(f, "") || h) b.push("")
        } else b.push(a.slice(c));
        return b.length > e ? b.slice(0, e) : b
    };
    XRegExp.addToken(/\(\?#[^)]*\)/, function (f) {
        return n.test.call(A, f.input.slice(f.index + f[0].length)) ? "" : "(?:)"
    });
    XRegExp.addToken(/\((?!\?)/, function () {
        this.captureNames.push(null);
        return "("
    });
    XRegExp.addToken(/\(\?<([$\w]+)>/, function (f) {
        this.captureNames.push(f[1]);
        this.hasNamedCapture = true;
        return "("
    });
    XRegExp.addToken(/\\k<([\w$]+)>/, function (f) {
        var e = p(this.captureNames, f[1]);
        return e > -1 ? "\\" + (e + 1) + (isNaN(f.input.charAt(f.index + f[0].length)) ? "" : "(?:)") : f[0]
    });
    XRegExp.addToken(/\[\^?]/, function (f) {
        return f[0] === "[]" ? "\\b\\B" : "[\\s\\S]"
    });
    XRegExp.addToken(/^\(\?([imsx]+)\)/, function (f) {
        this.setFlag(f[1]);
        return ""
    });
    XRegExp.addToken(/(?:\s+|#.*)+/, function (f) {
        return n.test.call(A, f.input.slice(f.index + f[0].length)) ? "" : "(?:)"
    }, XRegExp.OUTSIDE_CLASS, function () {
        return this.hasFlag("x")
    });
    XRegExp.addToken(/\./, function () {
        return "[\\s\\S]"
    }, XRegExp.OUTSIDE_CLASS, function () {
        return this.hasFlag("s")
    })
})();





