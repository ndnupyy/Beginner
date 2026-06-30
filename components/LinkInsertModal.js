"use client";
// ============================================================
// 文件作用：插入链接弹窗
// 功能对应：ArticleEditor 工具栏「链接」按钮
// ============================================================

import { useState } from "react";
import "./LinkInsertModal.css";

export default function LinkInsertModal({
  open = true,
  onClose,
  onConfirm,
  initialUrl = "",
  initialText = "",
}) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  if (!open) return null;

  function handleConfirm() {
    onConfirm(url, text);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="link-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="link-modal" role="dialog" aria-modal="true">
        <div className="link-modal-header">
          <h3 className="link-modal-title">插入链接</h3>
          <button
            type="button"
            className="link-modal-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="link-modal-body">
          <label className="link-modal-field">
            <span className="link-modal-label">插入URL:</span>
            <input
              type="url"
              className="link-modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
            />
          </label>

          <label className="link-modal-field">
            <span className="link-modal-label">替换文本:</span>
            <input
              type="text"
              className="link-modal-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="链接显示文字"
            />
          </label>
        </div>

        <div className="link-modal-footer">
          <button
            type="button"
            className="link-modal-btn link-modal-btn-cancel"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="link-modal-btn link-modal-btn-confirm"
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
