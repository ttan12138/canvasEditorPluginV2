// 构建并复制的映射配置
//
// options:
//   build    : 是否先执行 pnpm build（默认 true，设 false 可只复制已有 dist）
//   clean    : 复制前是否清空目标目录（默认 true）
//   parallel : 是否并行构建（默认 false，更快但日志交错；包有相互依赖时设为 false）
//
// map: 包名(或 packages 下的目录名) -> 目标目录
//   目标目录支持相对仓库根的路径，或绝对路径
export default {
  options: {
    build: true,
    clean: true,
    parallel: false,
  },

  // ===== 在这里配置：哪些包 -> 复制到哪些目录 =====
  // key 支持：完整包名 / packages 下目录名 / 包名后缀（如 canvas-editor-plugin-docx）
  // value 支持：相对仓库根的路径，或绝对路径（跨项目复制）
  map: {
    // '@hufe921/canvas-editor-plugin-ofd': 'dist-out/ofd',

    // docx 插件 -> 复制到另一个项目 canvasEditorV2 的 src/plugins/docx
    'canvas-editor-plugin-docx':
      'D:/dataup/test/newcanvaseditor/canvasEditorV2/src/plugins/docx',

    // 更多示例（按需取消注释 / 增删）：
    // 'docx': 'D:/other-project/vendor/docx',
    // '@hufe921/canvas-editor-plugin-barcode1d': 'dist-out/barcode1d',
  },
}
