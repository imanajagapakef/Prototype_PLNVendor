"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ACTIVITY_SEED, DEMO_CONTRACT } from "./demo";
import {
  OWNER_LABEL,
  STAGES,
  TRANSITIONS,
  type ActionType,
  type ActivityEntry,
  type StageId,
} from "./workflow";

interface ContractCtx {
  stage: StageId;
  paid: boolean;
  activity: ActivityEntry[];
  act: (a: ActionType, comment?: string) => void;
  reset: () => void;
}

const Ctx = createContext<ContractCtx | null>(null);

function stamp(): string {
  const d = new Date();
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function actorFor(stage: StageId): { actor: string; role: string } {
  const owner = STAGES.find((s) => s.id === stage)?.owner ?? "PLN_PIC";
  const role = OWNER_LABEL[owner];
  const actor =
    owner === "Vendor"
      ? DEMO_CONTRACT.vendor
      : owner === "Warehouse"
        ? "PLN Warehouse"
        : role;
  return { actor, role };
}

export function ContractProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<StageId>(DEMO_CONTRACT.stage);
  const [paid, setPaid] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>(ACTIVITY_SEED);

  function act(a: ActionType, comment?: string) {
    const t = TRANSITIONS[a];
    if (!t.from.includes(stage)) return; // invalid action: ignore, never jump
    const { actor, role } = actorFor(stage);
    setActivity((prev) => [
      ...prev,
      {
        id: `a${Date.now()}`,
        at: stamp(),
        actor,
        role,
        action: t.label + (comment ? ` — ${comment}` : ""),
      },
    ]);
    if (a === "mark-paid") setPaid(true);
    else setStage(t.to);
  }

  function reset() {
    setStage(DEMO_CONTRACT.stage);
    setPaid(false);
    setActivity(ACTIVITY_SEED);
  }

  return (
    <Ctx.Provider value={{ stage, paid, activity, act, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useContract(): ContractCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContract must be used inside ContractProvider");
  return ctx;
}
