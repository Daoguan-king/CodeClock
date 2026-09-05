(function () {
	"use strict";

/* ============================================================================
 * CodeClock · main.js 主逻辑
 * ----------------------------------------------------------------------------
 * 【职责】
 *   1. 时钟渲染：buildTime() 计算时间 → LANG 语言模板渲染 token 行 → render() 生成 HTML
 *   2. 参数接收：applyProps()（壁纸引擎属性面板 / 浏览器侧边栏共用同一入口，
 *      属性名 → state 字段的映射集中在 PROP_MAP，新增属性只需在此登记）
 *   3. 音乐律动：双 API 适配（wallpaperRegisterAudioListener 经典回调 +
 *      wallpaperAudioListener.onAudioLevelsAvailable 对象式）→ ingestAudio() 归一化
 *      → audioTick() rAF 插值 → applyMusicVisuals() 每帧写样式
 *   4. 特效：整点弹跳 + 背景闪烁、语言/主题切换时的“形变”缩放动画
 *   5. 双模式：壁纸引擎（WE API，侧边栏隐藏）/ 普通浏览器（侧边栏 + localStorage + 右键菜单）
 *
 * 【两个循环】
 *   - tick()：setInterval 250ms 轮询，内容签名变化才重绘（实际每秒最多一次）
 *   - audioTick()：requestAnimationFrame 每帧插值并写视觉（≈60fps 顺滑）
 *
 * 【性能要点】
 *   - 音频回调（≈16Hz）内只算数据，绝不操作 DOM；视觉写入全部在 rAF 循环中
 *   - render() 会重建整个 innerHTML，代价大，禁止在音频回调中调用
 * ============================================================================ */

	var MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var WD_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var WD_ABBR_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var WD_CN = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
	var WD_ABBR_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

	var FONTS = [
		["'CCJetBrainsMono', monospace", "JetBrains Mono"],
		["'CCFiraCode', monospace", "Fira Code"],
		["'CCUbuntuMono', monospace", "Ubuntu Mono"],
		["'CCNotoSansMono', monospace", "Noto Sans Mono CJK SC"],
		["'CCIBMPlexMono', monospace", "IBM Plex Mono"],
		["'CCSourceCodePro', monospace", "Source Code Pro"],
		["", "自定义字体…"]
	];

	// WE 属性名 → state 字段映射（applyProps 据此批量写入；新增属性只需在此加一行）
	var PROP_MAP = {
		Language: "language",
		Theme: "theme",
		SyntaxHighlight: "highlight",
		LineNumbers: "lineNumbers",
		TitleBar: "titleBar",
		ShowComment: "showComment",
		CursorBlink: "cursorBlink",
		Use24Hour: "use24",
		ShowSeconds: "showSeconds",
		ShowDate: "showDate",
		MonthFormat: "monthFormat",
		ShowWeekday: "showWeekday",
		WeekdayLang: "wdLang",
		ShowPeriod: "showPeriod",
		PeriodStyle: "periodStyle",
		DateFormat: "dateFormat",
		DateFormatCustom: "dateFormatCustom",
		FontFamily: "fontFamily",
		FontCustom: "fontCustom",
		FontSize: "fontSize",
		PositionX: "posX",
		PositionY: "posY",
		Opacity: "opacity",
		BackgroundMode: "bgMode",
		BackgroundColor: "bgColor",
		GlowEnabled: "glowEnabled",
		GlowMode: "glowMode",
		GlowColor: "glowColor",
		GlowIntensity: "glowIntensity",
		HourBounce: "hourBounce",
		HourFlash: "hourFlash",
		MusicSync: "musicSync",
		MusicSyncMode: "musicSyncMode",
		MusicBand: "musicBand",
		MusicBandLow: "musicBandLow",
		MusicBandHigh: "musicBandHigh",
		MusicSensitivity: "musicSensitivity",
		MusicSmooth: "musicSmooth",
		MusicBeatStyle: "musicBeatStyle",
		MusicBeatThreshold: "musicBeatThreshold",
		MusicColorStyle: "musicColorStyle",
		MusicGlowMin: "musicGlowMin",
		MusicGlowMax: "musicGlowMax",
		MusicBodyStyle: "musicBodyStyle",
		MusicBodyStrength: "musicBodyStrength",
		MusicIdle: "musicIdle",
		MusicDemo: "musicDemo",
		BottomComment: "commentBottom"
	};

	// 预设响应频段表（MusicBand 1~4）：[低界, 高界]，逻辑频段 1~63；5=自定义另算
	var BAND_PRESETS = { 1: [1, 8], 2: [9, 25], 3: [26, 63], 4: [1, 63] };

	// 无光晕时的基础阴影（所有样式路径共用，保证视觉一致）
	var SHADOW_BASE = "0 12px 40px rgba(0,0,0,.38)";

	// state：全部运行参数（默认值与 project.json 的 value 一一对应；外部改动经 applyProps 写入）
	var state = {
		language: 1,
		theme: 2,
		highlight: true,
		lineNumbers: true,
		titleBar: true,
		showComment: true,
		cursorBlink: true,
		use24: false,
		showSeconds: true,
		showDate: true,
		monthFormat: 1,
		showWeekday: true,
		wdLang: 1,
		showPeriod: true,
		periodStyle: 1,
		dateFormat: 12,
		dateFormatCustom: "YYYY-MM-DD",
		commentBottom: "CodeClock · everything is customizable",
		fontFamily: 1,
		fontCustom: "Microsoft YaHei",
		fontSize: 30,
		posX: 50,
		posY: 50,
		opacity: 100,
		bgMode: 1,
		bgColor: "0.07 0.09 0.12",
		glowEnabled: true,
		glowMode: 1,
		glowColor: "0.35 0.6 1",
		glowIntensity: 35,
		hourBounce: true,
		hourFlash: true,
		musicSync: false,
		musicSyncMode: 1,
		musicBand: 1,
		musicBandLow: 1,
		musicBandHigh: 20,
		musicSensitivity: 100,
		musicSmooth: 30,
		musicBeatStyle: 1,
		musicBeatThreshold: 40,
		musicColorStyle: 1,
		musicGlowMin: 0,
		musicGlowMax: 100,
		musicBodyStyle: 1,
		musicBodyStrength: 50,
		musicIdle: true,
		musicDemo: false
	};

	// DOM 元素引用与运行期状态
	var editorEl, wrapEl, bounceEl, titleEl, tabEl, gutterEl, codeEl;
	var timer = null;
	var paused = false;
	var lastSig = "";
	var morphUntil = 0;
	var flashTimer = null;
	var lastHourKey = null;
	// ---- 音乐律动运行期状态 ----
	// audioData：最近一帧原始音频数据（raw=选定频段能量 0~1, pulse=节拍强度, low/mid/high=三分频, t=时间戳）
	// audioCur.energy：经 attack/decay 插值平滑后的“显示能量”（0~1），所有视觉都基于它
	// audioRaf：rAF 循环句柄；beatFlashAt：节拍闪烁触发时刻；musicVisualOn：音乐层是否正在接管样式
	var audioData = { raw: 0, pulse: 0, low: 0, mid: 0, high: 0, t: 0 };
	var audioCur = { energy: 0 };
	var audioRaf = null;
	var beatFlashAt = 0;
	var musicVisualOn = false;

	// ============================ 基础工具 ============================

	// 取元素快捷方式
	function byId(id) {
		return document.getElementById(id);
	}

	// HTML 转义：所有文本进 innerHTML 前必须过这里
	function esc(s) {
		return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	// "#RRGGBB"（或 3 位缩写）→ [r,g,b] 数组
	function hexToRgb(hex) {
		var h = String(hex).replace("#", "");
		if (h.length === 3) {
			h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
		}
		return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
	}

	// 当前光晕颜色 RGB：自定义模式取 GlowColor，否则取主题 glow
	function getGlowRgb() {
		if (state.glowMode === 2) {
			return CodeClockSettings.parseColor(state.glowColor);
		}
		return hexToRgb(THEMES[state.theme - 1].glow);
	}

	// 数字补零到两位
	function pad2(n) {
		return (n < 10 ? "0" : "") + n;
	}

	// 12 小时制的当前小时（0 点与 12 点均显示 12）
	function hour12(h24) {
		return h24 % 12 === 0 ? (h24 < 12 ? 0 : 12) : h24 % 12;
	}

	// 颜色向白色提亮 t（0~1）：节拍闪烁用
	function towardWhite(rgb, t) {
		return [
			Math.min(255, rgb[0] + (255 - rgb[0]) * t),
			Math.min(255, rgb[1] + (255 - rgb[1]) * t),
			Math.min(255, rgb[2] + (255 - rgb[2]) * t)
		];
	}

	// ============================ 日期/时间格式化 ============================

	// 日期格式预设模板（下标对应 DateFormat.value 1~13；14 RFC3339UTC / 15 UNIX / 16 asctime 为特例，在 fmtTimeText 单独处理）
	var DATE_FMT = [
		"",
		"YYYY-MM-DD",
		"DD-MM-YYYY",
		"MM-DD-YYYY",
		"YYYY/MM/DD",
		"DD/MM/YYYY",
		"MM/DD/YYYY",
		"YYYY.MM.DD",
		"YYYY年MM月DD日",
		"MM月DD日YYYY年",
		"MMMM D, YYYY",
		"MMM D, YYYY",
		"D MMMM YYYY",
		"YYYY-MM-DDTHH:mm:ssZ",
		"RFC3339UTC",
		"X",
		"asctime"
	];

	// 日期/时间 token 模板渲染：把 YYYY/MM/DD/HH:mm:ss/A/a/Z/X 等 token 替换为实际值
	function renderDateTemplate(now, tpl) {
		var h24 = now.getHours();
		var off = -now.getTimezoneOffset();
		var sign = off >= 0 ? "+" : "-";
		off = Math.abs(off);
		var tokens = {
			"YYYY": String(now.getFullYear()),
			"YY": pad2(now.getFullYear() % 100),
			"MMMM": MONTHS_FULL[now.getMonth()],
			"MMM": MONTHS_ABBR[now.getMonth()],
			"MM": pad2(now.getMonth() + 1),
			"M": String(now.getMonth() + 1),
			"DD": pad2(now.getDate()),
			"D": String(now.getDate()),
			"dddd": state.wdLang === 2 ? WD_CN[now.getDay()] : WD_FULL[now.getDay()],
			"ddd": state.wdLang === 2 ? WD_ABBR_CN[now.getDay()] : WD_ABBR_EN[now.getDay()],
			"HH": pad2(h24),
			"H": String(h24),
			"hh": pad2(hour12(h24)),
			"h": String(hour12(h24)),
			"mm": pad2(now.getMinutes()),
			"m": String(now.getMinutes()),
			"ss": pad2(now.getSeconds()),
			"s": String(now.getSeconds()),
			"A": h24 < 12 ? "AM" : "PM",
			"a": h24 < 12 ? "上午" : "下午",
			"Z": sign + pad2(Math.floor(off / 60)) + ":" + pad2(off % 60),
			"X": String(Math.floor(now.getTime() / 1000))
		};
		return tpl.replace(/(YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a|Z|X)/g, function (m) {
			return tokens[m];
		});
	}

	// 生成顶部注释行的日期文本（按 DateFormat 预设或自定义模板）
	function fmtTimeText(now) {
		var id = state.dateFormat;
		var custom = String(state.dateFormatCustom || "").trim();
		if (id === 14) {
			// RFC 3339 UTC：把本地时间平移到 UTC 再格式化
			var u = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
			return u.getUTCFullYear() + "-" + pad2(u.getUTCMonth() + 1) + "-" + pad2(u.getUTCDate()) +
				"T" + pad2(u.getUTCHours()) + ":" + pad2(u.getUTCMinutes()) + ":" + pad2(u.getUTCSeconds()) + "Z";
		}
		if (id === 16) {
			// ANSI C asctime()：Sun Jun 19 08:30:00 2026
			return WD_ABBR_EN[now.getDay()] + " " + MONTHS_ABBR[now.getMonth()] + " " + pad2(now.getDate()) + " " +
				pad2(now.getHours()) + ":" + pad2(now.getMinutes()) + ":" + pad2(now.getSeconds()) + " " + now.getFullYear();
		}
		var tpl = id === 17 ? (custom || "YYYY-MM-DD") : DATE_FMT[id];
		return renderDateTemplate(now, tpl);
	}

	// 当前日期格式是否包含时间字段（含则顶部注释会随秒实时跳动）
	function fmtHasTime() {
		var id = state.dateFormat;
		if (id === 14 || id === 15 || id === 16) return true;
		var tpl = id === 17 ? String(state.dateFormatCustom || "") : DATE_FMT[id];
		return /(HH|H|hh|h|mm|m|ss|s|A|a|X)/.test(tpl);
	}

	// 月份文本（1=全称 2=数字 3=缩写）
	function monthText(monthNum) {
		if (state.monthFormat === 1) return MONTHS_FULL[monthNum - 1];
		if (state.monthFormat === 3) return MONTHS_ABBR[monthNum - 1];
		return String(monthNum);
	}

	// 顶部注释行内容：日期格式含时间 → 直接格式化；否则按 showDate/showWeekday 组合星期与日期
	function buildComment(now) {
		if (fmtHasTime()) return fmtTimeText(now);
		if (state.showDate) {
			var dt = fmtTimeText(now);
			if (!state.showWeekday) return dt;
			return state.wdLang === 2 ? WD_CN[now.getDay()] + " " + dt : WD_FULL[now.getDay()] + ", " + dt;
		}
		if (state.showWeekday) return state.wdLang === 2 ? WD_CN[now.getDay()] : WD_FULL[now.getDay()];
		return "CodeClock · live";
	}

	// 计算当前时间数据 T（已按用户配置换算 12/24h、上下午、月份格式、星期语言、顶部注释），供语言模板使用
	function buildTime() {
		var now = new Date();
		var h24 = now.getHours();
		return {
			hour: state.use24 ? h24 : hour12(h24),
			min: now.getMinutes(),
			sec: now.getSeconds(),
			period: h24 < 12 ? (state.periodStyle === 1 ? "AM" : "上午") : (state.periodStyle === 1 ? "PM" : "下午"),
			weekday: state.wdLang === 2 ? WD_CN[now.getDay()] : WD_FULL[now.getDay()],
			day: now.getDate(),
			month: monthText(now.getMonth() + 1),
			year: now.getFullYear(),
			comment: buildComment(now),
			commentBottom: String(state.commentBottom).replace(/^\s*(\/\/|#|--)\s*/, "").trim()
		};
	}

	// 用户显示开关快照（showComment/showSeconds/showPeriod...），传给语言模板 render(T, cfg)
	function currentCfg() {
		return {
			showComment: state.showComment,
			showSeconds: state.showSeconds,
			showPeriod: !state.use24 && state.showPeriod,
			showDate: state.showDate,
			showWeekday: state.showWeekday,
			wdLang: state.wdLang,
			monthFormat: state.monthFormat
		};
	}

	// ============================ 渲染 ============================

	// 启动时为每套主题生成 .theme-N{--bg:...;--tok-*:...} 的 CSS 变量规则（切换主题只换 className）
	function buildThemeCSS() {
		var css = "", i, t;
		for (i = 0; i < THEMES.length; i++) {
			t = THEMES[i];
			css += ".theme-" + i + "{--bg:" + t.bg + ";--fg:" + t.fg + ";--gutter:" + t.gutter +
				";--gutterfg:" + t.gutterfg + ";--title:" + t.title + ";--tabfg:" + t.tabfg +
				";--cursor:" + t.cursor + ";--sel:" + t.sel + ";--tok-com:" + t.com +
				";--tok-key:" + t.key + ";--tok-str:" + t.str + ";--tok-num:" + t.num +
				";--tok-typ:" + t.typ + ";--tok-var:" + t.var + ";--tok-pun:" + t.pun +
				";--tok-fn:" + t.fn + ";--tok-pp:" + t.pp + ";--tok-shb:" + t.shb + ";}";
		}
		var st = document.createElement("style");
		st.id = "themeCSS";
		st.textContent = css;
		document.head.appendChild(st);
	}

	// token 行数组 → 代码区 HTML（无类型 token 直接文本，否则包 <span class="tok-*">；末尾按需拼光标）
	function buildCodeHtml(lines) {
		var html = "", i, j, ln, tok;
		for (i = 0; i < lines.length; i++) {
			ln = lines[i];
			for (j = 0; j < ln.length; j++) {
				tok = ln[j];
				html += tok.t === "" ? esc(tok.x) : '<span class="tok-' + tok.t + '">' + esc(tok.x) + "</span>";
			}
			if (i < lines.length - 1) html += "\n";
		}
		if (state.cursorBlink) html += '<span class="cursor"></span>';
		return html;
	}

	// 行号栏（关闭时隐藏元素）
	function renderGutter(lines) {
		if (!state.lineNumbers) {
			gutterEl.style.display = "none";
			return;
		}
		var gutter = "";
		for (var i = 0; i < lines.length; i++) {
			gutter += (i + 1);
			if (i < lines.length - 1) gutter += "\n";
		}
		gutterEl.innerHTML = gutter;
		gutterEl.style.display = "block";
	}

	// 字体族：7 = 自定义系统字体（清洗引号，未安装回退 JetBrains Mono）
	function resolveFontFamily() {
		if (state.fontFamily !== 7) return FONTS[state.fontFamily - 1][0];
		var custom = String(state.fontCustom || "").replace(/["']/g, "").trim();
		return custom ? "'" + custom + "', 'CCJetBrainsMono', monospace" : "'CCJetBrainsMono', monospace";
	}

	// 桌面背景：自定义 RGB 或主题底色
	function applyBackground() {
		if (state.bgMode === 2) {
			var bgRgb = CodeClockSettings.parseColor(state.bgColor);
			document.body.style.background = "rgb(" + bgRgb.join(",") + ")";
		} else {
			document.body.style.background = THEMES[state.theme - 1].bg;
		}
	}

	// 语言/主题切换时的“形变”过渡：先按旧尺寸压扁，下一帧恢复 → 平滑缩放（400ms 冷却防连触）
	function playMorph(oldW, oldH) {
		var newW = editorEl.offsetWidth;
		var newH = editorEl.offsetHeight;
		if (!(oldW > 0 && oldH > 0 && (oldW !== newW || oldH !== newH)) || Date.now() < morphUntil) return;
		morphUntil = Date.now() + 400;
		editorEl.style.transition = "none";
		editorEl.style.transform = "scale(" + (oldW / newW) + "," + (oldH / newH) + ")";
		requestAnimationFrame(function () {
			void editorEl.offsetWidth;
			requestAnimationFrame(function () {
				editorEl.style.transition = "";
				editorEl.style.transform = "";
			});
		});
	}

	// 核心渲染：LANG 模板 → token 行数组 → HTML（token 转 <span class="tok-*">）
	// 同时应用：行号 / 标题栏 / 主题类 / 字体 / 位置 / 透明度 / 背景 / 光晕
	// animate=true 且尺寸变化时播放“形变”过渡（语言/主题切换的平滑缩放）
	// 注意：音乐律动开启时 fontSize 与 boxShadow 交给音乐层接管，render 不写（否则每秒重绘会覆盖 60fps 律动）
	function render(animate) {
		var oldW = editorEl.offsetWidth;
		var oldH = editorEl.offsetHeight;
		var L = LANG[state.language - 1];
		var lines = L.render(buildTime(), currentCfg());
		codeEl.innerHTML = buildCodeHtml(lines);
		renderGutter(lines);
		tabEl.textContent = L.ext;
		titleEl.style.display = state.titleBar ? "flex" : "none";
		editorEl.className = "theme-" + (state.theme - 1) + (state.highlight ? "" : " no-hl");
		editorEl.style.fontFamily = resolveFontFamily();
		if (!state.musicSync) editorEl.style.fontSize = state.fontSize + "px";
		wrapEl.style.left = state.posX + "%";
		wrapEl.style.top = state.posY + "%";
		editorEl.style.opacity = state.opacity / 100;
		applyBackground();
		if (!state.musicSync) applyStaticGlow();
		if (animate) playMorph(oldW, oldH);
	}

	// 整点特效：弹跳（#bounce CSS 动画）+ 背景闪烁（光晕色，600ms 后恢复）
	// DOM 动画失败不应影响走时，整体 try/catch 兜底
	function playHourFx() {
		try {
			if (state.hourBounce && bounceEl) {
				bounceEl.classList.remove("bounce");
				void bounceEl.offsetWidth;
				bounceEl.classList.add("bounce");
			}
			if (state.hourFlash) {
				var frgb = getGlowRgb();
				editorEl.style.backgroundColor = "rgba(" + frgb.join(",") + ",0.55)";
				clearTimeout(flashTimer);
				flashTimer = setTimeout(function () {
					editorEl.style.backgroundColor = "";
				}, 600);
			}
		} catch (e) {
			/* 动画层异常时静默降级，时钟功能不受影响 */
		}
	}

	// 参数入口：壁纸引擎 applyUserProperties 与浏览器侧边栏都调用它
	// 入参形如 { Language: { value: 1 }, Theme: { value: 2 }, ... }，按 PROP_MAP 批量写入 state 后重绘一次
	// 注意：用 value !== undefined 判断而非真值判断，否则 0 / "" 等合法值会被漏掉
	function applyProps(properties) {
		var p = properties, k, name;
		for (k in p) {
			name = PROP_MAP[k];
			if (name && p[k] && p[k].value !== undefined) {
				state[name] = p[k].value;
			}
		}
		render(true);
	}

	// 时钟轮询（250ms）：检测整点切换触发特效；把显示内容拼成签名，变化才 render（性能优化）
	function tick() {
		if (paused) return;
		var now = new Date();
		var hk = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "-" + now.getHours();
		if (lastHourKey !== null && hk !== lastHourKey && now.getMinutes() === 0) {
			playHourFx();
		}
		lastHourKey = hk;
		var T = buildTime();
		var sig = [T.comment, T.hour, T.min, T.sec, T.period, state.showSeconds, state.showPeriod, state.showDate].join("|");
		if (sig !== lastSig) {
			lastSig = sig;
			render(true);
		}
	}

	// ============================ 音乐律动引擎 ============================
	// 数据流：音频回调（≈16Hz，只算数据）→ audioData → audioTick() rAF 插值 → applyMusicVisuals() 写样式

	// HSL → RGB（用于色相渐变 / 频段跳跃的动态配色）
	// 标准六扇区查表：seg[floor(h/60)] 给出 (r,g,b) 的相对分量
	function hslToRgb(h, s, l) {
		h = ((h % 360) + 360) % 360;
		s = Math.max(0, Math.min(100, s)) / 100;
		l = Math.max(0, Math.min(100, l)) / 100;
		var c = (1 - Math.abs(2 * l - 1)) * s;
		var x = c * (1 - Math.abs((h / 60) % 2 - 1));
		var m = l - c / 2;
		var seg = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.floor(h / 60)];
		return [Math.round((seg[0] + m) * 255), Math.round((seg[1] + m) * 255), Math.round((seg[2] + m) * 255)];
	}

	// 频谱数组中 [lo,hi] 区间的合法数值（parseFloat 容错，跳过非法值）
	function binValues(arr, lo, hi) {
		var out = [], v, i;
		for (i = lo; i <= hi && i < arr.length; i++) {
			v = parseFloat(arr[i]);
			if (isFinite(v)) out.push(v);
		}
		return out;
	}

	// 数组平均值（空数组返回 0）
	function avgOf(a) {
		var s = 0, i;
		for (i = 0; i < a.length; i++) s += a[i];
		return a.length ? s / a.length : 0;
	}

	// 数组峰值（空数组返回 0）
	function peakOf(a) {
		var m = 0, i;
		for (i = 0; i < a.length; i++) {
			if (a[i] > m) m = a[i];
		}
		return m;
	}

	// 频谱数组中 [lo,hi] 区间的平均值
	function binAvg(arr, lo, hi) {
		return avgOf(binValues(arr, lo, hi));
	}

	// 左右声道在 [lo,hi] 区间的平均能量
	function stereoAvg(left, right, lo, hi) {
		return (binAvg(left, lo, hi) + binAvg(right, lo, hi)) / 2;
	}

	// 把 1~63 的逻辑频段号映射到实际频谱数组的 bin 区间（兼容 64/128/256 长度）
	function bandToBins(bandLo, bandHi, len) {
		var lo = Math.floor((bandLo - 1) / 63 * (len - 1));
		var hi = Math.floor((bandHi - 1) / 63 * (len - 1));
		if (lo > hi) { var t = lo; lo = hi; hi = t; }
		return [Math.max(0, lo), Math.min(len - 1, hi)];
	}

	// 左右声道最大 bin 值，作为无 lPulse 字段时的节拍代理
	function maxBin(left, right) {
		return Math.max(peakOf(binValues(left, 0, left.length - 1)), peakOf(binValues(right, 0, right.length - 1)));
	}

	// 频段滑杆值取整并夹紧到 1~63（非法回退 dflt）
	function clampBand(v, dflt) {
		var n = Math.round(typeof v === "number" ? v : dflt);
		return Math.max(1, Math.min(63, n));
	}

	// 当前选定的频段范围 [lo,hi]（1~63；自定义时 Low>High 自动交换）
	function audioBandRange() {
		if (state.musicBand === 5) {
			var lo = clampBand(state.musicBandLow, 1);
			var hi = clampBand(state.musicBandHigh, 20);
			return lo > hi ? [hi, lo] : [lo, hi];
		}
		return BAND_PRESETS[state.musicBand] || [1, 63];
	}

	// 音频数据归一化入口（经典 API 与对象 API 都汇到这里）：
	// 按 MusicBand 选定频段 → 左右声道平均 → 乘 MusicSensitivity → clamp 0~1
	// 同时计算 low/mid/high 三分频（供色相渐变/频段跳跃）与 pulse（节拍强度，无 lPulse 时用最大 bin）
	function ingestAudio(left, right, pulse, hasPulse) {
		var r = audioBandRange();
		var len = Math.max(1, left.length);
		var b = bandToBins(r[0], r[1], len);
		var sens = (typeof state.musicSensitivity === "number" ? state.musicSensitivity : 100) / 100;
		audioData.raw = Math.max(0, Math.min(1, stereoAvg(left, right, b[0], b[1]) * sens));
		audioData.pulse = hasPulse ? Math.max(0, Math.min(1, pulse)) : Math.max(0, Math.min(1, maxBin(left, right)));
		var l1 = bandToBins(1, 8, len), l2 = bandToBins(9, 25, len), l3 = bandToBins(26, 63, len);
		audioData.low = stereoAvg(left, right, l1[0], l1[1]);
		audioData.mid = stereoAvg(left, right, l2[0], l2[1]);
		audioData.high = stereoAvg(left, right, l3[0], l3[1]);
		audioData.t = Date.now();
	}

	// 频段跳跃的色相：按 low/mid/high 主导频段选色（低=210 蓝，中=270 紫，高=15 橙红）
	function bandHue() {
		if (audioData.low >= audioData.mid && audioData.low >= audioData.high) return 210;
		return audioData.mid >= audioData.high ? 270 : 15;
	}

	// 律动颜色：固定=当前光晕色；色相渐变=能量驱动 HSL 色相流动；
	// 频段跳跃=按主导频段选色；节拍闪烁(flashing)=向白色提亮
	function musicColorRgb(flashing) {
		var rgb;
		if (state.musicColorStyle === 2 || state.musicBeatStyle === 4) {
			var hue = state.musicBeatStyle === 4 ? bandHue() : (200 + audioCur.energy * 160 + (Date.now() / 25)) % 360;
			rgb = hslToRgb(hue, 90, 55 + audioCur.energy * 10);
		} else {
			rgb = getGlowRgb();
		}
		return flashing ? towardWhite(rgb, 0.5) : rgb;
	}

	// 静态光晕（音乐律动关闭 / 仅代码块模式时使用），公式与 render() 的历史静态逻辑一致
	function applyStaticGlow() {
		if (!state.glowEnabled) {
			editorEl.style.boxShadow = SHADOW_BASE;
			return;
		}
		var gi = typeof state.glowIntensity === "number" ? state.glowIntensity : 35;
		var ga = 0.12 + (gi / 100) * 0.85;
		editorEl.style.boxShadow = "0 0 " + (24 + gi) + "px rgba(" + getGlowRgb().join(",") + "," + ga.toFixed(2) + "), " + SHADOW_BASE;
	}

	// 光晕随能量在 [MusicGlowMin, MusicGlowMax] 间脉动（仅 SyncMode 1/3；否则恢复静态光晕）
	function applyGlowVisual(e, rgb) {
		if (state.musicSyncMode !== 1 && state.musicSyncMode !== 3) {
			applyStaticGlow();
			return;
		}
		if (!state.glowEnabled) {
			editorEl.style.boxShadow = SHADOW_BASE;
			return;
		}
		var gi = typeof state.glowIntensity === "number" ? state.glowIntensity : 35;
		var min = typeof state.musicGlowMin === "number" ? Math.max(0, Math.min(100, state.musicGlowMin)) : 0;
		var max = typeof state.musicGlowMax === "number" ? Math.max(0, Math.min(200, state.musicGlowMax)) : 100;
		var level = min >= max ? max / 100 : (min + (max - min) * e) / 100;
		var ga = 0.12 + (gi * level) / 100 * 0.85;
		var spread = 24 + gi * level;
		editorEl.style.boxShadow = "0 0 " + spread.toFixed(1) + "px rgba(" + rgb.join(",") + "," + ga.toFixed(2) + "), " + SHADOW_BASE;
	}

	// 主体律动（仅 SyncMode 2/3）：1=字号微震 2=整体缩放 3=字号+缩放
	// strength = MusicBodyStrength/100（0~2，200% 时强度翻倍）；e 为平滑后的能量
	function applyBodyVisual(e) {
		if (state.musicSyncMode !== 2 && state.musicSyncMode !== 3) {
			editorEl.style.fontSize = state.fontSize + "px";
			wrapEl.style.transform = "";
			return;
		}
		var bs = typeof state.musicBodyStyle === "number" ? state.musicBodyStyle : 1;
		var strength = (typeof state.musicBodyStrength === "number" ? state.musicBodyStrength : 50) / 100;
		editorEl.style.fontSize = (bs === 1 || bs === 3) ? (state.fontSize + e * strength * 6) + "px" : state.fontSize + "px";
		wrapEl.style.transform = (bs === 2 || bs === 3) ? "translate(-50%, -50%) scale(" + (1 + e * strength * 0.5).toFixed(4) + ")" : "";
	}

	// 每帧视觉写入（仅 audioTick 调用）：光晕 + 主体两部分
	function applyMusicVisuals(flashing) {
		var e = audioCur.energy;
		applyGlowVisual(e, musicColorRgb(flashing));
		applyBodyVisual(e);
	}

	// 关闭音乐律动时清理音乐层残留样式，并 render(false) 恢复静态外观
	function resetMusicVisuals() {
		editorEl.style.transition = "";
		editorEl.style.backgroundColor = "";
		wrapEl.style.transform = "";
		render(false);
	}

	// 演示模式：正弦波模拟节拍，回填 audioData 并返回目标能量（浏览器预览用）
	function synthDemo(now) {
		var t = now / 1000;
		var pulse = (Math.sin(t * Math.PI * 2) + 1) / 2;
		var target = Math.max(0, Math.min(1, 0.15 + 0.85 * pulse * pulse * (0.55 + 0.45 * Math.sin(t * 0.7))));
		audioData.pulse = pulse;
		audioData.low = target;
		audioData.mid = target * 0.6;
		audioData.high = target * 0.35;
		audioData.t = now;
		return target;
	}

	// 有新音频数据时计算目标能量（鼓点脉冲取 raw/pulse 较大者；节拍闪烁按阈值打点）
	function beatTarget(now) {
		var threshold = (typeof state.musicBeatThreshold === "number" ? state.musicBeatThreshold : 40) / 100;
		if (state.musicBeatStyle === 3 && audioData.pulse >= threshold) {
			beatFlashAt = now;
		}
		return state.musicBeatStyle === 2 ? Math.max(audioData.raw, audioData.pulse) : audioData.raw;
	}

	// 音乐律动关闭时本帧的处理：清理音乐层残留样式（只执行一次）
	function audioTickIdle() {
		if (musicVisualOn) {
			musicVisualOn = false;
			resetMusicVisuals();
		}
	}

	// attack/decay 插值：目标高于当前用 attack（快升），否则 release（慢落）
	// sm = MusicSmooth/100；衰减到 0.0015 以下归零，避免无限小数抖动
	function smoothEnergy(target) {
		var sm = Math.max(0, Math.min(100, (typeof state.musicSmooth === "number" ? state.musicSmooth : 30))) / 100;
		var ka = 0.95 - sm * 0.75;
		var kr = 0.42 - sm * 0.38;
		var e = audioCur.energy;
		e += (target - e) * (target > e ? ka : kr);
		return e < 0.0015 ? 0 : e;
	}

	// rAF 主循环（≈60fps）：计算目标能量 → attack/decay 插值 → 写视觉
	// fresh = 最近 450ms 内有音频数据；无数据时按 MusicIdle 回落到 0（静音静止）
	// MusicDemo：无数据时用正弦波模拟节拍（浏览器预览用）；paused（WE 暂停）时冻结
	function audioTick() {
		audioRaf = requestAnimationFrame(audioTick);
		if (!state.musicSync) {
			audioTickIdle();
			return;
		}
		if (paused) return;
		var now = Date.now();
		var fresh = (now - audioData.t) < 450;
		var target = 0;
		if (state.musicDemo && !fresh) target = synthDemo(now);
		else if (fresh) target = beatTarget(now);
		else if (!state.musicIdle) target = audioData.raw;
		audioCur.energy = smoothEnergy(target);
		musicVisualOn = true;
		applyMusicVisuals(state.musicBeatStyle === 3 && (now - beatFlashAt) < 180);
	}

	// 启动 rAF 循环（幂等）
	function startAudioFx() {
		if (!audioRaf) audioRaf = requestAnimationFrame(audioTick);
	}

	// ============ 音频数据接入（双 API 适配） ============
	// 经典 API：window.wallpaperRegisterAudioListener(cb)，回调收到 128 浮点数组（左声道 64 + 右声道 64）
	// 对象 API：window.wallpaperAudioListener.onAudioLevelsAvailable(levels)，字段 v1..v63 / freq / lPulse 等
	// 两条都注册、互不干扰：实测部分 WE 环境只支持其一，双注册保证都能收到数据

	// 经典 API：128 浮点（左 64 + 右 64）；64 及以下视为单声道，左右相同
	function onClassicAudio(data) {
		if (!data) return;
		var n = data.length;
		if (n >= 128) {
			ingestAudio(data.slice(0, 64), data.slice(64, 128), -1, false);
			return;
		}
		if (n >= 64) {
			ingestAudio(data.slice(0, 64), data.slice(0, 64), -1, false);
			return;
		}
		if (n > 0) {
			ingestAudio(data.slice(0, n), data.slice(0, n), -1, false);
		}
	}

	// 提取对象 API 的节拍脉冲（左右声道均值；无字段返回 [-1, false]）
	function extractPulse(a) {
		if (typeof a.lPulse !== "number" && typeof a.rPulse !== "number") return [-1, false];
		var l = typeof a.lPulse === "number" ? a.lPulse : 0;
		var r = typeof a.rPulse === "number" ? a.rPulse : 0;
		return [(l + r) / 2, true];
	}

	// 对象 API 的 v1..v63 频段字段 → 左右声道数组（该 API 无独立左右声道）
	function levelsToBands(a) {
		var bands = [];
		for (var i = 1; i <= 63; i++) {
			bands.push(typeof a["v" + i] !== "undefined" ? a["v" + i] : 0);
		}
		return [bands, bands];
	}

	// 对象 API 统一入口：优先 v1..v63 字段，其次 freq 原始频谱数组（前半左/后半右）
	function onLevelsAvailable(a) {
		if (!a) return;
		var p = extractPulse(a);
		if (typeof a.v1 !== "undefined") {
			var bands = levelsToBands(a);
			ingestAudio(bands[0], bands[1], p[0], p[1]);
			return;
		}
		if (a.freq && typeof a.freq.length === "number" && a.freq.length > 0) {
			var half = Math.floor(a.freq.length / 2);
			var left = half > 0 ? a.freq.slice(0, half) : a.freq.slice(0);
			var right = half > 0 ? a.freq.slice(half) : a.freq.slice(0);
			ingestAudio(left, right, p[0], p[1]);
		}
	}

	if (typeof window.wallpaperRegisterAudioListener === "function") {
		window.wallpaperRegisterAudioListener(onClassicAudio);
	}

	window.wallpaperAudioListener = {
		onAudioLevelsAvailable: onLevelsAvailable
	};

	// WE 属性监听：设置面板任何改动都会回调 applyUserProperties（初始化时也会推送一次全量属性）
	window.wallpaperPropertyListener = {
		applyUserProperties: applyProps
	};

	// WE 暂停/恢复通知（切窗口、屏保等）：paused=true 时时钟与律动冻结
	if (window.wallpaperRegisterPauseListener) {
		window.wallpaperRegisterPauseListener(function (isPaused) {
			paused = isPaused;
		});
	}

	// 环境检测：存在 WE API 或 UA 含 "Wallpaper Engine" → 壁纸引擎模式（隐藏浏览器侧边栏）
	var IS_WE = typeof window.wallpaperRegisterPauseListener === "function" ||
		typeof window.wallpaperRequestRandomFileForProperty === "function" ||
		/Wallpaper Engine/i.test(navigator.userAgent || "");

	// ============================ 浏览器模式专属 ============================

	// 复制文本到剪贴板（textarea + execCommand，兼容 WE 的内嵌浏览器）
	function copyText(s) {
		var ta = document.createElement("textarea");
		ta.value = s;
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.select();
		try {
			document.execCommand("copy");
		} catch (e) {
			/* 剪贴板不可用时静默失败（WE 沙箱环境） */
		}
		document.body.removeChild(ta);
	}

	// 右键菜单项：复制时间/日期/时间戳 + 编程语言切换
	function buildMenuItems(timeText, comment) {
		var items = [
			{ head: "时间与日期" },
			{ label: "复制时间 " + timeText, act: function () { copyText(timeText); } },
			{ label: "复制日期 " + comment, act: function () { copyText(comment); } },
			{ label: "复制时间与日期", act: function () { copyText(comment + " " + timeText); } },
			{ label: "复制 UNIX 时间戳", act: function () { copyText(String(Math.floor(Date.now() / 1000))); } },
			{ sep: true },
			{ head: "切换编程语言" }
		];
		LANG.forEach(function (l, i) {
			items.push({
				label: (i + 1 === state.language ? "✓ " : "") + l.name,
				act: function () { applyProps({ Language: { value: i + 1 } }); }
			});
		});
		return items;
	}

	// 菜单 HTML：分隔线 / 分组标题 / 可点项（data-idx 关联回 items）
	function menuHtml(items) {
		var html = "", i, it;
		for (i = 0; i < items.length; i++) {
			it = items[i];
			if (it.sep) html += '<div class="mi-sep"></div>';
			else if (it.head) html += '<div class="mi-head">' + it.head + "</div>";
			else html += '<div class="mi" data-idx="' + i + '">' + it.label + "</div>";
		}
		return html;
	}

	// 菜单定位：以鼠标为原点，越出窗口时向内收
	function placeMenu(menu, e) {
		menu.style.left = Math.min(e.clientX, Math.max(8, window.innerWidth - menu.offsetWidth - 8)) + "px";
		menu.style.top = Math.min(e.clientY, Math.max(8, window.innerHeight - menu.offsetHeight - 8)) + "px";
	}

	// 浏览器模式右键菜单：复制时间/日期/UNIX 时间戳、快速切换编程语言
	function initContextMenu() {
		var menu = byId("ctxmenu");
		if (!menu) return;
		editorEl.addEventListener("contextmenu", function (e) {
			e.preventDefault();
			var T = buildTime();
			var timeText = T.hour + ":" + pad2(T.min) + ":" + pad2(T.sec) + (currentCfg().showPeriod ? " " + T.period : "");
			var items = buildMenuItems(timeText, T.comment);
			menu.innerHTML = menuHtml(items);
			menu.style.display = "block";
			placeMenu(menu, e);
			var rows = menu.querySelectorAll(".mi");
			for (var j = 0; j < rows.length; j++) {
				rows[j].addEventListener("click", function () {
					items[parseInt(this.getAttribute("data-idx"), 10)].act();
					menu.style.display = "none";
				});
			}
		});
		document.addEventListener("click", function () {
			menu.style.display = "none";
		});
		document.addEventListener("contextmenu", function (e) {
			if (e.target.closest && !e.target.closest("#editor")) menu.style.display = "none";
		});
	}

	// 时钟轮询启停（浏览器切到后台时停表省电）
	function startTimer() {
		if (!timer) {
			timer = setInterval(tick, 250);
		}
	}

	// 停止时钟轮询
	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	// 浏览器模式初始化：后台切换省电 → 加载设置 → 初始化侧边栏（变更回写 state + 持久化）→ 右键菜单
	function setupBrowserMode() {
		document.addEventListener("visibilitychange", function () {
			if (document.hidden) stopTimer();
			else startTimer();
		});
		CodeClockSettings.fetchDefs(function () {
			var flat = CodeClockSettings.load();
			applyProps(CodeClockSettings.toWeProps(flat));
			CodeClockSidebar.init(flat, function (newFlat) {
				applyProps(CodeClockSettings.toWeProps(newFlat));
				CodeClockSettings.save(newFlat);
			});
			initContextMenu();
		});
	}

	// 初始化：取 DOM → 生成主题 CSS → 首帧渲染 → 环境分支
	// WE：仅渲染（参数由引擎面板推入）；浏览器：加载设置 → 侧边栏 → 右键菜单
	// 最后启动 250ms 时钟轮询 + rAF 音乐循环
	function init() {
		editorEl = byId("editor");
		wrapEl = byId("wrap");
		bounceEl = byId("bounce");
		titleEl = byId("titlebar");
		tabEl = byId("tabname");
		gutterEl = byId("gutter");
		codeEl = byId("code");
		buildThemeCSS();
		render(false);
		if (IS_WE) {
			document.body.classList.add("in-we");
		} else {
			setupBrowserMode();
		}
		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(function () {
				render(false);
			});
		}
		startTimer();
		startAudioFx();
	}

	// DOM 就绪后启动
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
