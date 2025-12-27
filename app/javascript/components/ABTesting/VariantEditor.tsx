import * as React from "react";

import { PostVariant } from "$app/data/post_variants";

import { Button } from "$app/components/Button";
import { Icon } from "$app/components/Icons";
import { Modal } from "$app/components/Modal";
import { RichTextEditor } from "$app/components/RichTextEditor";
import { Drawer, ReorderingHandle, SortableList } from "$app/components/SortableList";
import { Toggle } from "$app/components/Toggle";
import { Row, RowActions, RowContent, RowDetails } from "$app/components/ui/Rows";
import { WithTooltip } from "$app/components/WithTooltip";

export type VariantEditorProps = {
  variant: PostVariant;
  onUpdate: (updates: Partial<PostVariant>) => void;
  onDelete: () => void;
  onSetControl: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
};

export const VariantEditor = ({
  variant,
  onUpdate,
  onDelete,
  onSetControl,
  isExpanded,
  onToggleExpand,
}: VariantEditorProps) => {
  const uid = React.useId();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  return (
    <>
      {showDeleteModal ? (
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={`Delete "${variant.name}"?`}
          footer={
            <>
              <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button
                color="accent"
                onClick={() => {
                  onDelete();
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          Are you sure you want to delete this variant? This action cannot be undone. Any distribution rules and
          assignment data for this variant will also be deleted.
        </Modal>
      ) : null}

      <Row role="listitem">
        <RowContent>
          <ReorderingHandle />
          <Icon name="outline-document-duplicate" />
          <div>
            <h3 className="flex items-center gap-2">
              {variant.name || "Untitled Variant"}
              {variant.is_control ? (
                <span className="rounded bg-accent px-2 py-0.5 text-xs text-white">Control</span>
              ) : null}
            </h3>
          </div>
        </RowContent>
        <RowActions>
          <WithTooltip tip={isExpanded ? "Collapse" : "Expand"}>
            <Button onClick={onToggleExpand}>
              <Icon name={isExpanded ? "outline-cheveron-up" : "outline-cheveron-down"} />
            </Button>
          </WithTooltip>
          <WithTooltip tip="Delete variant">
            <Button onClick={() => setShowDeleteModal(true)} aria-label="Delete">
              <Icon name="trash2" />
            </Button>
          </WithTooltip>
        </RowActions>

        {isExpanded ? (
          <RowDetails asChild>
            <Drawer className="grid gap-6">
              <fieldset>
                <label htmlFor={`${uid}-name`}>Variant Name</label>
                <input
                  id={`${uid}-name`}
                  type="text"
                  value={variant.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="e.g., Control, Variant A, Variant B"
                />
              </fieldset>

              <fieldset>
                <Toggle value={variant.is_control} onChange={() => onSetControl()} disabled={variant.is_control}>
                  Set as Control Variant
                </Toggle>
                <small className="text-muted">
                  The control variant is the default content shown to subscribers not assigned to other variants.
                </small>
              </fieldset>

              <fieldset>
                <label htmlFor={`${uid}-content`}>Variant Content</label>
                <RichTextEditor
                  id={`${uid}-content`}
                  ariaLabel="Variant content"
                  initialValue={variant.message}
                  onChange={(html) => onUpdate({ message: html })}
                  placeholder="Enter the content for this variant..."
                />
              </fieldset>
            </Drawer>
          </RowDetails>
        ) : null}
      </Row>
    </>
  );
};

export type VariantListProps = {
  variants: PostVariant[];
  onUpdateVariant: (variantId: string, updates: Partial<PostVariant>) => void;
  onDeleteVariant: (variantId: string) => void;
  onSetControl: (variantId: string) => void;
  onReorder: (newOrder: string[]) => void;
};

export const VariantList = ({
  variants,
  onUpdateVariant,
  onDeleteVariant,
  onSetControl,
  onReorder,
}: VariantListProps) => {
  const [expandedVariantId, setExpandedVariantId] = React.useState<string | null>(
    variants.length > 0 ? (variants[0]?.id ?? null) : null,
  );

  return (
    <SortableList currentOrder={variants.map((v) => v.id)} onReorder={onReorder}>
      {variants.map((variant) => (
        <VariantEditor
          key={variant.id}
          variant={variant}
          onUpdate={(updates) => onUpdateVariant(variant.id, updates)}
          onDelete={() => onDeleteVariant(variant.id)}
          onSetControl={() => onSetControl(variant.id)}
          isExpanded={expandedVariantId === variant.id}
          onToggleExpand={() => setExpandedVariantId(expandedVariantId === variant.id ? null : variant.id)}
        />
      ))}
    </SortableList>
  );
};
