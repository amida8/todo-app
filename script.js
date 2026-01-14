/* =========================
   ToDo App (Pro + Creative)
   ========================= */

(() => {
  // ---- helpers ----
  const $ = (sel) => document.querySelector(sel);
  const uid = () => (crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  const now = () => new Date().toISOString();

  // ---- required elements ----
  const input = document.getElementById("todo-input") || $("#todo-input");
  const btn = document.getElementById("add-btn") || $("#add-btn");
  const list = document.getElementById("todo-list") || $("#todo-list");

  if (!input || !list) {
    console.warn("Missing #todo-input or #todo-list in HTML.");
    return;
  }

  // If button id not set, still support the first button near input
  const addBtn = btn || input.parentElement?.querySelector("button") || $("button");

  // ---- inject minimal CSS for micro-interactions (no need to touch style.css) ----
  const style = document.createElement("style");
  style.textContent = `
    .todo-item{display:flex;align-items:center;gap:12px; padding:10px 6px; border-bottom:1px solid rgba(0,0,0,.06)}
    .todo-text{flex:1; font-size:16px; line-height:1.2}
    .todo-done .todo-text{opacity:.55; text-decoration:line-through}
    .todo-actions{display:flex; gap:8px}
    .todo-chip{border:none; padding:8px 10px; border-radius:10px; cursor:pointer; font-weight:600}
    .chip-del{background:#111; color:#fff; opacity:.85}
    .chip-del:hover{opacity:1}
    .chip-edit{background:rgba(0,0,0,.06)}
    .pop{animation:pop .16s ease-out}
    @keyframes pop{from{transform:scale(.97); opacity:.2} to{transform:scale(1); opacity:1}}
    .shake{animation:shake .18s linear 0s 2}
    @keyframes shake{0%{transform:translateX(0)} 25%{transform:translateX(-4px)} 50%{transform:translateX(4px)} 75%{transform:translateX(-3px)} 100%{transform:translateX(0)}}
    .toast{position:fixed; left:50%; bottom:26px; transform:translateX(-50%);
      background:rgba(0,0,0,.78); color:#fff; padding:10px 14px; border-radius:14px;
      font-size:14px; z-index:9999; opacity:0; pointer-events:none; transition:opacity .18s ease}
    .toast.show{opacity:1}
  `;
  document.head.appendChild(style);

  // ---- toast ----
  const toast = document.createElement("div");
  toast.className = "toast";
  document.body.appendChild(toast);
  let toastTimer = null;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 900);
  };

  // ---- storage ----
  const KEY = "todo_pro_v1";
  /** @type {{id:string,text:string,done:boolean,createdAt:string}[]} */
  let todos = [];

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      todos = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(todos)) todos = [];
    } catch {
      todos = [];
    }
  };

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(todos));
  };

  // ---- render ----
  const render = () => {
    list.innerHTML = "";
    todos.forEach((t) => list.appendChild(renderItem(t)));
  };

  const renderItem = (t) => {
    const li = document.createElement("li");
    li.className = `todo-item pop ${t.done ? "todo-done" : ""}`;
    li.dataset.id = t.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = t.done;
    checkbox.addEventListener("change", () => toggleDone(t.id));

    const text = document.createElement("div");
    text.className = "todo-text";
    text.textContent = t.text;

    // double click to edit (creative + practical)
    text.addEventListener("dblclick", () => startEdit(t.id));

    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "todo-chip chip-edit";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () => startEdit(t.id));

    const delBtn = document.createElement("button");
    delBtn.className = "todo-chip chip-del";
    delBtn.textContent = "削除";
    delBtn.addEventListener("click", () => removeTodo(t.id));

    actions.append(editBtn, delBtn);
    li.append(checkbox, text, actions);
    return li;
  };

  // ---- actions ----
  const addTodo = () => {
    const v = (input.value || "").trim();
    pressAnimation(addBtn);

    if (!v) {
      input.classList.remove("shake");
      // reflow to restart animation
      void input.offsetWidth;
      input.classList.add("shake");
      showToast("何か入力してね 👶✨");
      return;
    }

    const item = { id: uid(), text: v, done: false, createdAt: now() };
    todos.unshift(item);
    save();
    render();

    input.value = "";
    input.focus();
    showToast("追加したよ ✅");
  };

  const toggleDone = (id) => {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    t.done = !t.done;
    save();
    render();
    showToast(t.done ? "完了！🎉" : "戻したよ ↩️");
  };

  const removeTodo = (id) => {
    const before = todos.length;
    todos = todos.filter((x) => x.id !== id);
    if (todos.length === before) return;
    save();
    render();
    showToast("削除したよ 🗑️");
  };

  const startEdit = (id) => {
    const li = list.querySelector(`li[data-id="${CSS.escape(id)}"]`);
    const t = todos.find((x) => x.id === id);
    if (!li || !t) return;

    // replace text with input editor
    const textEl = li.querySelector(".todo-text");
    if (!textEl) return;

    const editor = document.createElement("input");
    editor.type = "text";
    editor.value = t.text;
    editor.style.flex = "1";
    editor.style.fontSize = "16px";
    editor.style.padding = "10px 12px";
    editor.style.borderRadius = "12px";
    editor.style.border = "1px solid rgba(0,0,0,.18)";

    const finish = (commit) => {
      if (commit) {
        const nv = editor.value.trim();
        if (nv) t.text = nv;
        else showToast("空はダメ〜 🙅‍♀️");
      }
      save();
      render();
      showToast(commit ? "保存したよ 💾" : "キャンセルしたよ");
    };

    textEl.replaceWith(editor);
    editor.focus();
    editor.select();

    editor.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    editor.addEventListener("blur", () => finish(true));
  };

  // ---- micro interaction (button press) ----
  const pressAnimation = (el) => {
    if (!el || !el.animate) return;
    el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }],
      { duration: 140, easing: "ease-out" }
    );
  };

  // ---- events ----
  addBtn?.addEventListener("click", addTodo);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTodo();
  });

  // ---- init ----
  load();
  render();

  // first-time hint
  if (todos.length === 0) showToast("Enter で追加できるよ ⌨️");
})();