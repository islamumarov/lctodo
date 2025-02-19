"use client";

import { useCallback } from "react";
import type { Question, TodoItem } from "@/app/types";
import TodoItemComponent from "@/components/Todos/TodoItemComponent";
import { saveTodo, type SuggestionDto } from "@/actions/problems";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useDebouncedEffect } from "@/lib/useDebouncedEffect";
import {
  endOfToday,
  isAfter,
  isBefore,
  startOfToday,
  startOfTomorrow,
} from "date-fns";
import {
  useAtom,
  useAtomValue,
  useSetAtom,
  type ExtractAtomValue,
} from "jotai";
import {
  disableAnimationsAtom,
  filteredTodosAtom,
  isDailyDoneAtom,
  sectionOpen,
  selectedFiltersAtom,
  todosAtom,
} from "@/state";
import { TodosByDate } from "@/components/TodosByDate";
import { AnimatedItem } from "@/components/AnimatedItem";
import { AnimatePresence } from "motion/react";
import { ColumnHeader } from "@/components/Todos/ColumnHeader";
import { AddTodo } from "@/components/Todos/AddTodo";

interface TodoProps {
  isAuth: boolean;
  dailyQuestion?: Question;
}

const Todos = ({ isAuth, dailyQuestion }: TodoProps) => {
  const filteredTodos = useAtomValue(filteredTodosAtom);
  const allTodos = useAtomValue(todosAtom);
  const setTodos = useSetAtom(todosAtom);
  const [sectionOpenValue, setSectionOpen] = useAtom(sectionOpen);
  const [, setIsDailyDone] = useAtom(isDailyDoneAtom);
  const disableAnimations = useAtomValue(disableAnimationsAtom);
  const selectedFilters = useAtomValue(selectedFiltersAtom);

  const onOpenChange =
    (prop: keyof ExtractAtomValue<typeof sectionOpen>) => (isOpen: boolean) => {
      setSectionOpen((s) => ({
        ...s,
        [prop]: isOpen,
      }));
    };

  useDebouncedEffect(
    () => {
      const save = async () => {
        if (allTodos.length) await saveTodo(allTodos);
      };
      if (isAuth) save();
    },
    [allTodos],
    2000
  );

  const addTodo = useCallback(
    async (initialItem: Partial<TodoItem> = {}) => {
      const newTodo: TodoItem = {
        id: crypto.randomUUID(),
        title: "",
        done: false,
        tags: [],
        ...initialItem,
      };

      setTodos((todos) => [newTodo, ...todos]);
    },
    [setTodos]
  );

  const onSetSelectedValue =
    (id: string) => async (suggestion: SuggestionDto[number] | null) => {
      setTodos((todos) =>
        todos.map((todo) => {
          if (todo.id === id) {
            if (!suggestion) {
              return {
                ...todo,
                title: "",
                difficulty: undefined,
              };
            }
            return {
              ...todo,
              title: suggestion.label,
              difficulty: suggestion.data.difficulty,
              tags: suggestion.data.topicTags,
              titleSlug: suggestion.data.titleSlug,
              QID: suggestion.id,
            };
          }
          return todo;
        })
      );
    };

  const onSetSearchValue = (id: string) => async (title: string) => {
    setTodos((todos) =>
      todos.map((todo) => {
        if (todo.id === id) {
          return {
            ...todo,
            title,
          };
        }
        return todo;
      })
    );
  };

  const toggleTodo = (id: string) => () => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          if (todo.QID === dailyQuestion?.QID) {
            setIsDailyDone(true);
          }
          return {
            ...todo,
            done: !todo.done,
            date: startOfToday(),
          };
        }
        return todo;
      });

      return newTodos;
    });
  };

  const addDate = (id: string) => (value: number) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id && todo.date) {
          const newDate = new Date(todo.date);
          newDate.setDate(newDate.getDate() + value);
          return { ...todo, date: newDate };
        }
        return todo;
      });
      return newTodos;
    });
  };

  const handleDateChange = (id: string) => (date?: Date) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, date };
        }
        return todo;
      });
      return newTodos;
    });
  };

  /**
   * - Not done
   * - No date or date today or in past
   */
  const inProgressTodos = filteredTodos.filter(
    (todo) =>
      !todo.done && (!todo.date || isBefore(todo.date, startOfTomorrow()))
  );
  /**
   * - Date is tomorrow or later
   */
  const futureTodos = filteredTodos.filter(
    (todo) => !todo.done && todo.date && isAfter(todo.date, endOfToday())
  );

  /**
   * - Done
   */
  const doneTodos = filteredTodos.filter((todo) => todo.done);

  function removeTodo(id: string): void {
    setTodos((todos) => todos.filter((todo) => todo.id !== id));
  }

  function addInProgressTodo() {
    addTodo({
      date: startOfToday(),
      difficulty: Array.from(selectedFilters.difficulty)?.[0],
      tags: Array.from(selectedFilters.tags),
    });
  }

  function addFutureTodo() {
    addTodo({
      date: startOfTomorrow(),
      difficulty: Array.from(selectedFilters.difficulty)?.[0],
      tags: Array.from(selectedFilters.tags),
    });
  }

  const inProgressNode = (
    <Collapsible
      open={sectionOpenValue.inProgress}
      onOpenChange={onOpenChange("inProgress")}
    >
      <ColumnHeader
        label="In Progress"
        collapsed={!sectionOpenValue.inProgress}
        amount={inProgressTodos.length}
      >
        {sectionOpenValue.inProgress && <AddTodo onClick={addInProgressTodo} />}
      </ColumnHeader>
      <CollapsibleContent>
        <ul
          className={`${
            inProgressTodos.length ? "grid" : ""
          } grid-cols-1 gap-2`}
        >
          <AnimatePresence initial={false}>
            {inProgressTodos.map((todo) => (
              <AnimatedItem
                key={todo.id.toString()}
                disable={disableAnimations}
              >
                <TodoItemComponent
                  todo={todo}
                  toggleTodo={toggleTodo(todo.id)}
                  handleDateChange={handleDateChange(todo.id)}
                  addDate={addDate(todo.id)}
                  onSetSelectedValue={onSetSelectedValue(todo.id)}
                  removeTodo={() => removeTodo(todo.id)}
                  onSetSearchValue={onSetSearchValue(todo.id)}
                />
              </AnimatedItem>
            ))}
          </AnimatePresence>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );

  const futureNodes = (
    <Collapsible
      open={sectionOpenValue.future}
      onOpenChange={onOpenChange("future")}
    >
      <ColumnHeader
        label="Planned"
        collapsed={!sectionOpenValue.future}
        amount={futureTodos.length}
      >
        {sectionOpenValue.future && <AddTodo onClick={addFutureTodo} />}
      </ColumnHeader>
      <CollapsibleContent>
        <TodosByDate
          todos={futureTodos}
          renderTodo={(todo) => (
            <AnimatedItem key={todo.id.toString()} disable={disableAnimations}>
              <TodoItemComponent
                key={todo.id.toString()}
                todo={todo}
                toggleTodo={toggleTodo(todo.id)}
                handleDateChange={handleDateChange(todo.id)}
                addDate={addDate(todo.id)}
                onSetSelectedValue={onSetSelectedValue(todo.id)}
                removeTodo={() => removeTodo(todo.id)}
                onSetSearchValue={onSetSearchValue(todo.id)}
              />
            </AnimatedItem>
          )}
        />
      </CollapsibleContent>
    </Collapsible>
  );

  const doneNodes = (
    <Collapsible
      open={sectionOpenValue.done}
      onOpenChange={onOpenChange("done")}
    >
      <ColumnHeader
        label="Done"
        collapsed={!sectionOpenValue.done}
        amount={doneTodos.length}
      />
      <CollapsibleContent>
        <TodosByDate
          todos={doneTodos}
          increasing={false}
          renderTodo={(todo) => (
            <AnimatedItem key={todo.id.toString()} disable={disableAnimations}>
              <TodoItemComponent
                showDatePicker={false}
                key={todo.id.toString()}
                todo={todo}
                toggleTodo={toggleTodo(todo.id)}
                handleDateChange={handleDateChange(todo.id)}
                addDate={addDate(todo.id)}
                onSetSelectedValue={onSetSelectedValue(todo.id)}
                removeTodo={() => removeTodo(todo.id)}
                onSetSearchValue={onSetSearchValue(todo.id)}
              />
            </AnimatedItem>
          )}
        />
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <>
      {inProgressNode}
      {futureNodes}
      {doneNodes}
    </>
  );
};

export default Todos;
