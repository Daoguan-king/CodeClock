/* ============================================================================
 * CodeClock · languages.js 语言模板开发文档
 * ----------------------------------------------------------------------------
 * 【架构】
 *   LANG 是一个数组，每个元素代表一种编程语言：
 *   {
 *     name:   "语言显示名（仅作标注）",
 *     ext:    "编辑器标签栏显示的文件名，如 clock.py",
 *     render: function (T, cfg) { ... 返回行数组 ... }
 *   }
 *   render(T, cfg) 必须返回一个数组，每个元素是一行；
 *   每行是 token 数组，token 形如 { t: 类型, x: 文本 }。
 *
 * 【渲染时提供的参数】
 *   T（时间数据，已按用户配置计算好）：
 *     T.hour           小时（24h 制为 0-23；12h 制为 0-11）
 *     T.min / T.sec    分钟 / 秒（数字）
 *   T.period         "AM"/"PM" 或 "上午"/"下午"
 *   T.weekday        星期（按用户选择："Wednesday" / "星期三"）
 *   T.day / T.year   日 / 年（数字）
 *     T.month          月（按用户选择："August" / "Aug" / "8"）
 *     T.comment        顶部注释文本（如 "Wednesday, 19 August 2026"，已应用日期格式规则）
 *     T.commentBottom  底部注释文本（用户自定义；为空字符串表示该行应隐藏）
 *
 *   cfg（显示开关）：
 *     cfg.showComment   是否显示装饰注释
 *     cfg.showSeconds   是否显示秒字段
 *     cfg.showPeriod    是否显示上下午字段（24h 制时自动为 false）
 *     cfg.showDate      是否显示日/月/年字段
 *     cfg.showWeekday   是否显示星期（仅影响 T.comment）
 *     cfg.wdLang        星期语言：1 英文 / 2 中文
 *     cfg.monthFormat   月份格式：1 名称 / 2 数字 / 3 缩写
 *
 * 【常用辅助函数】
 *   line(...)            组装一行。参数可为字符串（纯文本）或 [文本, 类型] 数组。
 *                        例如：line("    ", ["int", "key"], " ", ["hour", "var"], [";", "pun"])
 *   fieldList(T, cfg)    生成字段列表，按用户开关自动包含/剔除字段：
 *                        [{ name: "hour", type: "int", v: 9 },
 *                         { name: "period", type: "str", v: "AM" }, ...]
 *                        字段顺序固定：hour, minute, second, period, weekday,
 *                        day, month, year（weekday 仅在显示星期时出现）
 *   valueTok(f)          字段 f 的取值 token：数字或双引号字符串
 *   numTok(v)            数字 token：[String(v), "num"]
 *   strTok(v)            双引号字符串 token：['"' + v + '"', "str"]
 *   strTokSql(v)         单引号字符串 token：["'" + v + "'", "str"]（MATLAB / SQL 用）
 *   commentLine(P, text) 生成注释行，P 为注释前缀，如 "// " / "# " / "-- "
 *                        （Wolfram 的成对 (* *) 注释需手动拼接，参考 Wolfram 模板）
 *   cap(s)               首字母大写，如 cap("hour") -> "Hour"（Go / C# 风格）
 *
 * 【token 类型一览】（对应 themes.js 中每套主题的颜色变量）
 *   ""   纯文本（无着色）       com  注释
 *   key  关键字                 str  字符串
 *   num  数字                   typ  类型/类名（Clock、String、u8...）
 *   var  变量/字段名            pun  标点符号（= { } ( ) ; , : -> ...）
 *   fn   函数名                 pp   预处理指令（#include、<?php...）
 *
 * 【添加新语言步骤（以 Lua 为例）】
 *   1. 在文件末尾追加一个 LANG.push 条目：
 *   ------------------------------------------------------------------
 *   LANG.push({
 *       name: "Lua",
 *       ext: "clock.lua",
 *       render: function (T, cfg) {
 *           var L = [], f = fieldList(T, cfg), i;
 *           if (cfg.showComment) L.push(commentLine("-- ", T.comment));
 *           L.push(line(["clock", "var"], " ", ["=", "pun"], " ", ["{", "pun"]));
 *           for (i = 0; i < f.length; i++) {
 *               L.push(line("    ", [f[i].name, "var"], " ", ["=", "pun"], " ",
 *                   f[i].type === "str" ? strTok(f[i].v) : numTok(f[i].v), [",", "pun"]));
 *           }
 *           L.push(line(["};", "pun"]));
 *           if (cfg.showComment && T.commentBottom) L.push(commentLine("-- ", T.commentBottom));
 *           return L;
 *       }
 *   });
 *   ------------------------------------------------------------------
 *   2. 在 project.json 的 "Language" 选项数组中追加一项（value 递增）：
 *      { "label": "Lua", "value": 15 }
 *   3. 完成。切换语言即可看到效果。
 *
 * 【注意事项】
 *   - 底部注释：必须写成 if (cfg.showComment && T.commentBottom)，
 *     因为用户清空底部注释时 T.commentBottom 为空字符串，此时该行应隐藏。
 *   - 24h 制：cfg.showPeriod 会自动变 false，fieldList 会自动剔除 period，
 *     因此 C 结构体、SQL 列等"字段必须一一对应"的模板无需额外处理。
 *   - 字符串引号：JS/Python/PHP/Wolfram 等用双引号（strTok）；
 *     MATLAB 字段值、SQL 值用单引号（strTokSql）。
 *   - 尾逗号：Go 结构体字面量、SQL 列定义、Wolfram 关联不允许尾逗号，
 *     需用 last = f.length - 1 判断最后一项（参考 Go / SQL / Wolfram 模板）。
 *   - 注释语法：多数语言为 //，Python 为 #，SQL 为 --，
 *     Wolfram 为成对的 (* ... *)（前后缀都需手动拼接）。
 *   - 文本的 HTML 转义由 main.js 统一处理，模板中无需关心。
 * ============================================================================ */

