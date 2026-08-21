/* ============================================================================
 * CodeClock · themes.js 主题开发文档
 * ----------------------------------------------------------------------------
 * 【架构】
 *   THEMES 是一个数组，每个元素代表一套编辑器高亮主题，按数组顺序编号，
 *   第 i 个主题对应 project.json / settings.js 中 Theme 选项的 value = i + 1
 *   （即 value 1 对应 THEMES[0]，value 2 对应 THEMES[1]，依此类推）。
 *   新增主题时必须在末尾追加，不要插队，否则已保存的用户设置会串主题。
 *
 * 【每个主题包含的字段（全部必填，均为 #RRGGBB 十六进制）】
 *   name      主题显示名（仅作标注，真正显示名来自 project.json 的 Theme 选项）
 *   bg        代码区背景色（最核心的底色）
 *   fg        正文/默认文字颜色（无高亮时所有代码都用它）
 *   gutter    行号栏背景色
 *   gutterfg  行号文字颜色（透明度固定 0.55，不需要额外调暗）
 *   title     标题栏背景色（红黄绿三圆点所在的那条）
 *   tabfg     标题栏文件名文字颜色
 *   cursor    闪烁光标颜色
 *   sel       文字选区高亮颜色
 *   com       注释颜色（// # -- ; ' REM % (* *) 等）
 *   key       关键字颜色（const int struct public 等，加粗 600）
 *   str       字符串颜色（"..." / '...'）
 *   num       数字颜色（时间数值等）
 *   typ       类型/类名颜色（Clock String u8 Dictionary...）
 *   var       变量/字段名颜色（hour minute clock 等）
 *   pun       标点符号颜色（= { } ( ) ; , : -> <| ...）
 *   fn        函数名颜色（struct at new list 等）
 *   pp        预处理指令颜色（#include、<?php）
 *   glow      光晕颜色（"跟随主题"模式下代码块外发光、整点背景闪烁都用它）
 *   shb       shebang 行颜色（Bash 模板中 #!/usr/bin/env bash 整行专用，独立于 pp）
 *
 * 【token 类型 → 颜色变量 对照表】（由 languages.js 的 token 类型映射）
 *   ""    纯文本 → fg         com → tok-com  → --com
 *   key  → --tok-key  → key   str → --tok-str  → str
 *   num  → --tok-num  → num   typ → --tok-typ  → typ
 *   var  → --tok-var  → var   pun → --tok-pun  → pun
 *   fn   → --tok-fn   → fn    pp  → --tok-pp   → pp
 *   shb  → --tok-shb  → shb
 *
 * 【工作原理】
 *   main.js 的 buildThemeCSS() 启动时遍历 THEMES，为每个主题生成一个
 *   .theme-N 的 CSS 变量类（--bg --fg --tok-com ...），
 *   render() 中通过 #editor.className = "theme-(value-1)" 切换；
 *   关闭语法高亮时加 no-hl 类，全部 token 统一用 --fg。
 *
 * 【新增主题步骤】
 *   1. 在文件末尾追加一个主题对象（保持与现有主题相同的字段与顺序）
 *   2. 在 project.json 的 "Theme" 选项数组中追加一项（value 递增，从 20 开始）
 *   3. 若浏览器模式以 file:// 打开，需同步 js/settings.js 的 PROP_DEFS.Theme.options
 *   4. 完成。建议参考 https://github.com/ 上同名主题的配色保证还原度
 * ============================================================================ */
