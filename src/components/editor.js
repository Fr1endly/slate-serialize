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

// Define a deserializing function that takes a string and returns a value.

//
const RichTextEditor = ({ handleTitleChange, title }) => {
  const serializeHtml = (node) => {
    if (Text.isText(node)) {
      return escapeHtml(node.text);
    }

    const children = node.children.map((n) => serializeHtml(n)).join("");
    console.log(children);

    switch (node.type) {
      case "quote":
        return `<blockquote><p>${children}</p></blockquote>`;
      case "paragraph":
        return `<p>${children}</p>`;
      case "link":
        return `<a href="${escapeHtml(node.url)}">${children}</a>`;
      default:
        return children;
    }
  };

  const serialize = (value) => {
    return (
      value
        // Return the string content of each paragraph in the value's children.
        .map((n) => Node.string(n))
        // Join them all with line breaks denoting paragraphs.
        .join("\n")
    );
  };

  const deserialize = (string) => {
    // Return a value array of children derived by splitting the string.
    return string.split("\n").map((line) => {
      return {
        children: [{ text: line }],
      };
    });
  };

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const [value, setValue] = useState([
    {
      type: "paragraph",
      children: [{ text: "An opening paragraph with a " }, { text: " in it." }],
    },
    {
      type: "quote",
      children: [{ text: "A wise quote." }],
    },
    {
      type: "paragraph",
      children: [{ text: "A closing paragraph!" }],
    },
  ]);

  const handleChange = (value) => {
    setValue(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    //JSON STRING

    localStorage.setItem("contentText", JSON.stringify(serializeHtml(value)));
  };

  return (
    <div>
      <form onSubmit={(e) => handleSubmit(e)} style={{ background: "red" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e) || console.log(title)}
        />
        <input type="submit" value={"submit"} />
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
