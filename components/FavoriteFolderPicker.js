"use client";
// ============================================================
// 文件作用：收藏时选择收藏夹对话框
// 功能对应：文章详情页收藏按钮（存在多个收藏夹时弹出）
// 维护指引：
//   - 样式 → FavoriteFolderPicker.css
//   - 收藏 API → POST /api/articles/[id]/reactions { type, folderId }
// ============================================================

import { useEffect, useState } from "react";
import "./FavoriteFolderPicker.css";

/**
 * FavoriteFolderPicker - 选择收藏夹弹窗
 * @param {Object} props
 * @param {boolean} props.open - 是否显示
 * @param {Array<{id:string,name:string,isDefault:boolean}>} props.folders - 可选收藏夹
 * @param {() => void} props.onClose - 关闭回调
 * @param {(folderId: string) => void} props.onConfirm - 确认收藏到某收藏夹
 */
export default function FavoriteFolderPicker({
  open,
  folders = [],
  onClose,
  onConfirm,
}) {
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (open && folders.length > 0) {
      const defaultFolder = folders.find((folder) => folder.isDefault);
      setSelectedId(defaultFolder?.id || folders[0].id);
    }
  }, [open, folders]);

  if (!open) return null;

  function handleConfirm() {
    if (!selectedId) return;
    onConfirm(selectedId);
  }

  return (
    <div className="favorite-picker-overlay" onClick={onClose}>
      <div
        className="favorite-picker-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="favorite-picker-title"
      >
        <h3 id="favorite-picker-title" className="favorite-picker-title">
          选择收藏夹
        </h3>
        <p className="favorite-picker-desc">请选择要收藏到的文件夹</p>

        <ul className="favorite-picker-list">
          {folders.map((folder) => (
            <li key={folder.id}>
              <label className="favorite-picker-item">
                <input
                  type="radio"
                  name="favorite-folder"
                  value={folder.id}
                  checked={selectedId === folder.id}
                  onChange={() => setSelectedId(folder.id)}
                />
                <span className="favorite-picker-item-name">{folder.name}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="favorite-picker-actions">
          <button
            type="button"
            className="favorite-picker-btn favorite-picker-btn-cancel"
            onClick={onClose}
          >
            取消
          </button>
          <button
            type="button"
            className="favorite-picker-btn favorite-picker-btn-confirm"
            onClick={handleConfirm}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
