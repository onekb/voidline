# VOIDLINE — a monochrome descent / 单色下潜

A compact 2D side-scrolling action roguelite in **black, white and gray**, built in a
single sitting. Pure Canvas 2D + Web Audio synthesis — **zero external assets**, two files.
**Bilingual: English / 简体中文** (custom 3×5 pixel font for Latin, bitmap-style CJK rendering).

## Play

**Online: https://www.byte.lol/voidline/** (GitHub Pages · repo: [onekb/voidline](https://github.com/onekb/voidline))

Or run locally: open `index.html` in any desktop browser, or `python3 -m http.server 8642`
and visit `http://localhost:8642/index.html`. Chrome/Firefox/Edge/Safari, keyboard required.

## Language / 语言

- `T` — switch language at any time (menus, HUD, combat floats, even mid-run)
- First launch auto-detects your browser language; choice persists (localStorage `vl_lang`)
- Force via URL: `index.html?lang=zh` or `?lang=en`

## Controls

| Action | Keys |
|---|---|
| Move | `A` / `D` or `←` / `→` |
| Jump (×2, coyote time + input buffer) | `Space` / `W` / `↑` |
| Dodge roll (i-frames) | `Shift` or `V` |
| Melee attack (combo) | `J` or `Z` |
| Bow (hold = piercing heavy shot) | `K` or `X` |
| Skill | `L` or `C` |
| Pause / Restart / Mute / Language | `P` / `R` / `M` / `T` |
| Menus | `A`/`D` + `J`, or `J`/`K`/`L` directly |

## The run (5–10 min)

1. Pick a **blade** — each defines your crit:
   - **Twin Fangs 双牙** — 3-hit dagger combo. Crit: **backstab** (×2.2).
   - **Ash Spear 灰烬长枪** — long thrust. Crit: **tip hit at max range** (×2).
   - **Gravelord Blade 坟主巨刃** — slow greatsword arcs. Crit: **hit 2+ enemies at once** (×1.8).
2. Pick a **discipline** (cooldown skill): Skyfall 天坠 (AoE + stun), Rift Dash 裂隙突进
   (i-frame dash), Pale Nova 苍白新星 (burst).
3. Descend 3 procedurally-stitched levels of curated modules: spike pits, ledges,
   torch-lit dark, **hidden rooms** behind cracked fake walls, and **sealed challenge
   zones** (gates lock, waves attack, rare reward on clear).
4. Every gate cleared = **choose 1 of 3 relics**. Relics are built for synergy, not raw stats:
   roll → Adrenaline-empowered hit → Killer Instinct resets the roll; Riposte rewards
   dodging *through* attacks with a guaranteed crit; Hemorrhage bursts at 4 bleed stacks.
5. **The Ashen Monarch 灰烬君主** — a 3-phase boss. Telegraphed slam combos (jump the shockwaves),
   arena-crossing rushes (punish the wall stagger), and at 60%/25% the fight changes:
   ink pillars rise as cover, the Monarch starts skyfall crashes that *destroy* that cover,
   and the final phase adds radial nova rings. Kill it before it kills you.

Red is always danger. Gold is always reward. Your light is small; the dark is not.

## Debug params

`?boss` start at the boss · `?lvl=N` start at level N · `?god` invincibility ·
`?lang=zh|en` language (combinable, e.g. `index.html?boss&god&lang=zh`).

## Files

- `index.html` — shell + pixel-perfect canvas scaling
- `game.js` — the entire game (~2,000 lines): physics, combat, gen, AI, boss, UI, i18n, synth audio

---

## 开发记录 / Build Notes

| 项目 | 内容 |
|---|---|
| 开发日期 | 2026-10-08 |
| 发布 | GitHub Pages：https://www.byte.lol/voidline/ · 仓库：onekb/voidline |
| 模型 | **GLM-5.3-Flash**（Z.ai BigModel · bigmodel-individual-coding-plan） |
| 智能体 / 工具 | ZCode（编码 + 浏览器自动化实机测试） |
| 挑战规则 | 一小时内从零做出可玩的完整 Roguelite |
| 实际产出 | `index.html` + `game.js`（约 2,000 行），零外部资源，全部画面程序化绘制、音效音乐 WebAudio 实时合成 |

### Changelog

- **v1.0（2026-10-08）** — 核心完整闭环：标题 → 武器/流派选择 → 三个程序化关卡（尖刺坑、暗巷、隐藏房间、锁门挑战区）→ 三选一遗物 → 三阶段 Boss「灰烬君主」→ 胜利/死亡快速重开。动作手感全套：土狼时间、输入缓冲、无敌帧翻滚、打击停顿、受击闪白、击退、克制屏震、残影、动态光照。中英双语 + `T` 键实时切换。
- 开发全程由浏览器自动化驱动实机验收：每个系统（战斗、挑战区、假墙、Boss 三阶段、胜利结算）截图验证，并据实测修复了 Boss 冷却、Boss 房相机、挑战区生成、波次数据嵌套、暂停遗物列表缺参等 10+ 个问题。

