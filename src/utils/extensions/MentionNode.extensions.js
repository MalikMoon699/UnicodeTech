import { Node, mergeAttributes } from "@tiptap/core";

const MentionNode = Node.create({
  name: "mention",

  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-mention]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        ...HTMLAttributes,
        class: "style-import-mention",
        "data-user-id": HTMLAttributes.id,
      },
      `@${HTMLAttributes.label}`,
    ];
  },
});

export default MentionNode;
