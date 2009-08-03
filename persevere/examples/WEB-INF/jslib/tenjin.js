/*
 * Copyright(c) 2007-2008 kuwata-lab.com all rights reserved
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * $Rev: 48 $
 * $Release: 0.0.3 $
 */

/*
 * Modified ever so slightly by David to make it work well with Persevere
 *  - removed the var keyword from Tenjin and other global namespace members
 */

/*
 *  Tenjin namespace
 */

Tenjin = {

	RELEASE: '0.0.3',

	_escape_table: { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' },
	_escape_func: function(m) { return Tenjin._escape_table[m] },

	escapeXml: function(s) {
		//if (s == null) return '';
		return typeof(s) == 'string' ? s.replace(/[&<>"]/g, Tenjin._escape_func) : s //"
		//return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); //"
		//return String(s).replace(/[&<>"]/g, Tenjin._escape_func) : s //"
	},

	_unescape_table: { '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&#039;':"'" },
	_unescape_func: function(m) { return Tenjin._unescape_table[m] },

	unescapeXml: function(s) {
		return s.replace(/&(lt|gt|amp|quot|#039);/g, Tenjin._unescape_func);
	},

	_p: function(s) {
		return '<`#' + s + '#`>';
	},

	_P: function(s) {
		return '<`$' + s + '$`>';
	},

	_decode_params: function(s) {
		if (typeof(s) != 'string') return s;
		/// <`#...#`> => #{...},   <`$...$`> => ${...}
		s = s.replace(/%3C%60(\#(.*?)\#|%23(.*?)%23|\$(.*?)\$|%24(.*?)%024)%60%3E/ig,
				  function(m0, m1, m2, m3, m4, m5) {
					  if (m2) return '#{'+decodeURI(m2)+'}';
					  if (m3) return '#{'+decodeURI(m3)+'}';
					  if (m4) return '${'+decodeURI(m4)+'}';
					  if (m5) return '${'+decodeURI(m5)+'}';
					  throw "unreachable";
				  });
		s = s.replace(/&lt;`(\#(.*?)\#|\$(.*?)\$)`&gt;/g,
				  function(m0, m1, m2, m3) {
					  if (m2) return '#{'+Tenjin.unescapeXml(m2)+'}';
					  if (m3) return '${'+Tenjin.unescapeXml(m3)+'}';
					  throw "unreachable";
				  });
		s = s.replace(/<`\#(.*?)\#`>/, '#{$1}');
		s = s.replace(/<`\$(.*?)\$`>/, '${$1}');
		return s;
	},

	strip: function(s) {
		if (! s) return s;
		return s.replace(/^\s+/, '').replace(/\s+$/, '');
	},

	merge: function(to, from) {
		for (var p in from)
			to[p] = from[p];
	},

	mergeIfExists: function(to, from, props) {
		for (var p in from)
			if (p in props)
				to[p] = from[p];
	},

	/// ex. {x: 10, y: 'foo'}
	///       => "var x = _context['x'];\nvar y = _conntext['y'];\n"
	_setlocalvarscode: function(obj) {
		var buf = [];
		for (var p in obj) {
			buf.push("var ", p, " = _context['", p, "'];\n");
		}
		return buf.join('');
	},

	quote: function(str) {
		var s = str.replace(/[\'\\]/g, '\\$&').replace(/\n/g, '\\n\\\n');
		return "'"+s+"'";
	},

	readFile: function(filename) { throw "readFile(): not implemented"; },

	writeFile: function(filename, content) { throw "writeFile(): not implemented"; },

	isFile: function(filename) { throw "isFile(): not implemented"; },

	isNewer: function(filename, filename2) {
		return Tenjin.mtime(filename) > Tenjin.mtime(filename2);
	},

	mtime: function(filename) { throw "mtime(): not implemented"; },

	checked:  function(expr) { return expr ? ' checked="checked"' : ''; },
	selected: function(expr) { return expr ? ' selected="selected"' : ''; },
	disabled: function(expr) { return expr ? ' disabled="disabled"' : ''; },
	nl2br:    function(text) { return text ? text.replace(/\r?\n/g, '<br />$&') : ''; },
	text2html: function(text) { return text ? Tenjin.nl2br(Tenjin.escapeXml(text).replace(/  /g, ' &nbsp;')) : text },

	_end: undefined  /// dummy property to escape strict warning (not legal in ECMA-262)
};
delete(Tenjin._end);


if (typeof(java) == 'object' && typeof(Packages) == 'function') { // Rhino

	//importPackage(java.io);

	Tenjin.readFile = function(filename) {
		var reader = new java.io.BufferedReader(new java.io.FileReader(filename));
		//var buf = Array(512);
		//reader.read(buf, 0, 512); // Cannot convert org.mozilla.javascript.NativeArray@3c6a22 to char[]
		var line;
		var buf = [];
		while ((line = reader.readLine()) != null) {
			buf.push(line);
		}
		reader.close();
		buf.push("");
		return buf.join("\n");
	};
	if (typeof(readFile) == 'function')
		Tenjin.readFile = readFile;

	Tenjin.writeFile = function(filename, content) {
		//var file = new java.io.File(filename);
		var writer = new java.io.BufferedWriter(new java.io.FileWriter(filename));
		writer.write(content);
		writer.close();
	};

	Tenjin.separator = java.io.File.separator;

	Tenjin.isFile = function(filename) {
		return (new java.io.File(filename)).isFile();
	};

	Tenjin.isNewer = function(filename, filename2) {
		var File = java.io.File;
		var mtime1 = (new File(filename)).lastModified();
		var mtime2 = (new File(filename2)).lastModified();
		return mtime1 > mtime2;
	};

	Tenjin.mtime = function(filename) {
		return (new java.io.File(filename)).lastModified();
	};

}
else if (typeof(File) == 'function') {	/// File object is available

	Tenjin._readFile = function(filename) {
		var f = File(filename);
		f.open('text,read');
		var max = 4096;
		var buf = [], i = 0, s;
		while ((s = f.read(max)) != undefined) {  /// readfile() will exit if EOF. Why?
			buf[i++] = s;
			if (s.length < max)
				break;
		}
		f.close();
		return i == 1 ? buf[0] : buf.join('')
	};

	Tenjin._writeFile = function(filename, content) {
		try {
			var f = File(filename);
			f.open('text,write,create,replace');
			f.write(content);
			f.close();
		}
		catch (ex) {
			ex.message = filename + ': ' + ex.message;
			throw ex;
		}
	};

	Tenjin._wrapExceptionCatcher = function(func) {
		return function(filename, arg) {
			try {
				return func(filename, arg);
			}
			catch (ex) {
				ex.message = "'" + filename + "': " + ex.message;
				throw ex;
			}
		}
	};

	Tenjin.readFile = Tenjin._wrapExceptionCatcher(Tenjin._readFile)

	Tenjin.writeFile = Tenjin._wrapExceptionCatcher(Tenjin._writeFile)

	Tenjin.separator = File.separator;

	Tenjin.isFile = function(filename) {
		return (new File(filename)).isFile;
	};

	Tenjin.isNewer = function(filename, filename2) {  /// dummy
		return true;
	};

	Tenjin.mtime = function(filename) {  /// dummy
		return 0;
	};

}
else {	/// dummy function

	Tenjin._files = {};

	Tenjin.readFile = function(filename) {
		return Tenjin._files[filename];
	};

	Tenjin.writeFile = function(filename, content) {
		Tenjin._files[filename] = content;
	};

	Tenjin.separator = '/';

	Tenjin.isFile = function(filename) {
		return Tenjin._files[filename] ? true : false;
	};

	Tenjin.isNewer = function(filename, filename2) {  /// dummy
		return true;
	};

	Tenjin.mtime = function(filename) {  /// dummy
		return 0;
	};

}



/*
 *  exported functions
 */
escapeXml = Tenjin.escapeXml;

_p = Tenjin._p;

_P = Tenjin._P;



/**
 *  Template class
 */

Tenjin.Template = function(filename, properties) {
	if (typeof(filename) == 'object') {  /// 'Tenjin.Template(properties)' is available
		properties = filename;
		filename = undefined;
	}
	if (properties) {
		Tenjin.mergeIfExists(this, properties, Tenjin.Template.__props__);
		if (this.preamble == true)  delete(this.preamble);
		else if (! this.preamble)   this.preamble = '';
		if (this.postamble == true) delete(this.postamble);
		else if (! this.postamble)  this.postamble = '';
		var v = properties.escapefunc;
		if (v && v.charAt(0) == '.') {
			this.escapeExpression = v.charAt(v.length-1) == ')' ?
				function(expr) { return '('+expr+')'+this.escapefunc; } :
				function(expr) { return '('+expr+')'+this.escapefunc + '()'; } ;
		}
	}
	if (filename) {
		this.convertFile(filename);
	}
};

Tenjin.Template.__props__ = {
	escapefunc : "escapeXml",
	preamble   : "var _buf = []; ",
	postamble  : "_buf.join('')\n",
	script     : null,
	filename   : null,
	atline     : 0
};

Tenjin.Template.prototype = {

	convert: function(input) {
		this.filename = null;
		var buf = [];
		if (this.atline)
			buf.push("//@line ", this.atline, "\n");
		if (this.preamble)
			buf.push(this.preamble);
		this.parseStatements(buf, input);
		if (this.postamble) {
			//var s = buf[buf.length-1];
			//var c = s.charAt(s.length-1);
			//if (c != "\n" && c != ";")
			//	buf.push("; ");
			buf.push(this.postamble);
		}
		var script = this.script = buf.join('');
		//if (this.args) {
		//	this.compile();
		//}
		return script;
	},

	convertFile: function(filename) {
		var input = Tenjin.readFile(filename);
		var script = this.convert(input);
		this.filename = filename;
		return script;
	},

	compileStatementPattern: function(pi) {
		//return eval('/<\\?'+pi+'(\\s(.|\\n)*?) ?\\?>([ \\t]*\\r?\\n)?/g');
		return new RegExp('<\\?'+pi+'(\\s(.|\\n)*?) ?\\?>([ \\t]*\\r?\\n)?', 'g');
	},

	//statementPattern: Tenjin.Template.prototype.compileStatementPattern('js'),
	statementPattern: undefined,

	parseStatements: function(buf, input) {
		//var regexp = /<\?js(\s(.|\n)*?) ?\?>([ \t]*\r?\n)?/g;
		var regexp = this.statementPattern;
		var pos = 0;
		var is_bol = true;   // beginning of line
		var m, rindex;
		while ((m = regexp.exec(input)) != null) {
			var stmt = m[1];
			var rspace = m[3];
			var text = input.substring(pos, m.index);
			pos = m.index + m[0].length;
			/// detect spaces at beginning of line
			var lspace = null;
			if (text == '') {
				if (is_bol) lspace = '';
			}
			else if (text.charAt(text.length - 1) == "\n") {
				lspace = '';
			}
			else if ((rindex = text.lastIndexOf("\n")) >= 0) {
				var s = text.substring(rindex+1);
				if (s.match(/^\s*$/)) {
					lspace = s;
					text = text.substring(0, rindex+1);
				}
			}
			else if (is_bol && text.match(/^\s*$/)) {
				lspace = text;
				text = '';
			}
			is_bol = rspace !== null;
			///
			if (text) {
				this.parseExpressions(buf, text);
			}
			if (lspace)
				buf.push(lspace);
			if (stmt) {
				stmt = this.hookStatement(stmt);
				buf.push(stmt);
			}
			if (rspace)
				buf.push(rspace);
		}
		var rest = pos == 0 ? input : input.substring(pos);
		if (rest)
			this.parseExpressions(buf, rest);
	},

	hookStatement: function(stmt) {
		/// macro expantion
		var macro_pattern = /^\s*(\w+)\((.*?)\);?\s*$/;
		var m = stmt.match(macro_pattern);
		if (m) {
			var name = m[1];
			var arg  = m[2];
			var handler = this.macroHandlers[name];
			return handler == undefined ? stmt : handler(arg);
		}
		/// arguments declaration
		if (! this.args) {
			var args_pattern = /^ *\/\/@ARGS[ \t]+(.*?)$/;
			var m = stmt.match(args_pattern);
			if (m) {
				var arr = m[1].split(',');
				var args = [], declares = [];
				var strip = Tenjin.strip;
				for (var i = 0, n = arr.length; i < n; i++) {
					var arg = strip(arr[i]);
					if (! arg.match(/^[a-zA-Z_]\w*$/))
						throw Error("'"+arg+"': invalid template argument.");
					args.push(arg);
					declares.push(" var ", arg, " = _context['", arg, "'];");
					//declares.push(arg, " = typeof(_context.", arg, ')!='undefined' ? _context.", arg, " : undefined; ');
				}
				this.args = args;
				return declares.join('');
			}
		}
		/// else
		return stmt;
	},

	args: null,

	macroHandlers: {
		'echo': function(arg) {
			return " _buf.push("+arg+");";
		},
		'include': function(arg) {
			return " _buf.push(_context._engine.render("+arg+", _context, false));";
		},
		'startCapture': function(arg) {
			return " var _buf_bkup = _buf; _buf = []; var _capture_varname = "+arg+";";
		},
		'stopCapture': function(arg) {
			return " _context[_capture_varname] = _buf.join(''); _buf = _buf_bkup;";
		},
		'startPlaceholder': function(arg) {
			return " if (typeof(_context["+arg+"])!='undefined') { _buf.push(_context["+arg+"]); } else {";
		},
		'stopPlaceholder': function(arg) {
			return "}";
		},
		//'': undefined  /// dummy property to escape strict warning (not legal in ECMA-262)
	},

	expressionPattern: /([$#])\{((.|\n)*?)\}/g,

	getExpressionAndEscapeflag: function(matched) {
		return [matched[2], matched[1] == '$'];
	},

	parseExpressions: function(buf, input) {
		var _input = input;
		this.startTextPart(buf);
		//var regexp = /[$#]\{.*?\}/g;
		var regexp = this.expressionPattern;
		var pos = 0;
		var m;
		while ((m = regexp.exec(input)) != null) {
			var text = input.substring(pos, m.index);
			var s = m[0];
			pos = m.index + s.length;
			if (text) {
				this.addText(buf, text);
				buf.push(", ");
			}
			var ret = this.getExpressionAndEscapeflag(m);
			var expr = ret[0], flag_escape = ret[1];
			expr = this.hookExpression(expr, flag_escape);
			if (expr) {
				buf.push(expr);
				buf.push(", ");
			}
		}
		var rest = pos == 0 ? input : input.substring(pos);
		rest ? this.addText(buf, rest, true) : buf.push('""');
		this.stopTextPart(buf);
		if (input.charAt(input.length-1) == "\n") {
			buf.push("\n");
		}
	},

	startTextPart: function(buf) {
		buf.push(" _buf.push(");
	},

	stopTextPart: function(buf) {
		buf.push(");");
	},

	hookExpression: function(expr, flag_escape) {
		return flag_escape ? this.escapeExpression(expr) : expr;
	},

	escapeExpression: function(expr) {
		return this.escapefunc+"("+expr+")";
	},

	addText: function(buf, text, encode_newline) {
		if (! text) return;
		var s = text.replace(/[\'\\]/g, '\\$&').replace(/\n/g, '\\n\\\n');
		if (encode_newline && text.charAt(text.length-1) == '\n') {
			buf.push("'", s.substring(0, s.length-2), "'");
		}
		else {
			buf.push("'", s, "'");
		}
	},

	render: function(_context) {
		//if (this.args) {
		//	this.compile();
		//	this.render(_context);
		//}
		if (_context) {
			eval(Tenjin._setlocalvarscode(_context));
		}
		else {
			_context = {};
		}
		//var _buf = [];
		//eval(this.script);
		//return _buf.join('');
		return eval(this.script);
	},

	compile: function(args) {
		if (! this.args)
			return undefined;
		var script = this.script;
		var pos = script.length - this.postamble.length;
		var buf = [
				"this.render = function(_context) {",
				script.substring(0, pos),
				"return ", this.postamble,
				"}" ];
		var s = buf.join('');
		eval(s);
		return s;
		//this.script = s;
		//return func;
		//return true;
	},

	_end: undefined  /// dummy property to escape strict warning (not legal in ECMA-262)
};
delete(Tenjin.Template.prototype._end);

Tenjin.merge(Tenjin.Template.prototype, Tenjin.Template.__props__);

Tenjin.Template.prototype._render = Tenjin.Template.prototype.render;

Tenjin.Template.prototype.statementPattern = Tenjin.Template.prototype.compileStatementPattern('js'),



/*
 * convenient function
 */
Tenjin.render = function(template_str, context) {
	var template = new Tenjin.Template();
	template.convert(template_str);
	return template.render(context);
}



/**
 *  NoTextTemplate class (for debugging)
 */

Tenjin.NoTextTemplate = function(filename, properties) {
	Tenjin.Template.call(this, filename, properties);
};

Tenjin.NoTextTemplate.prototype = new Tenjin.Template();
//Tenjin.merge(Tenjin.NoTextTemplate.prototype, Tenjin.Template.prototype);

Tenjin.merge(Tenjin.NoTextTemplate.prototype, {

	addText: function(buf, text, encode_newline) {
		if (text) {
			var pos = -1;
			for (var i = 0, n = text.length; i < n; i++) {
				if (text.charAt(i) == "\n") {
					buf.push("\n");
					pos = i;
				}
			}
			if (pos >= 0) {
				for (var i = pos+1, n = text.length; i < n; i++) {
					buf.push(" ");
				}
			}
		}
	},

	parseExpressions: function(buf, input) {
		var _input = input;
		//this.startTextPart(buf);
		var regexp = this.expressionPattern;
		var pos = 0;
		var m;
		while ((m = regexp.exec(input)) != null) {
			var text = input.substring(pos, m.index);
			var s = m[0];
			pos = m.index + s.length;
			this.addText(buf, text);
			//buf.push(", ");
			this.startTextPart(buf);
			var ret = this.getExpressionAndEscapeflag(m);
			var expr = ret[0], flag_escape = ret[1];
			buf.push(this.hookExpression(expr, flag_escape));
			//buf.push(", ");
			this.stopTextPart(buf);
			//buf.push("; ");
		}
		var rest = pos == 0 ? input : input.substring(pos);
		//rest ? this.addText(buf, rest, true) : buf.push('""');
		if (rest) this.addText(buf, rest, true);
		//this.stopTextPart(buf);
		//if (input.charAt(input.length-1) == "\n") {
		//	buf.push("\n");
		//}
	}
});



/**
 *  Preprocessor class
 */

Tenjin.Preprocessor = function(filename, properties) {
	Tenjin.Template.call(this, filename, properties);
};

Tenjin.Preprocessor.prototype = new Tenjin.Template();
//Tenjin.merge(Tenjin.Preprocessor.prototype, Tenjin.Template.prototype);

Tenjin.merge(Tenjin.Preprocessor.prototype, {

	statementPattern: Tenjin.Template.prototype.compileStatementPattern('JS'),

	expressionPattern: /([$#])\{\{((.|\n)*?)\}\}/g,

	//getExpressionAndEscapeflag: function(match) {
	//	return [match[1], match[0] == '$'];
	//},

	hookExpression: function(expr, flag_escape) {
		expr = 'Tenjin._decode_params('+expr+')';
		return Tenjin.Template.prototype.hookExpression(expr, flag_escape);
	}

});



/**
 *  Engine class
 */

Tenjin.Engine = function(properties) {
	if (properties)
		Tenjin.mergeIfExists(this, properties, Tenjin.Engine.__props__);
	this.templates = {};
	this.properties = properties || {};
};

Tenjin.Engine.__props__ = {
	prefix: '',
	postfix: '',
	layout: null,
	cache: false,
	path: null,
	preprocess: false,
	templateclass: Tenjin.Template
};

Tenjin.Engine.prototype = {

	templateFilename: function(template_name) {
		if (template_name.charAt(0) == ':') {
			return this.prefix + template_name.substring(1) + this.postfix;
		}
		return template_name;
	},

	findTemplateFile: function(filename) {
		if (this.path) {
			var path = this.path;
			for (var i = 0, n = this.path.length; i < n; i++) {
				var dir = path[i];
				var filepath = dir + Tenjin.separator + filename;
				if (Tenjin.isFile(filepath))
					return filepath;
			}
		}
		else {
			if (Tenjin.isFile(filename))
				return filename;
		}
		throw Error(filename + ': file not found.');
	},

	loadCacheFile: function(cache_filename, template) {
		var script = Tenjin.readFile(cache_filename);
		var m = script.match('^\/\/@ARGS (.*)\r?\n');
		if (m) {
			script = script.substring(m[0].length);
			var argstr = m[1];
			template.args = argstr.split(',');
		}
		template.script = script;
	},

	storeCacheFile: function(cache_filename, template) {
		var script = template.script;
		if (template.args) {
			script = "//@ARGS " + template.args.join(',') + "\n" + script;
		}
		Tenjin.writeFile(cache_filename, script);
	},

	readTemplateFile: function(filename, context) {
		if (! this.preprocess) {
			return Tenjin.readFile(filename);
		}
		var preprocessor = new Tenjin.Preprocessor(filename);
		if (! context || !context._engine)
			context = this.hookContext(context);
		return preprocessor.render(context);
	},

	cachename: function(filename) {
		return filename + '.cache';
	},

	createTemplate: function(filename, _context) {
		var template = new this.templateclass(this.properties);
		template.timestamp = new Date();
		var cache_filename = this.cachename(filename);
		if (! filename) {
			/// nothing
		}
		else if (! this.cache) {
			//template.convertFile(filename);
			var input = this.readTemplateFile(filename, _context);
			template.convert(input, filename);
		}
		else if (Tenjin.isFile(cache_filename) && Tenjin.isNewer(cache_filename, filename)) {
			this.loadCacheFile(cache_filename, template);
			template.filename = filename;
		}
		else {
			//template.convertFile(filename);
			var input = this.readTemplateFile(filename, _context);
			template.convert(input, filename);
			this.storeCacheFile(cache_filename, template);
		}
		template.compile();
		return template;
	},

	registerTemplate: function(template_name, template) {
		if (typeof(template) == 'string') {
			var str = template;
			template = this.createTemplate(null);
			template.convert(str);
		}
		//if (template.timestamp == undefined) {
		//	template.timestamp = new Date();
		//}
		this.templates[template_name] = template;
	},

	getTemplate: function(template_name, _context) {
		var template = this.templates[template_name];
		var t = template;
		var filename = null;
		if (! template) {
			filename = this.templateFilename(template_name);
			filename = this.findTemplateFile(filename);
		}
		else if (t.filename && t.timestamp && t.timestamp <= Tenjin.mtime(t.filename)) {
			filename = t.filename;
		}
		if (filename) {
			template = this.createTemplate(filename, _context); /// pass _context only for preprocessing
			this.registerTemplate(template_name, template);
		}
		return template;
	},

	render: function(template_name, context, layout) {
		context = this.hookContext(context);
		var output;
		while (true) {
			var template = this.getTemplate(template_name, context); /// context is passed only for preprocessing
			try {
				output = template.render(context);
			}
			catch (ex) {
				ex.template = template.fiename || template_name
				ex.message = ex.template + ': ' + ex.message;
				throw ex;
			}
			if (context._layout != null) {
				layout = context._layout
				context._layout = null;
			}
			layout = (layout == true || layout == null) ? this.layout : layout;
			if (! layout)
				break;
			template_name = layout;
			layout = false;
			context._content = output;
		}
		context._content = undefined;
		return output;
	},

	hookContext: function(context) {
		if (context == undefined)
			context = {};
		context._engine = this;
		context._layout = null;
		context.capturedAs = Tenjin.Engine._capturedAs;
		return context;
	},

	_end: undefined  /// dummy property to escape strict warning (not legal in ECMA-262)
};
delete(Tenjin.Engine.prototype._end);

Tenjin.merge(Tenjin.Engine.prototype, Tenjin.Engine.__props__);

//Tenjin.Engine._capturedAs = function(name) {
//	var context = this;
//	if (context[name] == undefined)
//		return false;
//	context._buf.push(context[name]);
//	return true;
//}


/*
 *  for debugging
 */
Tenjin.inspect = function(value) {
	var t = typeof(value);
	if (t == "string")
		return "'" + value.replace(/\\/, '\\\\').replace(/\n/, '\\\\n\\').replace(/'/, "\\\\'") + "'";  //'
	if (t == "number")
		return value.toString();
	if (t == "null" || t == "undefined" || t == "true" || t == "false")
		return t;
	if (t == "boolean")
		return value ? "true" : "false";
	if (t == "function")
		return "<function>";
	if (t == "object") {
		var buf = [];
		if (value.constructor === Array) {  /// or Array.prototype
			buf.push("[");
			for (var i = 0, len = value.length; i < len; i++) {
				if (i > 0) buf.push(', ');
				buf.push(Tenjin.inspect(value[i]));
			}
			buf.push("]");
		}
		else {
			buf.push("{");
			for (var p in value) {
				if (buf.length > 1) buf.push(', ');
				buf.push(p + ':' + Tenjin.inspect(value[p]))
			}
			buf.push("}");
		}
		return buf.join('');
	}
	throw "unreachable: typeof(value)="+typeof(value)+", value="+value;
}
