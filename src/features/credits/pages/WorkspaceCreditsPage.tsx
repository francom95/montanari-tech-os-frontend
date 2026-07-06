import { useState } from 'react';
import { AppShell } from '@/app/layout/AppShell';
import { Modal, Button, Icon } from '@/shared/components';
import { CreditsView } from '../components/CreditsView';

/**
 * Client-facing credits page. "Request top-up" is UI-only: the backend exposes top-up/adjust
 * as MT_ADMIN-only operations (/api/internal/credits) with no client-initiated request
 * endpoint. Rather than invent one, this opens an informational modal. Adding a
 * client "top-up request" workflow is FUTURE_BACKEND_REQUIRED.
 */
export function WorkspaceCreditsPage() {
  const [askOpen, setAskOpen] = useState(false);

  return (
    <AppShell
      zone="client"
      title="Credits"
      breadcrumb={['Workspace', 'Credits']}
      primaryAction={{ label: 'Request top-up', icon: 'add_card', onClick: () => setAskOpen(true) }}
    >
      <CreditsView />

      <Modal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title="Request a top-up"
        width={440}
        footer={
          <Button variant="primary" onClick={() => setAskOpen(false)}>
            Got it
          </Button>
        }
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="info" size={20} color="var(--color-accent)" />
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Credit top-ups are processed by your Montanari Tech account manager. Reach out to your
            contact to add credits to this organization — they’ll appear here once applied.
          </p>
        </div>
      </Modal>
    </AppShell>
  );
}
