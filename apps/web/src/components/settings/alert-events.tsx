"use client";

import { useId } from "react";
import { CheckIcon } from "lucide-react";
import { REVIEW_SCORES } from "@asobeast/shared";
import type { ReviewScore, WebhookEvent } from "@asobeast/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EVENT_LABELS, PICKER_EVENTS } from "./alert-event-copy";
import { useInterfaceLanguage } from "@/components/layout/InterfaceLanguageProvider";
import { interfaceCopy } from "@/lib/interface-copy";

const STARS_HELP =
  "Reviews with these stars arrive as new reviews. When Negative review is ticked too, a low review outside these stars still arrives as a negative review.";

function ToggleChip({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Button
      type="button"
      role="checkbox"
      aria-checked={checked}
      variant={checked ? "default" : "outline"}
      size="sm"
      onClick={onClick}
    >
      <CheckIcon className={checked ? undefined : "invisible"} />
      {children}
    </Button>
  );
}

export function EventSelection({
  value,
  onChange,
}: {
  value: WebhookEvent[];
  onChange: (next: WebhookEvent[]) => void;
}) {
  const locale = useInterfaceLanguage();
  const labelId = useId();

  function toggle(event: WebhookEvent) {
    onChange(
      value.includes(event)
        ? value.filter((item) => item !== event)
        : [...value, event],
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId}>{locale === "zh-CN" ? "事件" : "Events"}</Label>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex flex-wrap gap-2"
      >
        {PICKER_EVENTS.map((event) => (
          <ToggleChip
            key={event}
            checked={value.includes(event)}
            onClick={() => toggle(event)}
          >
            {interfaceCopy(locale, EVENT_LABELS[event])}
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}

export function ReviewStarSelection({
  value,
  onChange,
}: {
  value: readonly number[];
  onChange: (next: number[]) => void;
}) {
  const chinese = useInterfaceLanguage() === "zh-CN";
  const labelId = useId();
  const helpId = useId();

  function toggle(score: ReviewScore) {
    onChange(
      value.includes(score)
        ? value.filter((item) => item !== score)
        : [...value, score].sort((left, right) => left - right),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId}>{chinese ? "新评论星级" : "New review stars"}</Label>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={helpId}
        className="flex flex-wrap gap-2"
      >
        {REVIEW_SCORES.map((score) => (
          <ToggleChip
            key={score}
            checked={value.includes(score)}
            onClick={() => toggle(score)}
          >
            {chinese
              ? `${score} 星`
              : score === 1
                ? "1 star"
                : `${score} stars`}
          </ToggleChip>
        ))}
      </div>
      <p id={helpId} className="text-sm text-muted-foreground">
        {value.length === 0
          ? chinese
            ? "请至少选择一个星级。"
            : "Pick at least one star."
          : chinese
            ? "这些星级的评论会作为新评论发送。如果同时选择负面评论，未包含在这些星级中的低分评论仍会作为负面评论发送。"
            : STARS_HELP}
      </p>
    </div>
  );
}

export function AlertSubscriptionFields({
  events,
  stars,
  onEventsChange,
  onStarsChange,
}: {
  events: WebhookEvent[];
  stars: number[];
  onEventsChange: (next: WebhookEvent[]) => void;
  onStarsChange: (next: number[]) => void;
}) {
  return (
    <>
      <EventSelection value={events} onChange={onEventsChange} />
      {events.includes("review.new") ? (
        <ReviewStarSelection value={stars} onChange={onStarsChange} />
      ) : null}
    </>
  );
}
