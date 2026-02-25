import { ImageUpload } from "@/app/components/";

// --- Content block types (mirror of shared/contracts/contentBlocks) ---

interface TextBlockData {
  text: string;
}
interface QuoteBlockData {
  text: string;
  author?: string;
}
interface ImageBlockData {
  imageUrl: string;
  caption?: string;
}
interface LinkBlockData {
  url: string;
  label?: string;
}

interface TextBlock {
  id: string;
  type: "text";
  data: TextBlockData;
  order: number;
}
interface QuoteBlock {
  id: string;
  type: "quote";
  data: QuoteBlockData;
  order: number;
}
interface ImageBlock {
  id: string;
  type: "image";
  data: ImageBlockData;
  order: number;
}
interface LinkBlock {
  id: string;
  type: "link";
  data: LinkBlockData;
  order: number;
}

export type ContentBlock = TextBlock | QuoteBlock | ImageBlock | LinkBlock;
export type ContentBlockType = "text" | "quote" | "image" | "link";

// --- Helpers ---

const generateBlockId = () =>
  `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function createEmptyBlock(type: ContentBlockType, order: number): ContentBlock {
  const id = generateBlockId();
  switch (type) {
    case "text":
      return { id, type, data: { text: "" }, order };
    case "quote":
      return { id, type, data: { text: "", author: "" }, order };
    case "image":
      return { id, type, data: { imageUrl: "" }, order };
    case "link":
      return { id, type, data: { url: "", label: "" }, order };
  }
}

// --- Block editors ---

function TextBlockEditor(
  { block, onChange }: { block: TextBlock; onChange: (b: TextBlock) => void },
) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">
        Text
      </label>
      <textarea
        value={block.data.text}
        onChange={(e) =>
          onChange({ ...block, data: { ...block.data, text: e.target.value } })}
        placeholder="Enter text..."
        rows={4}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function QuoteBlockEditor(
  { block, onChange }: { block: QuoteBlock; onChange: (b: QuoteBlock) => void },
) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Quote
        </label>
        <textarea
          value={block.data.text}
          onChange={(e) =>
            onChange({
              ...block,
              data: { ...block.data, text: e.target.value },
            })}
          placeholder="Enter quote..."
          rows={2}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Author (optional)
        </label>
        <input
          type="text"
          value={block.data.author ?? ""}
          onChange={(e) =>
            onChange({
              ...block,
              data: { ...block.data, author: e.target.value },
            })}
          placeholder="Author name"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

function ImageBlockEditor(
  { block, onChange }: { block: ImageBlock; onChange: (b: ImageBlock) => void },
) {
  return (
    <div className="space-y-2">
      <ImageUpload
        label="Image"
        value={block.data.imageUrl || undefined}
        onChange={(base64) =>
          onChange({
            ...block,
            data: { ...block.data, imageUrl: base64 ?? "" },
          })}
      />
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Caption (optional)
        </label>
        <input
          type="text"
          value={block.data.caption ?? ""}
          onChange={(e) =>
            onChange({
              ...block,
              data: { ...block.data, caption: e.target.value },
            })}
          placeholder="Image caption"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

function LinkBlockEditor(
  { block, onChange }: { block: LinkBlock; onChange: (b: LinkBlock) => void },
) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          URL
        </label>
        <input
          type="url"
          value={block.data.url}
          onChange={(e) =>
            onChange({
              ...block,
              data: { ...block.data, url: e.target.value },
            })}
          placeholder="https://..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Label (optional)
        </label>
        <input
          type="text"
          value={block.data.label ?? ""}
          onChange={(e) =>
            onChange({
              ...block,
              data: { ...block.data, label: e.target.value },
            })}
          placeholder="Link label"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

// --- Block editor dispatch ---

function BlockEditor(
  { block, onChange }: {
    block: ContentBlock;
    onChange: (b: ContentBlock) => void;
  },
) {
  switch (block.type) {
    case "text":
      return <TextBlockEditor block={block} onChange={onChange} />;
    case "quote":
      return <QuoteBlockEditor block={block} onChange={onChange} />;
    case "image":
      return <ImageBlockEditor block={block} onChange={onChange} />;
    case "link":
      return <LinkBlockEditor block={block} onChange={onChange} />;
  }
}

// --- Block type labels ---

const BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  text: "Text",
  quote: "Quote",
  image: "Image",
  link: "Link",
};

const BLOCK_TYPE_ICONS: Record<ContentBlockType, string> = {
  text: "📝",
  quote: "💬",
  image: "🖼️",
  link: "🔗",
};

// --- Main list component ---

interface ContentBlockEditorListProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

/**
 * Editor for a list of content blocks.
 * Supports add, remove, reorder (up/down), and inline editing per block type.
 */
export function ContentBlockEditorList(
  { blocks, onChange }: ContentBlockEditorListProps,
) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  const updateBlock = (id: string, updated: ContentBlock) => {
    onChange(blocks.map((b) => (b.id === id ? updated : b)));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    const idx = sorted.findIndex((b) => b.id === id);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const updated = sorted.map((block, i) => {
      if (i === idx) return { ...block, order: sorted[targetIdx].order };
      if (i === targetIdx) return { ...block, order: sorted[idx].order };
      return block;
    });
    onChange(updated);
  };

  const addBlock = (type: ContentBlockType) => {
    const maxOrder = blocks.length > 0
      ? Math.max(...blocks.map((b) => b.order))
      : -1;
    onChange([...blocks, createEmptyBlock(type, maxOrder + 1)]);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium mb-1">Content Blocks</label>

      {sorted.map((block, idx) => (
        <div
          key={block.id}
          className="border border-gray-600 rounded bg-gray-800/50 p-3"
        >
          {/* Block header with type label + controls */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">
              {BLOCK_TYPE_ICONS[block.type]} {BLOCK_TYPE_LABELS[block.type]}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveBlock(block.id, -1)}
                disabled={idx === 0}
                className="px-1.5 py-0.5 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                title="Move up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveBlock(block.id, 1)}
                disabled={idx === sorted.length - 1}
                className="px-1.5 py-0.5 text-xs bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-30"
                title="Move down"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeBlock(block.id)}
                className="px-1.5 py-0.5 text-xs bg-red-700 rounded hover:bg-red-600"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>

          <BlockEditor
            block={block}
            onChange={(updated) => updateBlock(block.id, updated)}
          />
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex gap-2 flex-wrap">
        {(["text", "quote", "image", "link"] as ContentBlockType[]).map((
          type,
        ) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="px-3 py-1.5 text-xs bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
          >
            + {BLOCK_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
