# TodoMVC (React)

A todo list application for managing personal tasks.

## Add Todo

Users must be able to add new todo items to the list.

### Requirements
- Users can enter text in the input field
- Users can press Enter to add the todo
- New todos appear at the top of the list
- Empty input does not create a todo

### Acceptance Criteria
- Given the todo input, when the user types "Buy milk" and presses Enter, then a new todo item "Buy milk" appears in the list
- Given an empty input, when the user presses Enter, then no todo is created

## Complete Todo

Users must be able to mark a todo as completed.

### Requirements
- Each todo has a checkbox
- Clicking the checkbox toggles completion
- Completed todos get a line-through style
- The remaining count updates when a todo is toggled

### Acceptance Criteria
- Given an active todo, when the user clicks the checkbox, then the todo is marked as completed and the remaining count decreases
- Given a completed todo, when the user clicks the checkbox, then the todo is marked as active and the remaining count increases

## Filter Todos

Users should be able to filter todos by status.

### Requirements
- Three filter links: All, Active, Completed
- All is selected by default
- Active shows only uncompleted todos
- Completed shows only completed todos

### Acceptance Criteria
- Given mixed todos, when the user clicks "Active", then only uncompleted todos are displayed
- Given mixed todos, when the user clicks "Completed", then only completed todos are displayed
- Given any filter, when the user clicks "All", then all todos are displayed

## Clear Completed

Users could be able to clear all completed todos at once.

### Requirements
- A "Clear completed" button is shown
- Clicking it removes all completed todos
- The button only appears when there are completed todos

### Acceptance Criteria
- Given completed todos, when the user clicks "Clear completed", then all completed todos are removed
- Given no completed todos, then the "Clear completed" button is not visible
