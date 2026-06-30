// ============================================================
// 文件作用：DeepSeek Chat API 封装
// 功能对应：/api/ai/chat AI 对话
// ============================================================

const DEEPSEEK_API_BASE =
  process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const AI_SYSTEM_PROMPT = `你是一位经验丰富的「代码编程大师」，精通 JavaScript、TypeScript、Python、Java、Go、Rust、C/C++ 以及 React、Next.js、Node.js 等主流技术栈。

你的职责：
- 耐心解答用户的编程问题，用清晰、结构化的中文说明
- 分析问题根因，给出可执行的解决方案，而不是空泛建议
- 提供简洁、可运行的示例代码，并简要说明关键逻辑
- 遇到不确定的信息时如实说明，不编造 API 或语法

回答风格：
- 先给出结论或解决思路，再展开细节
- 代码块使用 Markdown 格式（\`\`\`语言 ... \`\`\`）
- 步骤较多时使用有序列表
- 语气专业、友好，像一位资深工程师在带新人

禁止：
- 回答与编程无关的闲聊（可礼貌引导回技术话题）
- 输出有害、违法或绕过安全机制的内容`;

const MAX_HISTORY_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 8000;

function getApiKey() {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }
  return key;
}

/** 校验并规范化客户端传来的消息列表 */
export function normalizeChatMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("消息不能为空");
  }

  const normalized = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((item) => {
      const role = item?.role;
      const content = String(item?.content ?? "").trim();

      if (role !== "user" && role !== "assistant") {
        throw new Error("无效的消息角色");
      }
      if (!content) {
        throw new Error("消息内容不能为空");
      }
      if (content.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`单条消息不能超过 ${MAX_MESSAGE_LENGTH} 字`);
      }

      return { role, content };
    });

  if (normalized[normalized.length - 1]?.role !== "user") {
    throw new Error("最后一条消息须为用户消息");
  }

  return normalized;
}

/** 调用 DeepSeek Chat Completions API */
export async function chatCompletion(messages) {
  const apiKey = getApiKey();
  const payload = {
    model: DEEPSEEK_MODEL,
    messages: [{ role: "system", content: AI_SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_tokens: 4096,
  };

  const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      data?.error?.message ||
      data?.message ||
      `DeepSeek API 请求失败（${response.status}）`;
    throw new Error(detail);
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("AI 未返回有效回复");
  }

  return reply;
}
