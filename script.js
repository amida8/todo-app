function addTodo() {
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  if (input.value.trim() !== '') {
    const item = document.createElement('li');
    item.textContent = input.value;
    list.appendChild(item);
    input.value = '';
  }
}
