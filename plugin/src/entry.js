/** DSH 海洋皮肤：首页使用近景，聊天页共用一片连续水域。 */
import { OceanEngine } from "./ocean/engine.ts";
import { setGlyphOnly, setLightTheme } from "./ocean/renderer.ts";

import { SharkSettings, styles, changeEvent } from "./settings.js";

const STYLE_ID = "dsh-sharks-skin-style";
const SEA_ID = "dsh-sharks-skin-sea";
const VEIL_ID = "dsh-sharks-skin-veil";

const CSS = `
  .sharks-settings { display:grid; gap:14px; padding:18px; justify-items:start; color:inherit; }
  .sharks-settings :is(button,input,select) { font:inherit; color:inherit; background:var(--dsw-alias-bg-base); border:1px solid currentColor; padding:5px 10px; border-radius:6px; }
  .sharks-stage { position: relative; isolation: isolate; }
  .sharks-home { --sharks-water:#101619; }
  .sharks-home-light { --sharks-water:#f8f9f7; }
  #${SEA_ID} { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
  #${SEA_ID} { z-index:-2; display:block;
    font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  #${SEA_ID}.sharks-chat {
    inset:0 auto auto 0; z-index:2; opacity:.34; mix-blend-mode:screen;
    --sharks-reading-half:min(50%, calc(var(--dsh-chat-content-width, 748px) / 2));
    mask-image:linear-gradient(to right, black calc(50% - var(--sharks-reading-half) - 48px),
      rgb(0 0 0 / .36) calc(50% - var(--sharks-reading-half)),
      rgb(0 0 0 / .36) calc(50% + var(--sharks-reading-half)),
      black calc(50% + var(--sharks-reading-half) + 48px));
  }
  #${SEA_ID}.sharks-chat-light { mix-blend-mode:multiply; }
  .sharks-home [class$="_titleGroup"] { anchor-name:--sharks-title; }
  .sharks-home .dsh-claude-home-panel { anchor-name:--sharks-stats; }
  .sharks-home [data-composer-card] { anchor-name:--sharks-input; }
  /* 只柔化按钮背后的鱼身字符，按钮间隙仍能看到水面。 */
  .sharks-home :is(.kiGsTW_heroWorkspaceRow, [data-dsh-claude-part~="hero-workspace-row"]) :is(button, [role="button"]) {
    backdrop-filter:blur(5px);
  }
  #${VEIL_ID} { display:contents; }
  #${VEIL_ID} > i {
    position:absolute; pointer-events:none; z-index:-1;
    left:anchor(left); top:anchor(top); width:anchor-size(width, 0px); height:anchor-size(height, 0px);
    background:var(--sharks-water); border-radius:10px; opacity:.92;
    filter:drop-shadow(0 0 14px var(--sharks-water));
  }
`;

/** 宿主底色是亮的还是暗的？读 body 的实际背景。 */
function isLightSurface() {
  const bg = getComputedStyle(document.body).backgroundColor;
  const m = bg.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (!m) return false;
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return r * 0.299 + g * 0.587 + b * 0.114 > 140;
}

/** 空状态页的标志：标题「探索未至之境」真的在渲染。 */
function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

let stage, engine, observer, frame, theme, composer, chatResize;

function mountChat(host, column, light) {
  const sea = document.createElement("canvas");
  sea.id = SEA_ID;
  sea.className = light ? "sharks-chat sharks-chat-light" : "sharks-chat";
  sea.setAttribute("aria-hidden", "true");
  host.append(sea);

  // 水域按可见消息区布局，输入框随草稿增高时同步收短。
  function layout() {
    const height = column.getBoundingClientRect().top - host.getBoundingClientRect().top;
    sea.style.height = Math.max(0, height) + "px";
  }
  layout();
  chatResize = new ResizeObserver(layout);
  chatResize.observe(host);
  chatResize.observe(column);
  setLightTheme(light);
  setGlyphOnly(styles.active?.glyph ?? false);
  engine = new OceanEngine(sea, styles.active?.fish.slice(0, styles.active.count) ?? [{kind:"classic",size:1},{kind:"tiger",size:.8}], "immersive");
}

function clearStage() {
  chatResize?.disconnect();
  engine?.destroy();
  engine = null;
  stage?.classList.remove("sharks-stage", "sharks-home", "sharks-home-light");
  stage = null;
  document.getElementById(SEA_ID)?.remove();
  document.getElementById(VEIL_ID)?.remove();
}

function sync() {
  // 仅识别 HeroShell 的真实标题节点，聊天中引用同一句话不会触发。
  const group = document.querySelector('[class$="_headline"] [class$="_titleGroup"] > span:first-child');
  const next = group?.closest(".kiGsTW_root") ?? document.querySelector("[data-conversation-session]:has([data-composer-seat])");
  const column = !group && next?.querySelector("[data-composer-seat]");
  const host = next?.getClientRects().length ? next : null;
  const light = host &&
    Number(getComputedStyle(group || next).color.match(/[0-9.]+/g)?.[0]) < 145;
  if (stage === host && theme === light && composer === column) return;
  clearStage();
  theme = light;
  composer = column;
  if (!host) return;
  stage = host;
  stage.classList.add("sharks-stage");
  if (column) { mountChat(host, column, light); return; }
  const sea = document.createElement("canvas");
  sea.id = SEA_ID;
  sea.setAttribute("aria-hidden", "true");
  const veil = document.createElement("div");
  veil.id = VEIL_ID;
  stage.classList.add("sharks-home");
  stage.classList.toggle("sharks-home-light", light);
  veil.setAttribute("aria-hidden", "true");
  // 遮罩放在宿主控件之后，CSS 锚点会随控件布局及统计卡的出现自动更新。
  for (const anchor of ["--sharks-title", "--sharks-stats", "--sharks-input"]) {
    const patch = document.createElement("i");
    patch.style.positionAnchor = anchor;
    veil.append(patch);
  }
  stage.prepend(sea);
  stage.append(veil);
  setLightTheme(light);
  setGlyphOnly(styles.active?.glyph ?? false);
  engine = new OceanEngine(sea, styles.active?.fish.slice(0, styles.active.count) ?? [{kind:"classic",size:1},{kind:"classic",size:.86},{kind:"tiger",size:.64}], "immersive");
}

function refreshScene() {
  clearStage();
  sync();
}

export function mount() {
  if (observer) return;
  ensureStyle();
  window.addEventListener(changeEvent, refreshScene);
  observer = new MutationObserver(() => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; sync(); });
  });
  observer.observe(document.documentElement, { childList:true, subtree:true, attributes:true, attributeFilter:["class","data-theme","style"] });
  sync();
}

export function unmount() {
  window.removeEventListener(changeEvent, refreshScene);
  observer?.disconnect();
  observer = null;
  cancelAnimationFrame(frame);
  frame = 0;
  clearStage();
  document.getElementById(STYLE_ID)?.remove();
}

export const inject = ["slots"];

export function apply(ctx) {
  // 部分 DSH 配置停用了内置插件设置页，主设置页也提供同一入口。
  for (const slot of ["settings.section", "settings.plugins.tab"]) {
    ctx.slots.inject(slot, () => ctx.slots.register({
      name: slot, id: "dsh-sharks-skin.styles", order: 50, label: () => "鲨鱼皮肤"
    }, SharkSettings));
  }
  const start = () => {
    try { mount(); } catch (error) { console.warn("dsh-sharks-skin: 挂载失败", error); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
  ctx?.effect?.(() => () => unmount(), "sharks-skin: 海洋");
}
