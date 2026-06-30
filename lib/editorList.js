// ============================================================
// 文件作用：TipTap 列表命令（按行独立设置有序/无序列表）
// 功能对应：ArticleEditor 列表下拉菜单
// 维护指引：避免 toggleList 整段转换，仅影响当前行
// ============================================================

const LIST_NAMES = {
  ordered: "orderedList",
  bullet: "bulletList",
};

function findListContext(state) {
  const { $from } = state.selection;
  let listItemDepth = null;
  let listDepth = null;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const name = $from.node(depth).type.name;
    if (name === "listItem") {
      listItemDepth = depth;
    }
    if (name === "orderedList" || name === "bulletList") {
      listDepth = depth;
    }
  }

  if (listItemDepth === null || listDepth === null) {
    return null;
  }

  if (listItemDepth !== listDepth + 1) {
    return null;
  }

  return {
    listNode: $from.node(listDepth),
    listType: $from.node(listDepth).type.name,
    itemIndex: $from.index(listDepth),
    listPos: $from.before(listDepth),
    listEnd: $from.before(listDepth) + $from.node(listDepth).nodeSize,
  };
}

function splitListAroundItem(ctx, middleNodes, schema) {
  const { listNode, listType, itemIndex } = ctx;
  const listTypeNode = schema.nodes[listType];
  const nodes = [];

  const before = [];
  const after = [];
  for (let i = 0; i < listNode.childCount; i += 1) {
    if (i < itemIndex) before.push(listNode.child(i));
    if (i > itemIndex) after.push(listNode.child(i));
  }

  if (before.length > 0) {
    nodes.push(listTypeNode.create(listNode.attrs, before));
  }

  nodes.push(...middleNodes);

  if (after.length > 0) {
    nodes.push(listTypeNode.create(listNode.attrs, after));
  }

  return nodes;
}

function unwrapListItemContent(listItem) {
  const nodes = [];
  listItem.forEach((child) => nodes.push(child));
  return nodes;
}

function convertCurrentItemListType(tr, state, targetListName) {
  const ctx = findListContext(state);
  if (!ctx) return false;

  const { schema } = state;
  const { listNode, listType, itemIndex, listPos, listEnd } = ctx;
  const targetListType = schema.nodes[targetListName];
  const currentListType = schema.nodes[listType];

  if (!targetListType || !currentListType) return false;
  if (listType === targetListName) return false;

  const currentItem = listNode.child(itemIndex);

  if (listNode.childCount === 1) {
    tr.setNodeMarkup(listPos, targetListType, listNode.attrs);
    return true;
  }

  const replacement = splitListAroundItem(
    ctx,
    [targetListType.create(null, [currentItem])],
    schema
  );
  tr.replaceWith(listPos, listEnd, replacement);
  return true;
}

function unwrapCurrentListItem(tr, state) {
  const ctx = findListContext(state);
  if (!ctx) return false;

  const { listNode, itemIndex, listPos, listEnd } = ctx;
  const currentItem = listNode.child(itemIndex);
  const paragraphNodes = unwrapListItemContent(currentItem);

  if (listNode.childCount === 1) {
    tr.replaceWith(listPos, listEnd, paragraphNodes);
    return true;
  }

  const replacement = splitListAroundItem(ctx, paragraphNodes, state.schema);
  tr.replaceWith(listPos, listEnd, replacement);
  return true;
}

/**
 * 为当前行应用列表类型（有序/无序），各行互不影响
 * @param {import('@tiptap/react').Editor} editor
 * @param {'ordered' | 'bullet'} type
 */
export function applyListType(editor, type) {
  const targetListName = LIST_NAMES[type];
  const otherListName =
    type === "ordered" ? LIST_NAMES.bullet : LIST_NAMES.ordered;

  if (editor.isActive(targetListName)) {
    return editor
      .chain()
      .focus()
      .command(({ tr, state, dispatch }) => {
        const changed = unwrapCurrentListItem(tr, state);
        if (changed && dispatch) dispatch(tr);
        return changed;
      })
      .run();
  }

  if (editor.isActive(otherListName)) {
    return editor
      .chain()
      .focus()
      .command(({ tr, state, dispatch }) => {
        const changed = convertCurrentItemListType(tr, state, targetListName);
        if (changed && dispatch) dispatch(tr);
        return changed;
      })
      .run();
  }

  const toggleCommand =
    type === "ordered" ? "toggleOrderedList" : "toggleBulletList";

  return editor.chain().focus()[toggleCommand]().run();
}

export function isListTypeActive(editor, type) {
  return editor.isActive(LIST_NAMES[type]);
}
