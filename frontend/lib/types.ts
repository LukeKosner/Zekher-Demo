import { Message } from "ai/react";

// eslint-disable-next-line no-shadow
export enum SystemState {
  "starting",
  "running",
  "done",
}

export interface ZekherMessage extends Message {
  runId?: string;
  status?: SystemState;
  name?: string;
  toolOutput?: string;
}
