"use client";
// ============================================================
// 文件作用：插入代码弹窗（CSDN 风格，无标题栏）
// 功能对应：ArticleEditor 工具栏「代码」按钮
// ============================================================

import { useState } from "react";
import { CODE_LANGUAGES } from "@/lib/tiptapCodeBlock";
import "./CodeInsertModal.css";

export default function CodeInsertModal({
  open = true,
  onClose,
  onConfirm,
  initialCode = "",
  initialLanguage = "javascript",
}) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage || "javascript");

  if (!open) return null;

  function handleConfirm() {
    onConfirm(code, language);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="code-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="code-modal" role="dialog" aria-modal="true">
        <button
          type="button"
          className="code-modal-close"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>

        <div className="code-modal-body">
          <div className="code-modal-editor-wrap">
            <select
              className="code-modal-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="选择代码语言"
            >
              <option value="" disabled>
                选择代码语言
              </option>
              {CODE_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <textarea
              className="code-modal-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入代码..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className="code-modal-footer">
          <button
            type="button"
            className="code-modal-btn code-modal-btn-cancel"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="code-modal-btn code-modal-btn-confirm"
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
