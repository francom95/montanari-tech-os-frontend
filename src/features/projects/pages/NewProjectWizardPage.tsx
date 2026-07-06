import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { Button, useToast } from '@/shared/components';
import { AppError } from '@/shared/api';
import type { ProjectType, RiskTag } from '@/shared/api';
import { useCreateProject } from '../hooks';
import { PROJECT_TYPE_OPTIONS, RISK_TAG_OPTIONS, RISK_LEVEL_LABEL } from '../labels';
import styles from './projects.module.css';

const schema = z.object({
  projectType: z.string().min(1, 'Select a project type'),
  name: z.string().min(1, 'Project name is required'),
  businessObjective: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  riskTags: z.array(z.enum(['PAYMENTS', 'HEALTH', 'PERSONAL_DATA'])),
});
type FormValues = z.infer<typeof schema>;

const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export function NewProjectWizardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const createProject = useCreateProject();
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { projectType: '', name: '', businessObjective: '', riskLevel: 'LOW', riskTags: [] },
  });

  const next = async () => {
    const ok = await trigger(['projectType', 'name']);
    if (ok) setStep(1);
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      const project = await createProject.mutateAsync({
        name: values.name,
        projectType: values.projectType as ProjectType,
        businessObjective: values.businessObjective || null,
        riskLevel: values.riskLevel,
        riskTags: values.riskTags as RiskTag[],
      });
      toast.success('Project created. Stages are being provisioned.');
      navigate(`/app/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof AppError ? err.message : 'Could not create the project.');
    }
  });

  return (
    <AppShell zone="client" title="New project" breadcrumb={['Projects', 'New project']}>
      <div className={styles.wizard}>
        <div className={styles.steps}>
          <div className={[styles.step, step === 0 ? styles.stepActive : styles.stepDone].join(' ')}>
            <span className={styles.stepDot}>{step > 0 ? '✓' : '1'}</span> Project basics
          </div>
          <div className={styles.stepLine} />
          <div className={[styles.step, step === 1 ? styles.stepActive : ''].join(' ')}>
            <span className={styles.stepDot}>2</span> Risk profile
          </div>
        </div>

        <form onSubmit={onSubmit}>
          {step === 0 && (
            <div className={styles.card}>
              <div className={styles.field}>
                <label className={styles.label}>Project type</label>
                <Controller
                  control={control}
                  name="projectType"
                  render={({ field }) => (
                    <div className={styles.typeGrid}>
                      {PROJECT_TYPE_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          className={[styles.typeCard, field.value === opt.value ? styles.typeCardActive : ''].filter(Boolean).join(' ')}
                          aria-pressed={field.value === opt.value}
                          onClick={() => field.onChange(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.projectType && <div className={styles.err}>{errors.projectType.message}</div>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Project name
                </label>
                <input id="name" className={styles.input} {...register('name')} />
                {errors.name && <div className={styles.err}>{errors.name.message}</div>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="businessObjective">
                  Business objective <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  id="businessObjective"
                  className={styles.textarea}
                  placeholder="What is this project meant to achieve?"
                  {...register('businessObjective')}
                />
              </div>

              <div className={styles.actions}>
                <Button type="button" variant="ghost" onClick={() => navigate('/app/projects')}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" iconRight="arrow_forward" onClick={next}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className={styles.card}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="riskLevel">
                  Risk level
                </label>
                <select id="riskLevel" className={styles.select} {...register('riskLevel')}>
                  {RISK_LEVELS.map((r) => (
                    <option key={r} value={r}>
                      {RISK_LEVEL_LABEL[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Risk tags</label>
                <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: '0 0 10px' }}>
                  Tags flag stages that always require human review (payments, health, personal data).
                </p>
                <Controller
                  control={control}
                  name="riskTags"
                  render={({ field }) => (
                    <div className={styles.tagRow}>
                      {RISK_TAG_OPTIONS.map((opt) => {
                        const active = field.value.includes(opt.value);
                        return (
                          <button
                            type="button"
                            key={opt.value}
                            className={[styles.tag, active ? styles.tagActive : ''].filter(Boolean).join(' ')}
                            aria-pressed={active}
                            onClick={() =>
                              field.onChange(
                                active
                                  ? field.value.filter((v) => v !== opt.value)
                                  : [...field.value, opt.value],
                              )
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              <div className={styles.actions}>
                <Button type="button" variant="ghost" icon="arrow_back" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" icon="check" loading={createProject.isPending}>
                  Create project
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppShell>
  );
}