var LANG = [];

function line() {
	var out = [], i, a;
	for (i = 0; i < arguments.length; i++) {
		a = arguments[i];
		out.push(typeof a === "string" ? { t: "", x: a } : { t: a[1], x: a[0] });
	}
	return out;
}

function fieldList(T, cfg) {
	var f = [];
	f.push({ name: "hour", type: "int", v: T.hour });
	f.push({ name: "minute", type: "int", v: T.min });
	if (cfg.showSeconds) f.push({ name: "second", type: "int", v: T.sec });
	if (cfg.showPeriod) f.push({ name: "period", type: "str", v: T.period });
	if (cfg.showWeekday) f.push({ name: "weekday", type: "str", v: T.weekday });
	if (cfg.showDate) {
		f.push({ name: "day", type: "int", v: T.day });
		f.push({ name: "month", type: "str", v: T.month });
		f.push({ name: "year", type: "int", v: T.year });
	}
	return f;
}

function cap(s) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function numTok(v) {
	return [String(v), "num"];
}

function strTok(v) {
	return ['"' + v + '"', "str"];
}

function strTokSql(v) {
	return ["'" + v + "'", "str"];
}

function valueTok(f) {
	return f.type === "str" ? strTok(f.v) : numTok(f.v);
}

function commentLine(P, text) {
	return line([P + text, "com"]);
}

