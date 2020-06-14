import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import "./styles.css";
import Editor from "./components/editor";
import { renderToStaticMarkup } from "react-dom/server";

export default function App() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleChange = (e) => {
    setTitle(e.target.value);
  };

  useEffect(() => {
    setContent(localStorage.getItem("contentText"));
  }, []);

  return (
    <div className="App">
      <Router>
        <Link to="/">Home </Link>
        <Link to="/editor">Editor</Link>
        <Switch>
          <Route path="/" exact>
            <div>
              <button onClick={(e) => console.log(content)}>LOG CONTENT</button>
              <h2>Editor screenshot</h2>
              <div dangerouslySetInnerHTML={{ __html: content }}></div>
            </div>
          </Route>
          <Route path="/editor" exact>
            <div>
              <Editor title={title} handleTitleChange={handleChange} />
            </div>
          </Route>
        </Switch>
      </Router>
    </div>
  );
}
