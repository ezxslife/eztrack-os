"use client";

import { useState } from "react";
import { FormModal } from "@/components/modals/FormModal";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";

interface ConfigureIntegrationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    apiKey: string;
    apiUrl: string;
    enabled: boolean;
  }) => void | Promise<void>;
  integrationName?: string;
}

export function ConfigureIntegrationModal({
  open,
  onClose,
  onSubmit,
  integrationName = "Integration",
}: ConfigureIntegrationModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = apiKey.trim().length > 0;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTestResult("success");
    } catch {
      setTestResult("error");
    } finally {
      setIsTesting(false);
    }
  };

  const resetForm = () => {
    setApiKey("");
    setApiUrl("");
    setEnabled(false);
    setTestResult(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        apiKey: apiKey.trim(),
        apiUrl: apiUrl.trim(),
        enabled,
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title={`Configure ${integrationName}`}
      size="lg"
      submitLabel="Save Configuration"
      isSubmitting={isSubmitting}
      isValid={isValid}
    >
      <div className="rounded-lg bg-[var(--surface-secondary)] p-3">
        <p className="text-[13px] font-medium text-[var(--text-primary)]">{integrationName}</p>
      </div>

      <Input
        label="API Key"
        type="password"
        placeholder="Enter API key..."
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />

      <Input
        label="API URL"
        type="url"
        placeholder="https://api.example.com"
        value={apiUrl}
        onChange={(e) => setApiUrl(e.target.value)}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTestConnection}
          isLoading={isTesting}
          disabled={!apiKey.trim()}
        >
          Test Connection
        </Button>
        {testResult === "success" && (
          <span className="text-[12px] text-green-500 font-medium">Connection successful</span>
        )}
        {testResult === "error" && (
          <span className="text-[12px] text-[var(--status-critical)] font-medium">Connection failed</span>
        )}
      </div>

      <Toggle
        label="Enable Integration"
        checked={enabled}
        onChange={setEnabled}
      />
    </FormModal>
  );
}
