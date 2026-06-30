"use client";
// ============================================================
// 文件作用：代码块右键菜单（剪切 / 复制 / 粘贴 / 删除）
// 功能对应：ArticleEditor 内代码块交互
// ============================================================

import { useEffect, useRef } from "react";
import "./CodeBlockContextMenu.css";

const MENU_ITEMS_BY_TYPE = {
  codeBlock: [
    { id: "cut", label: "剪切", shortcut: "Ctrl+X" },
    { id: "copy", label: "复制", shortcut: "Ctrl+C" },
    { id: "paste", label: "粘贴", shortcut: "Ctrl+V" },
    { id: "delete", label: "删除", shortcut: "", divider: true },
  ],
  table: [
    { id: "cut", label: "剪切", shortcut: "Ctrl+X" },
    { id: "copy", label: "复制", shortcut: "Ctrl+C" },
    { id: "delete", label: "删除", shortcut: "", divider: true },
  ],
};

export default function CodeBlockContextMenu({
  open,
  x,
  y,
  targetType = "codeBlock",
  onAction,
  onClose,
}) {
  const menuRef = useRef(null);
  const menuItems = MENU_ITEMS_BY_TYPE[targetType] || MENU_ITEMS_BY_TYPE.codeBlock;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target)) return;
      onClose();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", onClose, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const padding = 8;
    let left = x;
    let top = y;

    if (left + rect.width > window.innerWidth - padding) {
      left = window.innerWidth - rect.width - padding;
    }
    if (top + rect.height > window.innerHeight - padding) {
      top = window.innerHeight - rect.height - padding;
    }

    menu.style.left = `${Math.max(padding, left)}px`;
    menu.style.top = `${Math.max(padding, top)}px`;
  }, [open, x, y]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="code-block-context-menu"
      style={{ left: x, top: y }}
      role="menu"
    >
      {menuItems.map((item) => (
        <div key={item.id}>
          {item.divider && <div className="code-block-context-divider" />}
          <button
            type="button"
            className={`code-block-context-item${
              item.id === "delete" ? " is-danger" : ""
            }`}
            role="menuitem"
            onClick={() => onAction(item.id)}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="code-block-context-shortcut">{item.shortcut}</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
