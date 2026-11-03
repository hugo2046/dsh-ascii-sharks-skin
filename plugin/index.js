/**
 * Host 半区：刻意留空。
 *
 * 这一层存在的唯一理由，是让 dsh-client-modules 在扫 Loader 条目时能找到本包
 * （它会挑出声明了 dsh.client 的包并加载其浏览器半区）。皮肤是纯浏览器表面：
 * canvas、matchMedia、localStorage 在宿主进程里都不存在。
 */
export function apply() {
  /* no-op by design */
}
