/* ============================================================================
 * CodeClock · sidebar.js
 * 浏览器模式右侧控制面板：由 project.json 属性定义动态生成控件。
 * 仅普通浏览器环境使用；壁纸引擎模式（body.in-we）下由 CSS 隐藏。
 * ============================================================================ */

var CodeClockSidebar = (function () {
	"use strict";
	var root = null;
	var toggleBtn = null;
	var presetsKey = "codeclock.presets.v1";
	var collapsedKey = "codeclock.sidebar.collapsed";
	var currentFlat = null;
	var onChange = null;
	var pendingSelect = null;

	function storageGet(k, d) {
		try {
			var v = window.localStorage.getItem(k);
			return v === null ? d : JSON.parse(v);
		} catch (e) {
			return d;
		}
	}
	function storageSet(k, v) {
		try {
			window.localStorage.setItem(k, JSON.stringify(v));
		} catch (e) {}
	}

	function esc(s) {
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function labelOf(def) {
		var t = String(def.text || "");
		t = t.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
		var lines = t.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
		return lines[0] || "";
	}

	function evalCondition(cond, flat) {
		if (!cond) return true;
		var parts = String(cond).split("&&"), i;
		for (i = 0; i < parts.length; i++) {
			var m = parts[i].match(/([A-Za-z_][A-Za-z0-9_]*)\.value\s*==\s*(true|false|"([^"]*)"|\d+(?:\.\d+)?)/);
			if (!m) continue;
			var val = flat[m[1]];
			var want;
			if (m[2] === "true") want = true;
			else if (m[2] === "false") want = false;
			else if (m[3] !== undefined) want = m[3];
			else want = parseFloat(m[2]);
			if (val !== want) return false;
		}
		return true;
	}

	function controlFor(name, def, flat) {
		var v = flat[name];
		switch (def.type) {
			case "bool":
				return '<input type="checkbox" data-cc="' + name + '"' + (v ? " checked" : "") + "/>";
			case "combo":
				var html = '<select data-cc="' + name + '">';
				for (var i = 0; i < (def.options || []).length; i++) {
					var o = def.options[i];
					html += '<option value="' + o.value + '"' + (String(o.value) === String(v) ? " selected" : "") + ">" + esc(o.label) + "</option>";
				}
				return html + "</select>";
			case "slider":
				return '<div class="cc-slider"><input type="range" data-cc="' + name + '" min="' + def.min + '" max="' + def.max + '" step="1" value="' + v + '"/><input type="number" class="cc-num" data-cc="' + name + '" min="' + def.min + '" max="' + def.max + '" step="1" value="' + v + '"/></div>';
			case "color":
				return '<input type="color" data-cc="' + name + '" value="' + CodeClockSettings.weToHex(v) + '"/>';
			case "textinput":
				return '<input type="text" data-cc="' + name + '" value="' + esc(v) + '"/>';
			default:
				return "";
		}
	}

	function presetSelectHtml() {
		var presets = storageGet(presetsKey, {});
		var html = '<select id="cc-preset-select"><option value="__default">默认方案</option>';
		var names = Object.keys(presets).sort();
		for (var i = 0; i < names.length; i++) {
			html += '<option value="' + esc(names[i]) + '">' + esc(names[i]) + "</option>";
		}
		return html + "</select>";
	}

	function render(flat) {
		currentFlat = flat;
		var defs = CodeClockSettings.defs;
		var keys = Object.keys(defs).sort(function (a, b) {
			return (defs[a].order || 0) - (defs[b].order || 0);
		});
		var scroll = root.scrollTop;
		var html = "";
		html += '<div class="cc-head"><span class="cc-title">CodeClock · 设置</span><span class="cc-hint">浏览器模式</span></div>';
		for (var i = 0; i < keys.length; i++) {
			var k = keys[i], d = defs[k];
			if (k === "schemecolor") continue;
			if (d.type === "text") {
				html += '<div class="cc-group">' + d.text + "</div>";
				continue;
			}
			if (!evalCondition(d.condition, flat)) continue;
			var lbl = labelOf(d);
			html += '<div class="cc-row" data-prop="' + k + '">';
			if (lbl) html += '<label class="cc-label">' + esc(lbl) + "</label>";
			html += controlFor(k, d, flat);
			html += "</div>";
		}
		html += '<div class="cc-presets">';
		html += '<div class="cc-label">配置预设</div>';
		html += presetSelectHtml();
		html += '<div class="cc-btns">';
		html += '<button data-cc-act="save">保存</button>';
		html += '<button data-cc-act="delete">删除</button>';
		html += '<button data-cc-act="export">导出</button>';
		html += '<button data-cc-act="import">导入</button>';
		html += "</div>";
		html += '<input type="file" id="cc-import-file" accept=".json" style="display:none"/>';
		html += "</div>";
		root.innerHTML = html;
		root.scrollTop = scroll;
		bindEvents();
	}

	function applyValue(name, value) {
		currentFlat[name] = value;
		if (onChange) onChange(currentFlat);
	}

	function bindEvents() {
		var inputs = root.querySelectorAll("[data-cc]");
		for (var i = 0; i < inputs.length; i++) {
			inputs[i].addEventListener("input", function (e) {
				var el = e.target;
				var name = el.getAttribute("data-cc");
				var def = CodeClockSettings.defs[name];
				if (!def) return;
				if (def.type === "slider") {
					if (el.classList.contains("cc-num")) {
						var n = parseFloat(el.value);
						if (!isNaN(n)) {
							var range = el.parentNode.querySelector('input[type="range"]');
							if (range) range.value = Math.min(def.max, Math.max(def.min, n));
							applyValue(name, Math.min(def.max, Math.max(def.min, n)));
						}
					} else {
						var num = el.parentNode.querySelector(".cc-num");
						if (num) num.value = el.value;
						applyValue(name, parseFloat(el.value));
					}
				}
			});
			inputs[i].addEventListener("change", function (e) {
				var el = e.target;
				var name = el.getAttribute("data-cc");
				var def = CodeClockSettings.defs[name];
				if (!def) return;
				if (def.type === "bool") applyValue(name, el.checked);
				else if (def.type === "combo") applyValue(name, parseInt(el.value, 10));
				else if (def.type === "color") applyValue(name, CodeClockSettings.hexToWe(el.value));
				else if (def.type === "textinput") applyValue(name, el.value);
				else if (def.type === "slider") {
					if (el.classList.contains("cc-num")) {
						var n = parseFloat(el.value);
						if (isNaN(n)) n = parseFloat(def.value);
						n = Math.min(def.max, Math.max(def.min, n));
						var range = el.parentNode.querySelector('input[type="range"]');
						if (range) range.value = n;
						el.value = n;
						applyValue(name, n);
					} else {
						applyValue(name, parseFloat(el.value));
					}
				}
				render(currentFlat);
			});
		}
		var btns = root.querySelectorAll("[data-cc-act]");
		for (var j = 0; j < btns.length; j++) {
			btns[j].addEventListener("click", function (e) {
				var act = e.target.getAttribute("data-cc-act");
				if (act === "save") doSave();
				else if (act === "delete") doDelete();
				else if (act === "export") doExport();
				else if (act === "import") document.getElementById("cc-import-file").click();
			});
		}
		var sel = document.getElementById("cc-preset-select");
		if (sel) {
			if (pendingSelect) {
				sel.value = pendingSelect;
				pendingSelect = null;
			}
			sel.addEventListener("change", function () {
				var name = sel.value;
				pendingSelect = name;
				if (name === "__default") {
					applyValueAll(CodeClockSettings.defaults());
				} else {
					var presets = storageGet(presetsKey, {});
					var merged = CodeClockSettings.defaults();
					for (var k in presets[name]) merged[k] = presets[name][k];
					applyValueAll(merged);
				}
			});
		}
		var file = document.getElementById("cc-import-file");
		if (file) {
			file.addEventListener("change", function () {
				var f = file.files[0];
				if (!f) return;
				var reader = new FileReader();
				reader.onload = function () {
					try {
						var data = JSON.parse(reader.result);
						if (data && typeof data === "object") {
							var presets = storageGet(presetsKey, {});
							var pname = f.name.replace(/\.json$/i, "") || "导入方案";
							presets[pname] = data;
							storageSet(presetsKey, presets);
							pendingSelect = pname;
							applyValueAll(data);
							render(currentFlat);
						}
					} catch (err) {
						alert("导入失败：JSON 格式错误");
					}
				};
				reader.readAsText(f);
				file.value = "";
			});
		}
	}

	function applyValueAll(flat) {
		currentFlat = flat;
		if (onChange) onChange(currentFlat);
		render(currentFlat);
	}

	function doSave() {
		var name = prompt("预设名称：");
		if (!name) return;
		var presets = storageGet(presetsKey, {});
		presets[name] = JSON.parse(JSON.stringify(currentFlat));
		storageSet(presetsKey, presets);
		pendingSelect = name;
		render(currentFlat);
	}

	function doDelete() {
		var sel = document.getElementById("cc-preset-select");
		if (!sel) return;
		var name = sel.value;
		if (name === "__default") {
			alert("默认方案不可删除");
			return;
		}
		var presets = storageGet(presetsKey, {});
		delete presets[name];
		storageSet(presetsKey, presets);
		pendingSelect = "__default";
		applyValueAll(CodeClockSettings.defaults());
	}

	function doExport() {
		var blob = new Blob([JSON.stringify(currentFlat, null, 2)], { type: "application/json" });
		var a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = "codeclock-settings.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
	}

	function init(flat, onChangeCb) {
		root = document.getElementById("sidebar");
		toggleBtn = document.getElementById("sidebar-toggle");
		onChange = onChangeCb;
		if (toggleBtn) {
			toggleBtn.addEventListener("click", function () {
				var collapsed = root.classList.toggle("cc-collapsed");
				storageSet(collapsedKey, collapsed);
			});
			if (storageGet(collapsedKey, false)) root.classList.add("cc-collapsed");
		}
		render(flat);
	}

	return {
		init: init,
		render: render,
		refresh: render
	};
})();
