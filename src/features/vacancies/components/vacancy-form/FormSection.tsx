import { Label } from "@/design-system/ui/label";

/** Numbered card wrapper shared by every VacancyForm section. */
export function Section({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">
        <span className="grid size-6 place-items-center rounded-md bg-primary-100 text-xs font-bold text-primary-700">
          {num}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Label with a required-field asterisk. */
export function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-danger">*</span>
    </Label>
  );
}
