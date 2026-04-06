"use client";

import { useState, useCallback, useRef } from "react";
import { type ZodSchema, type ZodError } from "zod";

type ValidationRule<T> = {
  field: keyof T;
  validate: (value: T[keyof T], allValues: T) => string | null;
};

interface UseFormStateOptions<T extends Record<string, unknown>> {
  initialValues: T;
  /** Manual field-level validation rules (simpler alternative to Zod) */
  rules?: ValidationRule<T>[];
  /** Zod schema for full-form validation (takes precedence over rules when both provided) */
  schema?: ZodSchema<T>;
}

/**
 * Controlled form state with Zod schema validation, field-level validation,
 * dirty tracking, and error management.
 *
 * Usage with Zod:
 *   const form = useFormState({
 *     initialValues: { email: '', name: '' },
 *     schema: z.object({
 *       email: z.string().email('Invalid email'),
 *       name: z.string().min(1, 'Required'),
 *     }),
 *   });
 *
 * Usage with manual rules:
 *   const form = useFormState({
 *     initialValues: { title: '', priority: 'medium' },
 *     rules: [{ field: 'title', validate: (v) => v ? null : 'Required' }],
 *   });
 */
export function useFormState<T extends Record<string, unknown>>({
  initialValues,
  rules = [],
  schema,
}: UseFormStateOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const initialRef = useRef(initialValues);

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
      // Clear error on change
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const setError = useCallback(
    <K extends keyof T>(field: K, message: string) => {
      setErrors((prev) => ({ ...prev, [field]: message }));
    },
    []
  );

  const validateField = useCallback(
    <K extends keyof T>(field: K): string | null => {
      const rule = rules.find((r) => r.field === field);
      if (!rule) return null;
      return rule.validate(values[field], values);
    },
    [rules, values]
  );

  /** Validate all fields. Returns true if valid. Populates errors if not. */
  const validate = useCallback((): boolean => {
    // Mark all fields as touched
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(values) as (keyof T)[]) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    // Zod validation takes precedence
    if (schema) {
      const result = schema.safeParse(values);
      if (result.success) {
        setErrors({});
        return true;
      }
      const zodErrors = (result.error as ZodError).flatten().fieldErrors;
      const newErrors: Partial<Record<keyof T, string>> = {};
      for (const [field, messages] of Object.entries(zodErrors)) {
        if (messages && messages.length > 0) {
          newErrors[field as keyof T] = messages[0] as string;
        }
      }
      setErrors(newErrors);
      return false;
    }

    // Manual rules validation
    const newErrors: Partial<Record<keyof T, string>> = {};
    let valid = true;

    for (const rule of rules) {
      const error = rule.validate(values[rule.field], values);
      if (error) {
        newErrors[rule.field] = error;
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  }, [rules, values, schema]);

  const reset = useCallback(() => {
    setValues(initialRef.current);
    setErrors({});
    setTouched({});
  }, []);

  const isDirty = Object.keys(values).some(
    (key) =>
      values[key as keyof T] !== initialRef.current[key as keyof T]
  );

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setValues,
    validateField,
    validate,
    reset,
    isDirty,
    isValid,
  } as const;
}
