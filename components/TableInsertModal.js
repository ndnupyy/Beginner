"use client";
// ============================================================
// 文件作用：插入表格弹窗（CSDN 表格属性）
// 功能对应：ArticleEditor 工具栏「表格」按钮
// ============================================================

import { useState } from "react";
import {
  DEFAULT_TABLE_OPTIONS,
  TABLE_ALIGN_OPTIONS,
  TABLE_HEADER_OPTIONS,
} from "@/lib/editorTable";
import "./TableInsertModal.css";

export default function TableInsertModal({
  open = true,
  onClose,
  onConfirm,
  initialOptions = DEFAULT_TABLE_OPTIONS,
}) {
  const [form, setForm] = useState(initialOptions);

  if (!open) return null;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleConfirm() {
    onConfirm(form);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="table-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="table-modal" role="dialog" aria-modal="true">
        <div className="table-modal-header">
          <h3 className="table-modal-title">表格属性</h3>
          <button
            type="button"
            className="table-modal-close"
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="table-modal-body">
          <div className="table-modal-grid">
            <label className="table-modal-field">
              <span className="table-modal-label">行数</span>
              <input
                type="number"
                className="table-modal-input"
                min={1}
                max={30}
                value={form.rows}
                onChange={(e) => updateField("rows", e.target.value)}
              />
            </label>

            <label className="table-modal-field">
              <span className="table-modal-label">宽度</span>
              <input
                type="number"
                className="table-modal-input"
                min={100}
                max={2000}
                value={form.width}
                onChange={(e) => updateField("width", e.target.value)}
              />
            </label>

            <label className="table-modal-field">
              <span className="table-modal-label">列数</span>
              <input
                type="number"
                className="table-modal-input"
                min={1}
                max={10}
                value={form.cols}
                onChange={(e) => updateField("cols", e.target.value)}
              />
            </label>

            <label className="table-modal-field">
              <span className="table-modal-label">高度</span>
              <input
                type="number"
                className="table-modal-input"
                min={40}
                max={2000}
                value={form.height}
                onChange={(e) => updateField("height", e.target.value)}
                placeholder=""
              />
            </label>

            <label className="table-modal-field">
              <span className="table-modal-label">标题单元格</span>
              <select
                className="table-modal-input"
                value={form.headerType}
                onChange={(e) => updateField("headerType", e.target.value)}
              >
                {TABLE_HEADER_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="table-modal-field">
              <span className="table-modal-label">间距</span>
              <input
                type="number"
                className="table-modal-input"
                min={0}
                max={20}
                value={form.cellspacing}
                onChange={(e) => updateField("cellspacing", e.target.value)}
              />
            </label>

            <label className="table-modal-field">
              <span className="table-modal-label">边框</span>
              <input
                type="number"
                className="table-modal-input"
                min={0}
                max={10}
                value={form.border}
                onChange={(e) => updateField("border", e.target.value)}
              />
            </label>

            <label className="table-modal-field">
              <span className="table-modal-label">边距</span>
              <input
                type="number"
                className="table-modal-input"
                min={0}
                max={40}
                value={form.cellpadding}
                onChange={(e) => updateField("cellpadding", e.target.value)}
              />
            </label>
          </div>

          <label className="table-modal-field table-modal-field-full">
            <span className="table-modal-label">对齐方式</span>
            <select
              className="table-modal-input"
              value={form.align}
              onChange={(e) => updateField("align", e.target.value)}
            >
              {TABLE_ALIGN_OPTIONS.map((item) => (
                <option key={item.value || "unset"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="table-modal-field table-modal-field-full">
            <span className="table-modal-label">标题</span>
            <input
              type="text"
              className="table-modal-input"
              value={form.caption}
              onChange={(e) => updateField("caption", e.target.value)}
            />
          </label>

          <label className="table-modal-field table-modal-field-full">
            <span className="table-modal-label">摘要</span>
            <input
              type="text"
              className="table-modal-input"
              value={form.summary}
              onChange={(e) => updateField("summary", e.target.value)}
            />
          </label>
        </div>

        <div className="table-modal-footer">
          <button
            type="button"
            className="table-modal-btn table-modal-btn-cancel"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="table-modal-btn table-modal-btn-confirm"
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
