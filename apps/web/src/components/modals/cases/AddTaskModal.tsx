"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void | Promise<void>;
  assigneeOptions?: { value: string; label: string }[];
  parentTaskOptions?: { value: string; label: string }[];
}

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  assignee: string;
  dueDate: string;
  parentTask: string;
}

const PRIORITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const DEFAULT_ASSIGNEES = [
  { value: "user-1", label: "J. Martinez" },
  { value: "user-2", label: "R. Chen" },
  { value: "user-3", label: "L. Thompson" },
  { value: "user-4", label: "K. Williams" },
];

const DEFAULT_PARENT_TASKS = [
  { value: "", label: "None (top-level task)" },
  { value: "task-1", label: "Initial Investigation" },
  { value: "task-2", label: "Evidence Collection" },
  { value: "task-3", label: "Witness Interviews" },
];

export function AddTaskModal({
  open,
  onClose,
  onSubmit,
  assigneeOptions = DEFAULT_ASSIGNEES,
  parentTaskOptions = DEFAULT_PARENT_TASKS,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [parentTask, setParentTask] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim() !== "" && priority !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ title, description, priority, assignee, dueDate, parentTask });
      setTitle("");
      setDescription("");
      setPriority("");
      setAssignee("");
      setDueDate("");
      setParentTask("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Add Task"
      subtitle="Create a new task for this case"
      size="md"
      submitLabel="Add Task"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <Input
        label="Title"
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="Describe the task..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <Select
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        placeholder="Select priority..."
      />

      <Select
        label="Assignee"
        options={assigneeOptions}
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        placeholder="Select assignee..."
      />

      <Input
        label="Due Date"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <Select
        label="Parent Task (optional)"
        options={parentTaskOptions}
        value={parentTask}
        onChange={(e) => setParentTask(e.target.value)}
        placeholder="None (top-level task)"
      />
    </FormModal>
  );
}
