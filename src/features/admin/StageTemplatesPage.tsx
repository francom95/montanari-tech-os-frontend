import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppShell } from '@/app/layout/AppShell';
import {
  Modal,
  Button,
  Badge,
  DataTable,
  LoadingState,
  ErrorState,
  ModelTierPill,
  useToast,
  type Column,
} from '@/shared/components';
import { AppError } from '@/shared/api';
import type { ModelTier, StageTemplateResponse } from '@/shared/api';
import { MODEL_TIERS } from '@/shared/design/tokens';
import { useStageTemplates, useUpdateStageTemplate } from './hooks';
import styles from './admin.module.css';

/**
 * Admin editing of the stage template catalog (name, tier/cost defaults, review & gate flags,
 * template content, active status). The dependency graph itself (stage keys, `dependsOn`,
 * ordering) is not editable here — that still ships as a Flyway migration, see
 * `StageTemplateService` on the backend.
 */
const schema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string(),
  templateContent: z.string(),
  defaultModelTier: z.string(),
  defaultCreditEstimate: z.coerce.number().min(0),
  maxCreditsPerExecution: z.coerce.number().min(1),
  requiresHumanReviewByDefault: z.boolean(),
  gateReusableAsStandard: z.boolean(),
  gateComplexArchitecture: z.boolean(),
  gateSecuritySensitive: z.boolean(),
  gateLegacyInvolved: z.boolean(),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function StageTemplatesPage() {
  const { data: templates, isLoading, isError, error, refetch } = useStageTemplates();
  const [editing, setEditing] = useState<StageTemplateResponse | null>(null);

  const columns: Column<StageTemplateResponse>[] = [
    {
      key: 'order',
      header: '#',
      width: '0.4fr',
      render: (t) => <span className="font-mono" style={{ fontSize: 12 }}>{t.orderIndex}</span>,
    },
    {
      key: 'name',
      header: 'Stage',
      width: '1.8fr',
      render: (t) => (
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
          <div className={styles.stageKey}>{t.stageKey}</div>
        </div>
      ),
    },
    {
      key: 'tier',
      header: 'Default tier',
      width: '1fr',
      render: (t) => <ModelTierPill tier={t.defaultModelTier} size="sm" />,
    },
    {
      key: 'cost',
      header: 'Cost / cap',
      width: '0.9fr',
      render: (t) => (
        <span className="font-mono" style={{ fontSize: 12.5 }}>
          {t.defaultCreditEstimate} / {t.maxCreditsPerExecution}
        </span>
      ),
    },
    {
      key: 'review',
      header: 'Review',
      width: '0.8fr',
      render: (t) =>
        t.requiresHumanReviewByDefault ? (
          <Badge tone="info" size="sm">Required</Badge>
        ) : (
          <Badge tone="neutral" size="sm">Optional</Badge>
        ),
    },
    {
      key: 'active',
      header: 'Status',
      width: '0.8fr',
      render: (t) =>
        t.active ? (
          <Badge tone="success" size="sm">Active</Badge>
        ) : (
          <Badge tone="neutral" size="sm">Inactive</Badge>
        ),
    },
    {
      key: 'edit',
      header: '',
      width: '0.6fr',
      align: 'end',
      render: (t) => (
        <Button size="sm" icon="edit" onClick={() => setEditing(t)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <AppShell zone="internal" title="Stage templates" breadcrumb={['Montanari', 'Stage templates']}>
      {isLoading ? (
        <LoadingState label="Loading stage templates…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable columns={columns} rows={templates ?? []} getRowKey={(t) => t.stageKey} />
      )}

      {editing && <EditTemplateModal template={editing} onClose={() => setEditing(null)} />}
    </AppShell>
  );
}

function EditTemplateModal({
  template,
  onClose,
}: {
  template: StageTemplateResponse;
  onClose: () => void;
}) {
  const toast = useToast();
  const update = useUpdateStageTemplate(template.stageKey);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    reset({
      name: template.name,
      description: template.description ?? '',
      templateContent: template.templateContent ?? '',
      defaultModelTier: template.defaultModelTier,
      defaultCreditEstimate: template.defaultCreditEstimate,
      maxCreditsPerExecution: template.maxCreditsPerExecution,
      requiresHumanReviewByDefault: template.requiresHumanReviewByDefault,
      gateReusableAsStandard: template.gateReusableAsStandard,
      gateComplexArchitecture: template.gateComplexArchitecture,
      gateSecuritySensitive: template.gateSecuritySensitive,
      gateLegacyInvolved: template.gateLegacyInvolved,
      active: template.active,
    });
  }, [template, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({
        ...values,
        defaultModelTier: values.defaultModelTier as ModelTier,
      });
      toast.success(`${values.name} saved.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not save the template.');
    }
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit · ${template.stageKey}`}
      width={620}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button variant="primary" icon="save" onClick={onSubmit} loading={update.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Name</label>
          <input className={styles.input} {...register('name')} />
          {errors.name && <div className={styles.err}>{errors.name.message}</div>}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea className={styles.textarea} rows={2} {...register('description')} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Template content</label>
          <textarea className={styles.textarea} rows={6} {...register('templateContent')} />
        </div>

        <div className={styles.two}>
          <div className={styles.field}>
            <label className={styles.label}>Default model tier</label>
            <select className={styles.select} {...register('defaultModelTier')}>
              {MODEL_TIERS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Default credit estimate</label>
            <input type="number" className={styles.input} {...register('defaultCreditEstimate')} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Max credits per execution</label>
          <input type="number" className={styles.input} {...register('maxCreditsPerExecution')} />
        </div>

        <div className={styles.checkGrid}>
          <label className={styles.checkRow}>
            <input type="checkbox" {...register('requiresHumanReviewByDefault')} />
            Requires human review
          </label>
          <label className={styles.checkRow}>
            <input type="checkbox" {...register('active')} />
            Active
          </label>
          <label className={styles.checkRow}>
            <input type="checkbox" {...register('gateReusableAsStandard')} />
            Gate: reusable as standard
          </label>
          <label className={styles.checkRow}>
            <input type="checkbox" {...register('gateComplexArchitecture')} />
            Gate: complex architecture
          </label>
          <label className={styles.checkRow}>
            <input type="checkbox" {...register('gateSecuritySensitive')} />
            Gate: security sensitive
          </label>
          <label className={styles.checkRow}>
            <input type="checkbox" {...register('gateLegacyInvolved')} />
            Gate: legacy involved
          </label>
        </div>
      </form>
    </Modal>
  );
}
