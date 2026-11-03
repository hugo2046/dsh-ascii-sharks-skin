import { createElement as h, useState } from "react";

const KEY = "dsh-sharks-skin.styles.v1";
const kinds = ["classic", "hammerhead", "zebra", "tiger", "greathammer", "mako", "thresher", "nurse"];
const original = { count: 3, glyph: false, fish: kinds.map((kind, i) => ({
  kind: ["classic", "classic", "tiger"][i] ?? kind, size: [1, .86, .64][i] ?? .75
})) };

function valid(style) {
  return style && Number.isInteger(style.count) && style.count >= 1 && style.count <= 8 &&
    typeof style.glyph === "boolean" && Array.isArray(style.fish) && style.fish.length === 8 &&
    style.fish.every(f => f && kinds.includes(f.kind) && f.size >= .5 && f.size <= 1);
}

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    return { active: valid(data?.active) ? data.active : null,
      saved: Array.isArray(data?.saved) ? data.saved.filter(p => typeof p?.name === "string" && valid(p.style)) : [] };
  } catch { return { active: null, saved: [] }; }
}

export let styles = read();
export const changeEvent = "dsh-sharks-style-change";

export function SharkSettings() {
  const [state, setState] = useState(styles);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const active = state.active ?? original;

  function update(next, message) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch { setNotice("未能写入本地存储，请重试。"); return; }
    const changed = styles.active !== next.active;
    styles = next;
    setState(next);
    setNotice(message);
    if (changed) window.dispatchEvent(new Event(changeEvent));
  }
  function refresh() {
    const fish = active.fish.map(() => ({
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      size: Math.round((.62 + Math.random() * .38) * 100) / 100
    }));
    update({ ...state, active: { count: active.count, fish, glyph: Math.random() < .25 } }, "新样式已应用");
  }
  function save() {
    const title = name.trim();
    if (!title) return setNotice("请输入样式名称");
    if (state.saved.some(p => p.name === title)) return setNotice("这个名称已使用，请换一个名称");
    update({ active, saved: [...state.saved, { name: title, style: active }] }, "已保存「" + title + "」");
  }
  const button = (label, onClick) => h("button", {type:"button", onClick}, label);
  return h("section", {className:"sharks-settings"},
    h("h3", null, "鲨鱼皮肤"),
    h("label", null, "鲨鱼数量　", h("select", {value:active.count, onChange:e =>
      update({...state, active:{...active, count:Number(e.target.value)}}, "数量已应用")},
      kinds.map((_,i) => h("option",{key:i,value:i+1}, i+1)))),
    h("div", null, button("刷新样式", refresh)),
    h("label", null, "样式名称　", h("input", {value:name, maxLength:40, placeholder:"例如：浅海巡游", onChange:e=>setName(e.target.value)})),
    h("div", null, button("保存当前样式", save)),
    state.saved.length > 0 && h("label", null, "已保存样式　", h("select", {value:"",onChange:e=>{
      const preset=state.saved[Number(e.target.value)];
      if (preset) update({...state,active:preset.style}, "已应用「"+preset.name+"」");
    }}, h("option",{value:"",disabled:true},"选择并应用"), state.saved.map((p,i)=>h("option",{key:p.name,value:i},p.name)))),
    h("p",{role:"status"}, notice));
}