var THEMES = [
	{
		name: "Atom One Light",
		bg: "#fafafa", fg: "#383a42", gutter: "#f0f0f1", gutterfg: "#9d9d9f",
		title: "#ececec", tabfg: "#383a42", cursor: "#526eff", sel: "#e5e5e6",
		com: "#a0a1a7", key: "#a626a4", str: "#50a14f", num: "#986801",
		typ: "#e45649", var: "#383a42", pun: "#383a42", fn: "#4078f2", pp: "#a626a4",
		glow: "#4078f2", shb: "#e45649"
	},
	{
		name: "Dracula",
		bg: "#282a36", fg: "#f8f8f2", gutter: "#21222c", gutterfg: "#6272a4",
		title: "#21222c", tabfg: "#f8f8f2", cursor: "#f8f8f2", sel: "#44475a",
		com: "#6272a4", key: "#ff79c6", str: "#f1fa8c", num: "#bd93f9",
		typ: "#8be9fd", var: "#f8f8f2", pun: "#f8f8f2", fn: "#50fa7b", pp: "#ff79c6",
		glow: "#bd93f9", shb: "#ff5555"
	},
	{
		name: "GitHub Dark",
		bg: "#0d1117", fg: "#c9d1d9", gutter: "#161b22", gutterfg: "#8b949e",
		title: "#161b22", tabfg: "#c9d1d9", cursor: "#c9d1d9", sel: "#264f78",
		com: "#8b949e", key: "#ff7b72", str: "#a5d6ff", num: "#79c0ff",
		typ: "#ffa657", var: "#c9d1d9", pun: "#c9d1d9", fn: "#d2a8ff", pp: "#ffa657",
		glow: "#58a6ff", shb: "#ff7b72"
	},
	{
		name: "GitHub Light",
		bg: "#ffffff", fg: "#24292f", gutter: "#f6f8fa", gutterfg: "#6e7781",
		title: "#f6f8fa", tabfg: "#24292f", cursor: "#24292f", sel: "#c8e1ff",
		com: "#6a737d", key: "#cf222e", str: "#0a3069", num: "#0550ae",
		typ: "#953800", var: "#24292f", pun: "#24292f", fn: "#8250df", pp: "#953800",
		glow: "#0969da", shb: "#cf222e"
	},
	{
		name: "IntelliJ Light",
		bg: "#ffffff", fg: "#000000", gutter: "#e5e5e5", gutterfg: "#999999",
		title: "#ececec", tabfg: "#000000", cursor: "#000000", sel: "#b6d7f0",
		com: "#808080", key: "#0033b3", str: "#067d17", num: "#1750eb",
		typ: "#000000", var: "#000000", pun: "#000000", fn: "#00627a", pp: "#0033b3",
		glow: "#0e639c", shb: "#e20000"
	},
	{
		name: "JetBrains Dark (Darcula)",
		bg: "#2b2b2b", fg: "#a9b7c6", gutter: "#313335", gutterfg: "#606366",
		title: "#3c3f41", tabfg: "#a9b7c6", cursor: "#a9b7c6", sel: "#214283",
		com: "#808080", key: "#cc7832", str: "#6a8759", num: "#6897bb",
		typ: "#cc7832", var: "#9876aa", pun: "#a9b7c6", fn: "#ffc66d", pp: "#cc7832",
		glow: "#4b6eaf", shb: "#ff6b68"
	},
	{
		name: "Material Theme",
		bg: "#263238", fg: "#eeffff", gutter: "#263238", gutterfg: "#546e7a",
		title: "#37474f", tabfg: "#eeffff", cursor: "#80cbc4", sel: "#33434c",
		com: "#546e7a", key: "#c792ea", str: "#c3e88d", num: "#f78c6c",
		typ: "#ffcb6b", var: "#eeffff", pun: "#89ddff", fn: "#82aaff", pp: "#c792ea",
		glow: "#82aaff", shb: "#f07178"
	},
	{
		name: "Monokai",
		bg: "#272822", fg: "#f8f8f2", gutter: "#2f3129", gutterfg: "#90908a",
		title: "#2f3129", tabfg: "#f8f8f2", cursor: "#f8f8f2", sel: "#49483e",
		com: "#75715e", key: "#f92672", str: "#e6db74", num: "#ae81ff",
		typ: "#66d9ef", var: "#f8f8f2", pun: "#f8f8f2", fn: "#a6e22e", pp: "#a6e22e",
		glow: "#ae81ff", shb: "#f92672"
	},
	{
		name: "Night Owl Dark",
		bg: "#011627", fg: "#d6deeb", gutter: "#011627", gutterfg: "#5f7e97",
		title: "#0b2133", tabfg: "#d6deeb", cursor: "#addb67", sel: "#1d3b53",
		com: "#637777", key: "#c792ea", str: "#ecc48d", num: "#f78c6c",
		typ: "#ffcb8b", var: "#d6deeb", pun: "#d6deeb", fn: "#82aaff", pp: "#c792ea",
		glow: "#82aaff", shb: "#ff5874"
	},
	{
		name: "Night Owl Light",
		bg: "#f6f7f9", fg: "#403f53", gutter: "#f6f7f9", gutterfg: "#9a99a8",
		title: "#eceff4", tabfg: "#403f53", cursor: "#994cc3", sel: "#e3e6ee",
		com: "#989fb1", key: "#994cc3", str: "#a05a1f", num: "#a34a2e",
		typ: "#0c6fa8", var: "#403f53", pun: "#403f53", fn: "#1f6fb2", pp: "#994cc3",
		glow: "#994cc3", shb: "#f76d47"
	},
	{
		name: "One Dark (Atom)",
		bg: "#282c34", fg: "#abb2bf", gutter: "#21252b", gutterfg: "#4b5263",
		title: "#21252b", tabfg: "#abb2bf", cursor: "#528bff", sel: "#3e4451",
		com: "#5c6370", key: "#c678dd", str: "#98c379", num: "#d19a66",
		typ: "#e5c07b", var: "#abb2bf", pun: "#abb2bf", fn: "#61afef", pp: "#c678dd",
		glow: "#61afef", shb: "#e06c75"
	},
	{
		name: "Panda Theme",
		bg: "#292a2b", fg: "#e6e6e6", gutter: "#292a2b", gutterfg: "#676b79",
		title: "#222324", tabfg: "#e6e6e6", cursor: "#ff4b82", sel: "#3a3c3d",
		com: "#676b79", key: "#ff4b82", str: "#19f9d8", num: "#ffb86c",
		typ: "#ffb86c", var: "#e6e6e6", pun: "#e6e6e6", fn: "#45a9f9", pp: "#ff4b82",
		glow: "#19f9d8", shb: "#ff4b82"
	},
	{
		name: "Shades of Purple",
		bg: "#2d2b55", fg: "#f1f2f3", gutter: "#2d2b55", gutterfg: "#7a7c96",
		title: "#262448", tabfg: "#f1f2f3", cursor: "#ff9d00", sel: "#4b4882",
		com: "#b362ff", key: "#ff9d00", str: "#3ad900", num: "#ff628c",
		typ: "#9effff", var: "#f1f2f3", pun: "#f1f2f3", fn: "#fad000", pp: "#ff9d00",
		glow: "#b362ff", shb: "#ff628c"
	},
	{
		name: "Solarized Dark",
		bg: "#002b36", fg: "#839496", gutter: "#073642", gutterfg: "#586e75",
		title: "#073642", tabfg: "#93a1a1", cursor: "#93a1a1", sel: "#073642",
		com: "#586e75", key: "#859900", str: "#2aa198", num: "#d33682",
		typ: "#b58900", var: "#839496", pun: "#839496", fn: "#268bd2", pp: "#859900",
		glow: "#268bd2", shb: "#dc322f"
	},
	{
		name: "Solarized Light",
		bg: "#fdf6e3", fg: "#657b83", gutter: "#eee8d5", gutterfg: "#93a1a1",
		title: "#eee8d5", tabfg: "#586e75", cursor: "#586e75", sel: "#eee8d5",
		com: "#93a1a1", key: "#859900", str: "#2aa198", num: "#d33682",
		typ: "#b58900", var: "#657b83", pun: "#657b83", fn: "#268bd2", pp: "#859900",
		glow: "#268bd2", shb: "#dc322f"
	},
	{
		name: "SynthWave '84",
		bg: "#262335", fg: "#c8ccd4", gutter: "#262335", gutterfg: "#6c6783",
		title: "#1e1b29", tabfg: "#c8ccd4", cursor: "#f8f8f2", sel: "#413b5b",
		com: "#6c6783", key: "#ff7edb", str: "#fede5d", num: "#fede5d",
		typ: "#36f9f6", var: "#c8ccd4", pun: "#c8ccd4", fn: "#36f9f6", pp: "#ff7edb",
		glow: "#ff7edb", shb: "#fe4450"
	},
	{
		name: "VS Code Dark+",
		bg: "#1e1e1e", fg: "#d4d4d4", gutter: "#1e1e1e", gutterfg: "#858585",
		title: "#333333", tabfg: "#cccccc", cursor: "#aeafad", sel: "#264f78",
		com: "#6a9955", key: "#569cd6", str: "#ce9178", num: "#b5cea8",
		typ: "#4ec9b0", var: "#9cdcfe", pun: "#d4d4d4", fn: "#dcdcaa", pp: "#c586c0",
		glow: "#569cd6", shb: "#f44747"
	},
	{
		name: "Winter is Coming Dark",
		bg: "#0f151c", fg: "#c8d3e8", gutter: "#0f151c", gutterfg: "#5c6773",
		title: "#182028", tabfg: "#c8d3e8", cursor: "#d6deeb", sel: "#1c2733",
		com: "#5b6673", key: "#7aa2f7", str: "#9ecb6a", num: "#e0a35f",
		typ: "#4fc1ff", var: "#c8d3e8", pun: "#c8d3e8", fn: "#7fd4c1", pp: "#7aa2f7",
		glow: "#4fc1ff", shb: "#ff7b72"
	},
	{
		name: "Winter is Coming Light",
		bg: "#f7f9fb", fg: "#3a4552", gutter: "#eef2f6", gutterfg: "#8a97a5",
		title: "#e8edf2", tabfg: "#3a4552", cursor: "#2b6cb0", sel: "#dbe4ee",
		com: "#8a97a5", key: "#2b6cb0", str: "#5b9d5b", num: "#c07a2e",
		typ: "#0f7f91", var: "#3a4552", pun: "#3a4552", fn: "#2f6f9f", pp: "#2b6cb0",
		glow: "#2b6cb0", shb: "#d13438"
	}
];
