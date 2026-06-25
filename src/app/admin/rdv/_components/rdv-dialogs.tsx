"use client";

import { useState } from "react";
import { ValidationDialog } from "./validation-dialog";
import { RejectDialog } from "./reject-dialog";
import { CompleteDialog } from "./complete-dialog";
import { DetailSheet } from "./detail-sheet";
import { NewRdvDialog } from "./new-rdv-dialog";
import type { Appointment } from "./types";

export type DialogKind = "validate" | "reject" | "complete" | "detail" | "new";

export interface DialogState {
  kind: DialogKind;
  appt: Appointment | null;
}

export interface RdvDialogController {
  state: DialogState | null;
  open: (kind: DialogKind, appt?: Appointment | null) => void;
  close: () => void;
}

export function useRdvDialogs(): RdvDialogController {
  const [state, setState] = useState<DialogState | null>(null);
  return {
    state,
    open: (kind, appt = null) => setState({ kind, appt }),
    close: () => setState(null),
  };
}

interface HostProps {
  controller: RdvDialogController;
  adminName: string;
  onUpdated?: (appt: Appointment) => void;
  onCreated?: (appt: Appointment) => void;
}

/**
 * Hosts all RDV dialogs based on the controller state. Mount once per page.
 */
export function RdvDialogHost({ controller, adminName, onUpdated, onCreated }: HostProps) {
  const { state, close } = controller;
  const kind = state?.kind;
  const appt = state?.appt ?? null;

  return (
    <>
      <ValidationDialog
        open={kind === "validate"}
        onOpenChange={(o) => !o && close()}
        appointment={appt}
        adminName={adminName}
        onApproved={(a) => {
          onUpdated?.(a);
        }}
      />
      <RejectDialog
        open={kind === "reject"}
        onOpenChange={(o) => !o && close()}
        appointment={appt}
        onRejected={(a) => onUpdated?.(a)}
      />
      <CompleteDialog
        open={kind === "complete"}
        onOpenChange={(o) => !o && close()}
        appointment={appt}
        adminName={adminName}
        onCompleted={(a) => onUpdated?.(a)}
      />
      <DetailSheet
        open={kind === "detail"}
        onOpenChange={(o) => !o && close()}
        appointment={appt}
        adminName={adminName}
        onValidate={(a) => {
          close();
          controller.open("validate", a);
        }}
        onReject={(a) => {
          close();
          controller.open("reject", a);
        }}
        onComplete={(a) => {
          close();
          controller.open("complete", a);
        }}
      />
      <NewRdvDialog
        open={kind === "new"}
        onOpenChange={(o) => !o && close()}
        onCreated={(a) => onCreated?.(a)}
      />
    </>
  );
}
