import type { AuthField, AuthFieldError } from "./field-error";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

export function FieldErrorMessage({
  error,
  field,
  id,
}: {
  error: AuthFieldError | null;
  field: AuthField;
  id: string;
}) {
  const locale = useInterfaceLanguage();
  if (error?.field !== field) return null;
  return (
    <p
      id={id}
      role={field === "form" ? "alert" : undefined}
      className="text-sm text-destructive"
    >
      {interfaceCopy(locale, error.message)}
    </p>
  );
}