### 提示词记录

- 原始需求（游戏设计规格，英文原文）见下方附录。
- 追加需求：「支持多语言」→ 实现中英双语与 `T` 键实时切换（本次更新）。
- 追加需求：「写 readme 把当前模型和最开始我的提示词都记录下来」→ 本章节。

---

## 附录：原始提示词 / Original Prompt (verbatim)

<details>
<summary><strong>One-hour game development challenge — the brief that started it all</strong>（点击展开 / click to expand）</summary>

> We aim to create a 2D side-scrolling action Roguelite with a unique visual style, drawing gameplay inspiration from *Dead Cells*. This is a one-hour game development challenge; please give it your all and prioritize crafting a compact, polished, and highly replayable complete experience.
>
> **Art and Visuals:** Adopt a minimalist pixel-art style using only black, white, and gray. Create a sense of tension and strong visual impact through bold silhouettes, clear contrast, and distinctive environmental outlines. Use accent colors sparingly—reserved for attacks, danger warnings, rare rewards, and key locations—to ensure color conveys specific gameplay information. Employ dynamic lighting, particles, motion trails, and environmental details to ensure the visuals are minimalist yet sophisticated rather than crude. Ensure the player, enemies, platforms, and attack ranges remain easily distinguishable at all times, avoiding visual clutter that obscures combat.
>
> **Movement and Combat:** Focus on responsive, fluid, and precise controls, including movement, jumping, double-jumping, a dodge-roll with brief invincibility frames, and both melee and ranged attacks. Ensure smooth platforming by implementing "coyote time" (jump forgiveness), input buffering, and logical animation transitions. Attacks must feature clear wind-up, hit feedback, and recovery phases; create a satisfying sense of impact through mechanics like hit-stop, "hit-flash" (flashing white upon taking damage), knockback, restrained screen shake, and weighty sound effects. Dodging, positioning, and timing must be strategically meaningful to prevent combat from devolving into mindless button-mashing while standing still.
>
> **Weapons and In-Run Builds:** Design a small set of weapons and skills with distinct characteristics—such as rapid-striking daggers, slow but high-damage heavy swords, bows suited for kiting, and crowd-control or burst-damage skills. Each weapon should possess a unique attack rhythm and specific conditions for critical hits, such as backstabs, striking crowd-controlled enemies, or follow-up attacks. **Buffs & Upgrades:** Enhancements should alter playstyles and create synergies rather than merely boosting raw damage numbers—examples include empowering the next attack after a dodge, triggering a burst effect via stacked bleed status, or resetting a mobility skill upon a kill. Offer clear "pick-one-of-three" rewards, enabling players to form distinct builds within short sessions and feel immediate progression.
>
> **Enemies & Levels:** Design enemies with clear roles and readable attack patterns, such as melee pursuers, ranged suppressors, shield-bearers, and highly mobile ambushers. Create tactical variety through enemy combinations, verticality, traps, and cover. Levels should use curated modules combined procedurally, featuring branching paths, hidden rewards, and high-risk, high-reward challenge zones. Ensure exploration is well-paced, avoiding tedious backtracking or repetitive mob clearing.
>
> **Boss Battles:** Create at least one polished, multi-phase boss fight. The boss should feature clear attack telegraphs, require varied responses, and offer exploitable windows; phase transitions should alter the combat rhythm or arena conditions rather than simply inflating health and damage. Victory should be earned through observation, dodging, and counter-attacking, fostering a challenge that feels intense yet fair.
>
> **UI/UX & Audio:** Keep the interface restrained and clear, highlighting health, skill cooldowns, weapon traits, and the current build. Reward choices must be easy to compare, and the game should allow for a quick restart after defeat. Use textured, punchy, and crisp sound effects for impacts, blade strikes, and the environment, avoiding harsh retro-electronic beeps. Music and ambient audio should complement the pacing of exploration and combat; manage the audio mix to ensure danger cues remain audible.
>
> **Competition Deliverables:** Prioritize implementing the core gameplay loop—exploration, combat, reward acquisition, build progression, boss challenge, and victory or death/restart—within one hour of development time. Aim for a session length of 5–10 minutes, showcasing the core experience through a small amount of high-quality content. Focus first on movement feel, combat feedback, build synergies, and the boss fight before expanding the content. Do not simply copy the characters, art, or levels of *Dead Cells*; instead, create your own theme and unique mechanics. Please implement a playable product directly, rather than stopping at design documents or static demos.

</details>
