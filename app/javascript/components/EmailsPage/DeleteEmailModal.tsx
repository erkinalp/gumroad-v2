import { useForm } from "@inertiajs/react";
import React from "react";

import { Button } from "$app/components/Button";
import { Modal } from "$app/components/Modal";

type DeleteableInstallment = {
  external_id: string;
  name: string;
};

type Props<T extends DeleteableInstallment> = {
  installment: T | null;
  onClose: () => void;
  onSuccess: (deletedInstallment: T) => void;
  /** Custom confirmation message. Defaults to generic message. */
  confirmationMessage?: string | undefined;
};

/**
 * Shared delete confirmation modal for emails.
 *
 * Handles the delete form submission and provides callbacks for success/close.
 * Pass a custom confirmationMessage for page-specific messaging.
 */
export function DeleteEmailModal<T extends DeleteableInstallment>({
  installment,
  onClose,
  onSuccess,
  confirmationMessage,
}: Props<T>) {
  const deleteForm = useForm({});

  const handleDelete = () => {
    if (!installment) return;
    deleteForm.delete(Routes.email_path(installment.external_id), {
      preserveState: true,
      onSuccess: () => {
        onSuccess(installment);
        onClose();
      },
    });
  };

  if (!installment) return null;

  return (
    <Modal
      open
      allowClose={!deleteForm.processing}
      onClose={onClose}
      title="Delete email?"
      footer={
        <>
          <Button disabled={deleteForm.processing} onClick={onClose}>
            Cancel
          </Button>
          <Button color="danger" disabled={deleteForm.processing} onClick={handleDelete}>
            {deleteForm.processing ? "Deleting..." : "Delete email"}
          </Button>
        </>
      }
    >
      <h4>
        {confirmationMessage ??
          `Are you sure you want to delete the email "${installment.name}"? This action cannot be undone.`}
      </h4>
    </Modal>
  );
}