LANG.push({
	name: "JavaScript",
	ext: "clock.js",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["const", "key"], " ", ["clock", "var"], " ", ["=", "pun"], " {"));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", [f[i].name, "var"], [":", "pun"], " ", valueTok(f[i]), [",", "pun"]));
		}
		L.push(line(["};", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "TypeScript",
	ext: "clock.ts",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["interface", "key"], " ", ["Clock", "typ"], " {"));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", [f[i].name, "var"], [":", "pun"], " ", [f[i].type === "str" ? "string" : "number", "typ"], [";", "pun"]));
		}
		L.push(line(["};", "pun"]));
		L.push(line(""));
		L.push(line(["const", "key"], " ", ["clock", "var"], [":", "pun"], " ", ["Clock", "typ"], " ", ["=", "pun"], " {"));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", [f[i].name, "var"], [":", "pun"], " ", valueTok(f[i]), [",", "pun"]));
		}
		L.push(line(["};", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "Python",
	ext: "clock.py",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("# ", T.comment));
		L.push(line(["from", "key"], " ", ["datetime", "typ"], " ", ["import", "key"], " ", ["datetime", "typ"]));
		L.push(line(""));
		L.push(line(["clock", "var"], " ", ["=", "pun"], " {"));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", ['"' + f[i].name + '"', "str"], [":", "pun"], " ", valueTok(f[i]), [",", "pun"]));
		}
		L.push(line(["}", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("# ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "Java",
	ext: "Clock.java",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["public", "key"], " ", ["class", "key"], " ", ["Clock", "typ"], " {"));
		L.push(line(""));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", ["public", "key"], " ", ["static", "key"], " ", [f[i].type === "str" ? "String" : "int", f[i].type === "str" ? "typ" : "key"], " ", [f[i].name, "var"], " ", ["=", "pun"], " ", valueTok(f[i]), [";", "pun"]));
		}
		L.push(line(["}", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "C",
	ext: "clock.c",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i, arr, vals;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["#include", "pp"], " ", ["<stdio.h>", "str"]));
		L.push(line(""));
		L.push(line(["typedef", "key"], " ", ["struct", "key"], " {"));
		for (i = 0; i < f.length; i++) {
			if (f[i].type === "str") {
				L.push(line("    ", ["char", "key"], " ", ["*", "pun"], " ", [f[i].name, "var"], [";", "pun"]));
			} else {
				L.push(line("    ", ["int", "key"], " ", [f[i].name, "var"], [";", "pun"]));
			}
		}
		L.push(line(["}","pun"], " ", ["Clock","typ"], [";","pun"]));
		L.push(line(""));
		vals = [];
		for (i = 0; i < f.length; i++) {
			vals.push(f[i].type === "str" ? strTok(f[i].v) : numTok(f[i].v));
		}
		arr = [["Clock", "typ"], " ", ["clock", "var"], " ", ["=", "pun"], " ", ["{", "pun"], " "];
		for (i = 0; i < vals.length; i++) {
			if (i > 0) arr.push(", ");
			arr.push(vals[i]);
		}
		arr.push(" ", ["};", "pun"]);
		L.push(line.apply(null, arr));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "C++",
	ext: "clock.cpp",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i, arr, vals;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["#include", "pp"], " ", ["<string>", "str"]));
		L.push(line(""));
		L.push(line(["struct", "key"], " ", ["Clock", "typ"], " {"));
		for (i = 0; i < f.length; i++) {
			if (f[i].type === "str") {
				L.push(line("    ", ["std::string", "typ"], " ", [f[i].name, "var"], [";", "pun"]));
			} else {
				L.push(line("    ", ["int", "key"], " ", [f[i].name, "var"], [";", "pun"]));
			}
		}
		L.push(line(["};", "pun"]));
		L.push(line(""));
		vals = [];
		for (i = 0; i < f.length; i++) {
			vals.push(f[i].type === "str" ? strTok(f[i].v) : numTok(f[i].v));
		}
		arr = [["Clock", "typ"], " ", ["clock", "var"], " ", ["=", "pun"], " ", ["{", "pun"], " "];
		for (i = 0; i < vals.length; i++) {
			if (i > 0) arr.push(", ");
			arr.push(vals[i]);
		}
		arr.push(" ", ["};", "pun"]);
		L.push(line.apply(null, arr));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "C#",
	ext: "Clock.cs",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["public", "key"], " ", ["class", "key"], " ", ["Clock", "typ"]));
		L.push(line(["{", "pun"]));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", ["public", "key"], " ", ["static", "key"], " ", [f[i].type === "str" ? "string" : "int", "key"], " ", [cap(f[i].name), "var"], " ", ["=", "pun"], " ", valueTok(f[i]), [";", "pun"]));
		}
		L.push(line(["}", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "Rust",
	ext: "clock.rs",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["struct", "key"], " ", ["Clock", "typ"], " {"));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", [f[i].name, "var"], [":", "pun"], " ", [f[i].type === "str" ? "&'static str" : (f[i].name === "year" ? "u16" : "u8"), "typ"], [",", "pun"]));
		}
		L.push(line(["}", "pun"]));
		L.push(line(""));
		L.push(line(["let", "key"], " ", ["clock", "var"], " ", ["=", "pun"], " ", ["Clock", "typ"], " {"));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", [f[i].name, "var"], [":", "pun"], " ", valueTok(f[i]), [",", "pun"]));
		}
		L.push(line(["};", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "SQL",
	ext: "clock.sql",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i, arr, last;
		if (cfg.showComment) L.push(commentLine("-- ", T.comment));
		L.push(line(["CREATE", "key"], " ", ["TABLE", "key"], " ", ["clock", "var"], " ("));
		last = f.length - 1;
		for (i = 0; i < f.length; i++) {
			if (i === last) {
				L.push(line("    ", [f[i].name, "var"], " ", [f[i].type === "str" ? "TEXT" : "INT", "key"]));
			} else {
				L.push(line("    ", [f[i].name, "var"], " ", [f[i].type === "str" ? "TEXT" : "INT", "key"], [",", "pun"]));
			}
		}
		L.push(line([");", "pun"]));
		L.push(line(""));
		arr = [["INSERT", "key"], " ", ["INTO", "key"], " ", ["clock", "var"], " ", ["(", "pun"]];
		for (i = 0; i < f.length; i++) {
			if (i > 0) arr.push(", ");
			arr.push([f[i].name, "var"]);
		}
		arr.push([")", "pun"]);
		L.push(line.apply(null, arr));
		arr = [["VALUES", "key"], " ", ["(", "pun"]];
		for (i = 0; i < f.length; i++) {
			if (i > 0) arr.push(", ");
			arr.push(f[i].type === "str" ? strTokSql(f[i].v) : numTok(f[i].v));
		}
		arr.push([")", "pun"], [";", "pun"]);
		L.push(line.apply(null, arr));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("-- ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "PHP",
	ext: "clock.php",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["<?php", "pp"]));
		L.push(line(""));
		L.push(line(["$clock", "var"], " ", ["=", "pun"], " ["));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", ['"' + f[i].name + '"', "str"], " ", ["=>", "pun"], " ", valueTok(f[i]), [",", "pun"]));
		}
		L.push(line(["];", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "Go",
	ext: "clock.go",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i, last;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["package", "key"], " ", ["main", "var"]));
		L.push(line(""));
		L.push(line(["type", "key"], " ", ["Clock", "typ"], " ", ["struct", "key"], " {"));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", [cap(f[i].name), "var"], " ", [f[i].type === "str" ? "string" : "int", "typ"]));
		}
		L.push(line(["}", "pun"]));
		L.push(line(""));
		L.push(line(["var", "key"], " ", ["clock", "var"], " ", ["=", "pun"], " ", ["Clock", "typ"], "{"));
		last = f.length - 1;
		for (i = 0; i < f.length; i++) {
			if (i === last) {
				L.push(line("    ", [cap(f[i].name), "var"], [":", "pun"], " ", valueTok(f[i])));
			} else {
				L.push(line("    ", [cap(f[i].name), "var"], [":", "pun"], " ", valueTok(f[i]), [",", "pun"]));
			}
		}
		L.push(line(["}", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "Kotlin",
	ext: "Clock.kt",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i;
		if (cfg.showComment) L.push(commentLine("// ", T.comment));
		L.push(line(["data", "key"], " ", ["class", "key"], " ", ["Clock", "typ"], "("));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", ["val", "key"], " ", [f[i].name, "var"], [":", "pun"], " ", [f[i].type === "str" ? "String" : "Int", "typ"], [",", "pun"]));
		}
		L.push(line([")", "pun"]));
		L.push(line(""));
		L.push(line(["val", "key"], " ", ["clock", "var"], " ", ["=", "pun"], " ", ["Clock", "typ"], "("));
		for (i = 0; i < f.length; i++) {
			L.push(line("    ", [f[i].name, "var"], " ", ["=", "pun"], " ", valueTok(f[i]), [",", "pun"]));
		}
		L.push(line([")", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(commentLine("// ", T.commentBottom));
		return L;
	}
});

LANG.push({
	name: "Wolfram",
	ext: "Clock.nb",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i, last;
		if (cfg.showComment) L.push(line(["(* " + T.comment + " *)", "com"]));
		L.push(line(["clock", "var"], " ", ["=", "pun"], " ", ["<|", "pun"]));
		last = f.length - 1;
		for (i = 0; i < f.length; i++) {
			if (i === last) {
				L.push(line("    ", ['"' + f[i].name + '"', "str"], " ", ["->", "pun"], " ", valueTok(f[i])));
			} else {
				L.push(line("    ", ['"' + f[i].name + '"', "str"], " ", ["->", "pun"], " ", valueTok(f[i]), [",", "pun"]));
			}
		}
		L.push(line(["|>;", "pun"]));
		if (cfg.showComment && T.commentBottom) L.push(line(["(* " + T.commentBottom + " *)", "com"]));
		return L;
	}
});

LANG.push({
	name: "MATLAB",
	ext: "clock.m",
	render: function (T, cfg) {
		var L = [], f = fieldList(T, cfg), i, last;
		if (cfg.showComment) L.push(commentLine("% ", T.comment));
		L.push(line(["clock", "var"], " ", ["=", "pun"], " ", ["struct", "fn"], "(", ["...", "pun"]));
		last = f.length - 1;
		for (i = 0; i < f.length; i++) {
			var val = f[i].type === "str" ? strTokSql(f[i].v) : numTok(f[i].v);
			if (i === last) {
				L.push(line("    ", ["'" + f[i].name + "'", "str"], [",", "pun"], " ", val, [");", "pun"]));
			} else {
				L.push(line("    ", ["'" + f[i].name + "'", "str"], [",", "pun"], " ", val, [",", "pun"], " ", ["...", "pun"]));
			}
		}
		if (cfg.showComment && T.commentBottom) L.push(commentLine("% ", T.commentBottom));
		return L;
	}
});
