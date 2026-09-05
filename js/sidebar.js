/* ============================================================================
 * CodeClock · sidebar.js
 * 浏览器模式右侧控制面板：由 project.json 属性定义动态生成控件。
 * 仅普通浏览器环境使用；壁纸引擎模式（body.in-we）下由 CSS 隐藏。
 *
 * 【实现要点】
 *   - 控件由 CodeClockSettings.defs（PROP_DEFS）驱动渲染，condition 决定显隐
 *   - 事件采用“委托”绑定在根容器上：render() 重建 innerHTML 后监听依然有效，
 *     只需在 init 时绑一次，避免每次重绘都给几十个控件重复 addEventListener
 *   - change 事件统一入口 onControlChange：按 target 分流到 控件/预设/导入 三类
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
	var bound = false;

	// localStorage 读取（JSON 解析失败返回默认值 d）
	function storageGet(k, d) {
		try {
			var v = window.localStorage.getItem(k);
			return v === null ? d : JSON.parse(v);
		} catch (e) {
			return d;
		}
	}

	// localStorage 写入（配额满 / 隐私模式下静默失败）
	function storageSet(k, v) {
		try {
			window.localStorage.setItem(k, JSON.stringify(v));
		} catch (e) {
			/* 存储不可用时静默失败：仅影响持久化，不影响本次会话 */
		}
	}

	function esc(s) {
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	// 从属性定义的 text 字段提取第一行纯文本作为控件标签
	function labelOf(def) {
		var t = String(def.text || "");
		t = t.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
		var lines = t.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
		return lines[0] || "";
	}

	// ============================ 条件求值 ============================

	// 条件右侧字面量 → 实际比较值（true/false/字符串/数字）
	function wantedValue(m) {
		if (m[3] === "true") return true;
		if (m[3] === "false") return false;
		if (m[4] !== undefined) return m[4];
		return parseFloat(m[3]);
	}

	// 单个条件片段 "Name.value == 2" / "!= true" 是否成立（剥掉括号后正则匹配）
	// 返回 false 的情况：不匹配（含无法解析的写法，按不成立处理）
	function matchCondition(part, flat) {
		var m = String(part).replace(/[()]/g, "")
			.match(/([A-Za-z_][A-Za-z0-9_]*).value\s*(==|!=)\s*(true|false|"([^"]*)"|\d+(?:\.\d+)?)/);
		if (!m) return false;
		var eq = flat[m[1]] === wantedValue(m);
		return m[2] === "==" ? eq : !eq;
	}

	// 一个 and 分组内所有条件都成立才返回 true
	function andGroupOk(andParts, flat) {
		for (var j = 0; j < andParts.length; j++) {
			if (!matchCondition(andParts[j], flat)) return false;
		}
		return true;
	}

	// 复合条件求值：支持 "&&" 与 "||"（|| 优先级最低，任一 or 分支内全部 and 成立即显示）
	function evalCondition(cond, flat) {
		if (!cond) return true;
		var orParts = String(cond).split("||");
		for (var i = 0; i < orParts.length; i++) {
			if (andGroupOk(orParts[i].split("&&"), flat)) return true;
		}
		return false;
	}

	// ============================ 控件生成 ============================

	// 按属性定义生成控件 HTML（bool/combo/slider/color/textinput）
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
				// range + number 双输入联动，二者都带 data-cc
				return '<div class="cc-slider"><input type="range" data-cc="' + name + '" min="' + def.min + '" max="' + def.max + '" step="1" value="' + v + '"/><input type="number" class="cc-num" data-cc="' + name + '" min="' + def.min + '" max="' + def.max + '" step="1" value="' + v + '"/></div>';
			case "color":
				return '<input type="color" data-cc="' + name + '" value="' + CodeClockSettings.weToHex(v) + '"/>';
			case "textinput":
				return '<input type="text" data-cc="' + name + '" value="' + esc(v) + '"/>';
			default:
				return "";
		}
	}

	// 预设下拉框 HTML（“默认方案” + 用户保存的预设，按名称排序）
	function presetSelectHtml() {
		var presets = storageGet(presetsKey, {});
		var html = '<select id="cc-preset-select"><option value="__default">默认方案</option>';
		var names = Object.keys(presets).sort();
		for (var i = 0; i < names.length; i++) {
			html += '<option value="' + esc(names[i]) + '">' + esc(names[i]) + "</option>";
		}
		return html + "</select>";
	}

	// 整面板渲染：按 order 排序 → 分组标题 / 条件显隐 / 控件 → 预设区
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
		restorePendingSelect();
	}

	// ============================ 数值应用 ============================

	// 写入单个值并通知主逻辑（onChange → applyProps → render）
	function applyValue(name, value) {
		currentFlat[name] = value;
		if (onChange) onChange(currentFlat);
	}

	// 整体替换配置（预设切换/恢复默认用）并重绘面板
	function applyValueAll(flat) {
		currentFlat = flat;
		if (onChange) onChange(currentFlat);
		render(currentFlat);
	}

	// ============================ 事件处理（委托） ============================

	// ---- 滑杆（range + number 双输入联动）----

	// 把数值夹紧到滑杆范围内
	function clampSlider(n, def) {
		return Math.min(def.max, Math.max(def.min, n));
	}

	// number 输入联动：input 时仅同步 range（保留用户输入）；change 时非法回退默认值并夹紧回写
	function applyNumInput(numEl, def, name, commit) {
		var n = parseFloat(numEl.value);
		if (isNaN(n)) {
			if (!commit) return;
			n = parseFloat(def.value);
		}
		n = clampSlider(n, def);
		var range = numEl.parentNode.querySelector('input[type="range"]');
		if (range) range.value = n;
		if (commit) numEl.value = n;
		applyValue(name, n);
	}

	// range 拖动联动：同步 number 显示并应用
	function applyRangeInput(rangeEl, def, name) {
		var num = rangeEl.parentNode.querySelector(".cc-num");
		if (num) num.value = rangeEl.value;
		applyValue(name, parseFloat(rangeEl.value));
	}

	// input 事件（拖动/打字过程中实时触发）：仅滑杆需要联动
	function onControlInput(e) {
		var el = e.target;
		var name = el.getAttribute && el.getAttribute("data-cc");
		var def = name && CodeClockSettings.defs[name];
		if (!def || def.type !== "slider") return;
		if (el.classList.contains("cc-num")) applyNumInput(el, def, name, false);
		else applyRangeInput(el, def, name);
	}

	// 各类型控件的 change 处理（写入 currentFlat 并回调主逻辑）
	var CHANGE_APPLY = {
		bool: function (el, def, name) { applyValue(name, el.checked); },
		combo: function (el, def, name) { applyValue(name, parseInt(el.value, 10)); },
		color: function (el, def, name) { applyValue(name, CodeClockSettings.hexToWe(el.value)); },
		textinput: function (el, def, name) { applyValue(name, el.value); },
		slider: function (el, def, name) {
			if (el.classList.contains("cc-num")) applyNumInput(el, def, name, true);
			else applyValue(name, parseFloat(el.value));
		}
	};

	// change 事件统一入口：预设下拉 / 导入文件 / 普通控件 三类分流
	// 普通控件变更后必须 render()：condition 依赖的开关变化时要及时显隐子选项
	function onControlChange(e) {
		var el = e.target;
		if (el.id === "cc-preset-select") {
			onPresetChange(el);
			return;
		}
		if (el.id === "cc-import-file") {
			onImportFile(el);
			return;
		}
		var name = el.getAttribute && el.getAttribute("data-cc");
		var def = name && CodeClockSettings.defs[name];
		if (!def) return;
		var apply = CHANGE_APPLY[def.type];
		if (apply) apply(el, def, name);
		render(currentFlat);
	}

	// ---- 预设与导入/导出 ----

	// 预设下拉切换：__default = 恢复默认；否则载入该预设（叠加到默认之上，未保存的项保持默认）
	function onPresetChange(sel) {
		var name = sel.value;
		pendingSelect = name;
		if (name === "__default") {
			applyValueAll(CodeClockSettings.defaults());
			return;
		}
		var presets = storageGet(presetsKey, {});
		var merged = CodeClockSettings.defaults();
		if (presets[name]) {
			for (var k in presets[name]) merged[k] = presets[name][k];
		}
		applyValueAll(merged);
	}

	// 导入预设：读 JSON 文件 → 存入预设列表 → 应用（解析失败弹窗提示）
	function onImportFile(file) {
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
				}
			} catch (err) {
				alert("导入失败：JSON 格式错误");
			}
		};
		reader.readAsText(f);
		file.value = "";
	}

	// 保存当前配置为预设
	function doSave() {
		var name = prompt("预设名称：");
		if (!name) return;
		var presets = storageGet(presetsKey, {});
		presets[name] = JSON.parse(JSON.stringify(currentFlat));
		storageSet(presetsKey, presets);
		pendingSelect = name;
		render(currentFlat);
	}

	// 删除当前选中的预设（默认方案不可删）
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

	// 导出当前配置为 JSON 文件下载
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

	// 预设操作按钮分发
	var ACTIONS = {
		save: doSave,
		"delete": doDelete,
		export: doExport,
		import: function () {
			var file = document.getElementById("cc-import-file");
			if (file) file.click();
		}
	};

	// 操作按钮点击（委托）
	function onActionClick(e) {
		var act = e.target.getAttribute && e.target.getAttribute("data-cc-act");
		if (act && ACTIONS[act]) ACTIONS[act]();
	}

	// render 重建 DOM 后恢复预设下拉的选中项（doSave/导入/切换后面板会重绘）
	function restorePendingSelect() {
		if (!pendingSelect) return;
		var sel = document.getElementById("cc-preset-select");
		if (sel) sel.value = pendingSelect;
		pendingSelect = null;
	}

	// 事件绑定（委托，仅 init 时绑一次；innerHTML 重建不影响委托监听）
	function bindEvents() {
		if (bound) return;
		bound = true;
		root.addEventListener("input", onControlInput);
		root.addEventListener("change", onControlChange);
		root.addEventListener("click", onActionClick);
	}

	// ============================ 初始化 ============================

	// 入口：取 DOM → 折叠状态恢复 → 绑定事件 → 首次渲染
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
		bindEvents();
		render(flat);
	}

	return {
		init: init,
		render: render,
		refresh: render
	};
})();
