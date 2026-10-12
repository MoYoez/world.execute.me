# 素材与参考来源

本项目是 Mili《world.execute(me);》的非官方、AI 辅助制作的网页演出。当前设计以可变形图形、Java / Python 同屏源码及光标关系为主，详见 `docs/current-design.md`。

## 音乐与原版 MV

- [Mili 官方 MV](https://www.youtube.com/watch?v=ESx_hy1n7HA)：歌曲版本与 Java 叙事参考。
- [《Miracle Milk》官方专辑页](https://projectmili.com/miracle-milk)。
- [OTOTOY 原版专辑页](https://ototoy.jp/_/default/p/100105)：用户确认的音源入口。
- [Mili 官方使用说明](https://projectmili.com/copyright-guidelines)。

制作时使用用户提供的原版 FLAC，实测长 211.906667 秒、44.1 kHz、双声道。音频、转码文件和带音乐的 MP4 仅保存在本地，不进入 Git。网页默认由观看者选择自己的音频，在浏览器中读取，不上传。

## 歌词与时间轴

中文及断句直接采用用户提供的版本。`translations/source-timing.lrc` 保留用户原始 LRC 的句子时间；`translations/phrase-timing.lrc` 来自用户提供的 ASCII 参考项目，用于细分关键词。两者的用途和对齐方式见 [字幕说明](translations/README.md)。

早期检索过其他时间轴，但当前演出不使用它们。所有关键词动作均以当前生成的 `dist/media/cues.mjs` 为准。

## 图形与代码

本项目自行绘制动画及 IDE 界面。Java 叙事致敬原版 MV，编辑器布局参考 IntelliJ IDEA；源码、事件调度和图形互动为本项目实现。训练是三个形状参数的数值优化，不是实际 LLM 训练。

Music & lyrics by **Mili**. **AI-assisted fan animation / Unofficial.** 本记录说明来源，不替代相关权利人的授权。
