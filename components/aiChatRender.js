// ============================================================
// 文件作用：AI 对话消息内容渲染（代码块 + 换行）
// 功能对应：AiChat.js、WriteAiAssistant.js
// ============================================================

export function renderMessageContent(content) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const firstLineBreak = inner.indexOf("\n");
      let language = "";
      let code = inner;

      if (firstLineBreak !== -1) {
        const firstLine = inner.slice(0, firstLineBreak).trim();
        if (/^[\w+#.-]+$/.test(firstLine)) {
          language = firstLine;
          code = inner.slice(firstLineBreak + 1);
        }
      }

      return (
        <pre key={index} className="ai-chat-code">
          {language ? (
            <span className="ai-chat-code-lang">{language}</span>
          ) : null}
          <code>{code.trim()}</code>
        </pre>
      );
    }

    return part.split("\n").map((line, lineIndex) => (
      <span key={`${index}-${lineIndex}`}>
        {lineIndex > 0 ? <br /> : null}
        {line}
      </span>
    ));
  });
}
