/* ============================================================================
 * CodeClock · settings.js
 * 浏览器模式设置持久化 + 颜色格式转换工具。
 *
 * 属性定义 PROP_DEFS（project.json 的镜像）在 js/propdefs.js 中维护，
 * 加载顺序：propdefs.js → settings.js。直接以 file:// 打开本地 index.html
 * 时无法请求 project.json，PROP_DEFS 兜底；部署到 http(s) 环境后会自动
 * 拉取 project.json 获取最新定义 —— 新增/修改属性只需改 project.json，
 * 侧边栏会自动同步。
 * ============================================================================ */
var CodeClockSettings = (function () {
	"use strict";
	var LS_KEY = "codeclock.settings.v1";

	// localStorage 可用性探测（隐私模式 / file:// 下可能被禁用）
	var storageOK = false;
	try {
		var t = "__cc_test__";
		window.localStorage.setItem(t, t);
		window.localStorage.removeItem(t);
		storageOK = true;
	} catch (e) {
		storageOK = false;
	}

	// ============================ 配置读写 ============================

	// 收集所有非文本属性的默认值（type=text 的仅为分组标题，无 value）
	function defaults() {
		var d = {}, k;
		for (k in PROP_DEFS) {
			if (PROP_DEFS[k].type !== "text" && PROP_DEFS[k].value !== undefined) {
				d[k] = PROP_DEFS[k].value;
			}
		}
		return d;
	}

	// 从 localStorage 读取已保存配置（无 / 损坏 / 存储不可用 → null）
	function readSaved() {
		if (!storageOK) return null;
		try {
			var v = JSON.parse(window.localStorage.getItem(LS_KEY));
			return v && typeof v === "object" ? v : null;
		} catch (e) {
			return null;
		}
	}

	// 载入配置：默认值打底，再把已保存的项覆盖上去（未保存的项保持默认）
	function load() {
		var d = defaults();
		var saved = readSaved();
		if (!saved) return d;
		for (var k in d) {
			if (saved[k] !== undefined) d[k] = saved[k];
		}
		return d;
	}

	// 持久化配置（存储不可用时静默跳过）
	function save(flat) {
		if (!storageOK) return;
		try {
			window.localStorage.setItem(LS_KEY, JSON.stringify(flat));
		} catch (e) {
			/* 配额满 / 隐私模式下静默失败：仅影响持久化，不影响本次会话 */
		}
	}

	// 扁平配置 → WE 属性形态 { Key: { value: v } }（浏览器模式借用 applyProps 入口）
	function toWeProps(flat) {
		var out = {}, k;
		for (k in flat) out[k] = { value: flat[k] };
		return out;
	}

	// WE 属性形态 → 扁平配置 { Key: v }
	function fromWeProps(properties) {
		var flat = {}, k;
		for (k in properties) {
			if (properties[k] && properties[k].value !== undefined) flat[k] = properties[k].value;
		}
		return flat;
	}

	// 拉取 project.json 的最新属性定义覆盖 PROP_DEFS（fetch 不可用 / 解析失败 / 结构不对 → 回退内置定义）
	function fetchDefs(cb) {
		function done(ok) {
			if (cb) cb(ok);
		}
		if (typeof fetch !== "function") {
			done(false);
			return;
		}
		// 应用 project.json 的 general.properties（仅接受带 type 的有效定义）
		function applyProject(pj) {
			var props = pj && pj.general && pj.general.properties;
			if (!props) {
				done(false);
				return;
			}
			for (var k in props) {
				if (props[k] && props[k].type) PROP_DEFS[k] = props[k];
			}
			done(true);
		}
		try {
			fetch("project.json")
				.then(function (r) { return r.json(); })
				.then(applyProject)
				.catch(function () { done(false); });
		} catch (e) {
			done(false);
		}
	}

	// ============================ 颜色工具 ============================
	// WE 颜色格式为 "R G B"（0~1 浮点、空格分隔）；浏览器控件需要 #RRGGBB，二者互转

	// 单分量 "0.35" → 0~255 整数（非数值按 0，越界夹紧）
	function chanToByte(x) {
		var n = parseFloat(x);
		if (!isFinite(n)) n = 0;
		return Math.round(Math.max(0, Math.min(1, n)) * 255);
	}

	// 两位十六进制 → 0~1 浮点
	function hex2ToChan(h) {
		return parseInt(h, 16) / 255;
	}

	// 0~255 整数 → 两位十六进制
	function byteToHex(n) {
		return ("0" + Math.round(n).toString(16)).slice(-2);
	}

	// WE 颜色字符串 → [r,g,b]（0~255；不足 3 个分量按黑色处理）
	function weToRgb(v) {
		var a = String(v).split(" ");
		if (a.length < 3) return [0, 0, 0];
		return [chanToByte(a[0]), chanToByte(a[1]), chanToByte(a[2])];
	}

	// WE 颜色字符串 → "#RRGGBB"
	function weToHex(v) {
		var c = weToRgb(v);
		return "#" + byteToHex(c[0]) + byteToHex(c[1]) + byteToHex(c[2]);
	}

	// "#RRGGBB"（或 #RGB 缩写）→ WE 颜色字符串 "R G B"
	function hexToWe(h) {
		var s = String(h).replace("#", "");
		if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
		return hex2ToChan(s.slice(0, 2)) + " " + hex2ToChan(s.slice(2, 4)) + " " + hex2ToChan(s.slice(4, 6));
	}

	// WE 颜色字符串 → [r,g,b]（main.js 拼 rgba() 用）
	function parseColor(v) {
		return weToRgb(v);
	}

	return {
		defs: PROP_DEFS,
		defaults: defaults,
		load: load,
		save: save,
		toWeProps: toWeProps,
		fromWeProps: fromWeProps,
		fetchDefs: fetchDefs,
		weToHex: weToHex,
		hexToWe: hexToWe,
		parseColor: parseColor
	};
})();
