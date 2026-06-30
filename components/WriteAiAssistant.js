"use client";
// ============================================================
// 文件作用：发布文章页右侧 AI 助手（对话 + 大纲/代码模板）
// 功能对应：/write、/edit 页面右侧栏
// 维护指引：
//   - 样式 → WriteAiAssistant.css
//   - API → app/api/ai/chat/route.js
// ============================================================

import { useEffect, useRef, useState } from "react";
import { renderMessageContent } from "@/components/aiChatRender";
import "./WriteAiAssistant.css";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "你好，我是 AI 写作助手。你可以自由提问，或点「大纲生成」「代码生成」，在输入框内直接填写蓝色占位槽，再发送。",
};

const TEMPLATE_OPTIONS = [
  { key: "outline", label: "大纲生成", icon: "outline" },
  { key: "code", label: "代码生成", icon: "code" },
];

const TEMPLATE_META = Object.fromEntries(
  TEMPLATE_OPTIONS.map((item) => [item.key, item])
);

/**
 * 模式按钮 / 下拉项图标
 * @param {{ type: 'outline' | 'code' }} props
 */
function ModeIcon({ type }) {
  if (type === "code") {
    return (
      <span className="write-ai-mode-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M5.2 4.5 3 8l2.2 3.5M10.8 4.5 13 8l-2.2 3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 4 6.8 12"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span className="write-ai-mode-icon" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="3.5" cy="4.5" r="0.9" fill="currentColor" />
        <rect x="5.5" y="4" width="7" height="1" rx="0.5" fill="currentColor" />
        <circle cx="3.5" cy="8" r="0.9" fill="currentColor" />
        <rect x="5.5" y="7.5" width="7" height="1" rx="0.5" fill="currentColor" />
        <circle cx="3.5" cy="11.5" r="0.9" fill="currentColor" />
        <rect x="5.5" y="11" width="7" height="1" rx="0.5" fill="currentColor" />
        <path
          d="m11.5 10.5 1.2 1.2 2.3-2.8"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function buildOutlinePrompt(topic) {
  return `帮我写一篇关于 ${topic.trim()} 的技术文章大纲`;
}

function buildCodePrompt(language, requirement) {
  return `请生成一段 ${language.trim()} 代码，实现以下功能：${requirement.trim()}`;
}

/**
 * 根据当前模板模式与各槽位值，拼出最终要发送的 prompt 文本
 * @param {string} mode - outline | code | ""
 * @param {{ outlineTopic: string, codeLanguage: string, codeRequirement: string }} slots
 * @returns {string}
 */
function composePrompt(mode, slots) {
  if (mode === "outline") {
    return buildOutlinePrompt(slots.outlineTopic);
  }
  if (mode === "code") {
    return buildCodePrompt(slots.codeLanguage, slots.codeRequirement);
  }
  return "";
}

/**
 * 校验模板槽位是否已填写
 * @returns {{ ok: boolean, message: string, focusKey?: string }}
 */
function validateTemplate(mode, slots) {
  if (mode === "outline") {
    if (!slots.outlineTopic.trim()) {
      return { ok: false, message: "请填写文章主题", focusKey: "outlineTopic" };
    }
    return { ok: true, message: "" };
  }
  if (mode === "code") {
    if (!slots.codeLanguage.trim()) {
      return { ok: false, message: "请填写编程语言", focusKey: "codeLanguage" };
    }
    if (!slots.codeRequirement.trim()) {
      return { ok: false, message: "请填写代码功能要求", focusKey: "codeRequirement" };
    }
    return { ok: true, message: "" };
  }
  return { ok: true, message: "" };
}

/**
 * 内联槽位输入：宽度随当前文字（无内容时用 placeholder 宽度）
 * @param {object} props
 * @param {import('react').RefObject} props.inputRef
 */
function PromptSlotInput({
  inputRef,
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  ariaLabel,
}) {
  const measureText = value || placeholder || "\u00a0";

  return (
    <span className="write-ai-slot-wrap">
      <span className="write-ai-slot-measure" aria-hidden="true">
        {measureText}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="write-ai-slot"
        size={1}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
      />
    </span>
  );
}

export default function WriteAiAssistant() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [templateMode, setTemplateMode] = useState("");
  const [outlineTopic, setOutlineTopic] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("");
  const [codeRequirement, setCodeRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const modeMenuRef = useRef(null);
  const outlineSlotRef = useRef(null);
  const codeLangSlotRef = useRef(null);
  const codeReqSlotRef = useRef(null);
  const slotRefs = {
    outlineTopic: outlineSlotRef,
    codeLanguage: codeLangSlotRef,
    codeRequirement: codeReqSlotRef,
  };

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    if (!modeMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!modeMenuRef.current?.contains(event.target)) {
        setModeMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [modeMenuOpen]);

  function focusTemplateSlot(mode) {
    requestAnimationFrame(() => {
      if (mode === "outline") outlineSlotRef.current?.focus();
      if (mode === "code") codeLangSlotRef.current?.focus();
    });
  }

  function openTemplate(mode) {
    setTemplateMode(mode);
    setInput("");
    setError("");
    setModeMenuOpen(false);
    setOutlineTopic("");
    setCodeLanguage("");
    setCodeRequirement("");
    focusTemplateSlot(mode);
  }

  function switchTemplateMode(mode) {
    if (mode === templateMode) {
      setModeMenuOpen(false);
      return;
    }
    setTemplateMode(mode);
    setError("");
    setModeMenuOpen(false);
    focusTemplateSlot(mode);
  }

  function closeTemplate() {
    setTemplateMode("");
    setOutlineTopic("");
    setCodeLanguage("");
    setCodeRequirement("");
    setError("");
    setModeMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function getSlots() {
    return { outlineTopic, codeLanguage, codeRequirement };
  }

  function focusSlot(key) {
    slotRefs[key]?.current?.focus();
  }

  async function handleSend() {
    let text = input.trim();

    if (templateMode) {
      const slots = getSlots();
      const check = validateTemplate(templateMode, slots);
      if (!check.ok) {
        setError(check.message);
        if (check.focusKey) focusSlot(check.focusKey);
        return;
      }
      text = composePrompt(templateMode, slots).trim();
    }

    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setTemplateMode("");
    setOutlineTopic("");
    setCodeLanguage("");
    setCodeRequirement("");
    setModeMenuOpen(false);
    setError("");
    setLoading(true);

    try {
      const history = nextMessages.slice(1);
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "请求失败，请稍后重试");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
      setMessages((current) => current.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleFreeInputKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function handleCodeLangKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      codeReqSlotRef.current?.focus();
    }
  }

  function handleSlotSendKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const canSend = templateMode
    ? Boolean(
        templateMode === "outline"
          ? outlineTopic.trim()
          : codeLanguage.trim() && codeRequirement.trim()
      )
    : Boolean(input.trim());

  return (
    <aside className="write-ai-assistant" aria-label="AI 助手">
      <div className="write-ai-header">
        <div className="write-ai-header-title">
          <span className="write-ai-logo" aria-hidden="true">
            ✦
          </span>
          <span>AI 助手</span>
        </div>
        <span className="write-ai-disclaimer">内容由 AI 生成，仅供参考</span>
      </div>

      <div className="write-ai-panel">
        <div className="write-ai-messages" ref={listRef}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`write-ai-message write-ai-message--${message.role}`}
            >
              <div className="write-ai-avatar">
                {message.role === "user" ? "我" : "AI"}
              </div>
              <div className="write-ai-bubble">
                {renderMessageContent(message.content)}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="write-ai-message write-ai-message--assistant">
              <div className="write-ai-avatar">AI</div>
              <div className="write-ai-bubble write-ai-bubble--loading">
                <span className="write-ai-dot" />
                <span className="write-ai-dot" />
                <span className="write-ai-dot" />
              </div>
            </div>
          ) : null}
        </div>

        {error ? <div className="write-ai-error">{error}</div> : null}

        <div className="write-ai-compose">
          {!templateMode ? (
            <div className="write-ai-mode-row">
              {TEMPLATE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className="write-ai-mode-btn"
                  onClick={() => openTemplate(option.key)}
                  disabled={loading}
                >
                  <ModeIcon type={option.icon} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div
            className={`write-ai-input-wrap${
              templateMode ? " write-ai-input-wrap--template" : ""
            }`}
          >
            {templateMode ? (
              <>
                <div className="write-ai-template-bar">
                  <div className="write-ai-mode-dropdown" ref={modeMenuRef}>
                    <button
                      type="button"
                      className="write-ai-mode-dropdown-trigger"
                      onClick={() => setModeMenuOpen((open) => !open)}
                      aria-expanded={modeMenuOpen}
                      aria-haspopup="listbox"
                    >
                      <ModeIcon type={TEMPLATE_META[templateMode].icon} />
                      <span>{TEMPLATE_META[templateMode].label}</span>
                      <svg
                        className={`write-ai-mode-chevron${
                          modeMenuOpen ? " write-ai-mode-chevron-open" : ""
                        }`}
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 4.5 6 8l3.5-3.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </button>

                    {modeMenuOpen ? (
                      <div className="write-ai-mode-dropdown-menu" role="listbox">
                        {TEMPLATE_OPTIONS.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            role="option"
                            aria-selected={templateMode === option.key}
                            className={`write-ai-mode-dropdown-item${
                              templateMode === option.key
                                ? " write-ai-mode-dropdown-item-active"
                                : ""
                            }`}
                            onClick={() => switchTemplateMode(option.key)}
                          >
                            <ModeIcon type={option.icon} />
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="write-ai-template-close"
                    onClick={closeTemplate}
                    aria-label="关闭模板"
                  >
                    ×
                  </button>
                </div>

                <div className="write-ai-prompt-editor" role="group">
                  {templateMode === "outline" ? (
                    <p className="write-ai-prompt-line">
                      <span className="write-ai-prompt-text">帮我写一篇关于</span>
                      <PromptSlotInput
                        inputRef={outlineSlotRef}
                        value={outlineTopic}
                        onChange={(event) => {
                          setOutlineTopic(event.target.value);
                          setError("");
                        }}
                        onKeyDown={handleSlotSendKeyDown}
                        placeholder="输入主题内容"
                        disabled={loading}
                        ariaLabel="文章主题"
                      />
                      <span className="write-ai-prompt-text">的技术文章大纲</span>
                    </p>
                  ) : null}

                  {templateMode === "code" ? (
                    <p className="write-ai-prompt-line">
                      <span className="write-ai-prompt-text">请生成一段</span>
                      <PromptSlotInput
                        inputRef={codeLangSlotRef}
                        value={codeLanguage}
                        onChange={(event) => {
                          setCodeLanguage(event.target.value);
                          setError("");
                        }}
                        onKeyDown={handleCodeLangKeyDown}
                        placeholder="输入编程语言"
                        disabled={loading}
                        ariaLabel="编程语言"
                      />
                      <span className="write-ai-prompt-text">
                        代码，实现以下功能：
                      </span>
                      <PromptSlotInput
                        inputRef={codeReqSlotRef}
                        value={codeRequirement}
                        onChange={(event) => {
                          setCodeRequirement(event.target.value);
                          setError("");
                        }}
                        onKeyDown={handleSlotSendKeyDown}
                        placeholder="输入代码要求"
                        disabled={loading}
                        ariaLabel="代码功能要求"
                      />
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <textarea
                ref={inputRef}
                className="write-ai-input"
                rows={3}
                placeholder="输入创作要求，AI 助你写…"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleFreeInputKeyDown}
                disabled={loading}
              />
            )}

            <button
              type="button"
              className="write-ai-send-btn"
              onClick={handleSend}
              disabled={loading || !canSend}
              aria-label="发送"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
