# 中文字幕与关键词时间轴

正文与断句来自 `user-provided.txt`：129 个原文片段；间奏不显示，其余 128 个中英片段逐行呈现，保持大小写、用词、重复次数和顺序。DIMENSION、CIRCUMFERENCE、TANGENTS、EXECUTION 等关键词各自独立显示。最后一个 EXECUTION 的中文沿用用户前一份完整参考中的“执行死刑”。

`source-timing.lrc` 是用户原始 LRC 的句子时间，去除了文件标签；`phrase-timing.lrc` 保存用户提供的 ASCII 参考项目中的英文行及细分时间，只用于确定句内关键词的相对位置，不使用该项目的中文译文。

生成时按全曲字母流对齐，保留能对应到同一行起点的原始时间。在相邻句子锚点之间，用细分时间插值补齐行起点。16.04 秒清空字幕，保留原来的三个清屏点。输出数据不包含播放延时，播放器和图形统一加 `LYRIC_DELAY = 0.5`，不会重复延后。

`npm run prepare:captions` 无需音频即可重新生成 `dist/media/cues.json` 与 `cues.mjs`。这两份文本随仓库保留，使全新副本可以直接加载图形和进行测试。`full/beats.mjs` 直接读取同一份数据，让图形变化与每次 EXECUTION 对齐关键词起点。

测试覆盖逐行一致性、精确起点、单次延时、动作对应关系及单光标写入顺序。原曲与歌词属于 Mili《world.execute(me);》，本说明记录来源关系，不授予额外使用许可。
