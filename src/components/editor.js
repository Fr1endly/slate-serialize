import React, { useCallback, useMemo, useState } from "react";
import escapeHtml from "escape-html";
import { Editable, withReact, useSlate, Slate } from "slate-react";
import { Editor, Transforms, createEditor, Node, Text } from "slate";
import { withHistory } from "slate-history";
const LIST_TYPES = ["numbered-list", "bulleted-list"];
const styles = {
  toolbar: {
    border: "1px black solid",
    display: "flex",
    marginBottom: "1em",
    flexDirection: "column",
  },
  buttonGroup: {
    display: "flex",
  },
  editor: {
    height: "100vh",
    border: "1px black solid",
  },
};

const initialValue = [
  {
    children: [
      {
        text:
          "Since the editor is based on a recursive tree model, similar to an HTML document, you can create complex nested structures, like tables:",
      },
    ],
  },
  {
    type: "table",
    children: [
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            children: [{ text: "" }],
          },
          {
            type: "table-cell",
            children: [{ text: "Human", bold: true }],
          },
          {
            type: "table-cell",
            children: [{ text: "Dog", bold: true }],
          },
          {
            type: "table-cell",
            children: [{ text: "Cat", bold: true }],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            children: [{ text: "# of Feet", bold: true }],
          },
          {
            type: "table-cell",
            children: [{ text: "2" }],
          },
          {
            type: "table-cell",
            children: [{ text: "4" }],
          },
          {
            type: "table-cell",
            children: [{ text: "4" }],
          },
        ],
      },
      {
        type: "table-row",
        children: [
          {
            type: "table-cell",
            children: [{ text: "# of Lives", bold: true }],
          },
          {
            type: "table-cell",
            children: [{ text: "1" }],
          },
          {
            type: "table-cell",
            children: [{ text: "1" }],
          },
          {
            type: "table-cell",
            children: [{ text: "9" }],
          },
        ],
      },
    ],
  },
  {
    children: [
      {
        text:
          "This table is just a basic example of rendering a table, and it doesn't have fancy functionality. But you could augment it to add support for navigating with arrow keys, displaying table headers, adding column and rows, or even formulas if you wanted to get really crazy!",
      },
    ],
  },
];
// Define a deserializing function that takes a string and returns a value.

//
const RichTextEditor = ({ handleTitleChange, title }) => {
  const serializeHtml = (node) => {
    if (Text.isText(node)) {
      if (node["bold"]) return `<strong>${escapeHtml(node.text)}</strong>`;
      if (node["code"]) return `<code>${escapeHtml(node.text)}</code>;`;
      if (node["italic"]) return `<em>${escapeHtml(node.text)}</em>;`;
      if (node["underline"]) return `<u>${escapeHtml(node.text)}</u>`;
      else return escapeHtml(node.text);
    }

    const children = node.children.map((n) => serializeHtml(n)).join("");

    switch (node.type) {
      case "quote":
        return `<blockquote>${children}</blockquote>`;
      case "paragraph":
        return `<p>${children}</p>`;
      case "link":
        return `<a href="${escapeHtml(node.url)}">${children}</a>`;
      case "table":
        return `<table><tbody>${children}</tbody></table>`;
      case "table-row":
        return `<tr>${children}</tr>`;
      case "table-cell":
        return `<td>${children}</td>`;
      default:
        return children;
    }
  };

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const [value, setValue] = useState(initialValue);

  const handleChange = (value) => {
    setValue(value);
  };

  const handleSave = () => {
    const html = value.map((n) => serializeHtml(n)).join("");
    localStorage.setItem("contentText", html);
  };

  return (
    <div>
      <form style={{ background: "red" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e) || console.log(title)}
        />
      </form>
      <Slate
        editor={editor}
        value={value}
        style={styles.editor}
        onChange={(value) => handleChange(value)}
      >
        <div style={styles.toolbar}>
          <div style={styles.buttonGroup}>
            <MarkButton format="bold" />
            <MarkButton format="italic" />
            <MarkButton format="underline" />
            <MarkButton format="code" />
            <BlockButton format="heading-one" />
            <BlockButton format="heading-two" />
            <BlockButton format="block-quote" />
            <BlockButton format="numbered-list" />
            <BlockButton format="bulleted-list" />
            <button onClick={(e) => handleSave()}>save</button>
          </div>
        </div>
        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder="Enter some rich text…"
          spellCheck
          autoFocus
        />
      </Slate>
    </div>
  );
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) => LIST_TYPES.includes(n.type),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  });

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => n.type === format,
  });

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case "block-quote":
      return <blockquote {...attributes}>{children}</blockquote>;
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "heading-one":
      return <h1 {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 {...attributes}>{children}</h2>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    case "table":
      return (
        <table>
          <tbody {...attributes}>{children}</tbody>
        </table>
      );
    case "table-row":
      return <tr {...attributes}>{children}</tr>;
    case "table-cell":
      return <td {...attributes}>{children}</td>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const BlockButton = ({ format }) => {
  const editor = useSlate();
  return (
    <button
      //active={isBlockActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {format}
    </button>
  );
};

const MarkButton = ({ format }) => {
  const editor = useSlate();
  return (
    <button
      //active={isMarkActive(editor, format)}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      {format}
    </button>
  );
};

export default RichTextEditor;
