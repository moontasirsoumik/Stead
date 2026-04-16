<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import DataList from '@/components/data/DataList.vue'
import SectionHeader from '@/components/data/SectionHeader.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SInput from '@/components/ui/SInput.vue'
import STextarea from '@/components/ui/STextarea.vue'
import SSelect from '@/components/ui/SSelect.vue'
import SIconButton from '@/components/ui/SIconButton.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorBanner from '@/components/feedback/ErrorBanner.vue'
import LoadingSkeleton from '@/components/feedback/LoadingSkeleton.vue'
import ConfirmDialog from '@/components/feedback/ConfirmDialog.vue'
import FormDrawer from '@/components/forms/FormDrawer.vue'
import FormField from '@/components/forms/FormField.vue'
import FormSection from '@/components/forms/FormSection.vue'
import { useDocumentsStore } from '@/stores/documents.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/utils/format'
import type { HouseholdDocument } from '@/models/document.model'
import type { DocType } from '@/models/enums'

const documentsStore = useDocumentsStore()
const authStore = useAuthStore()

const search = ref('')
const typeFilter = ref('')
const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingDoc = ref<HouseholdDocument | null>(null)
const confirmDeleteOpen = ref(false)
const deletingId = ref<string | null>(null)

const formTitle = ref('')
const formDocType = ref<DocType>('other')
const formDescription = ref('')
const formIssuer = ref('')
const formIssueDate = ref('')
const formExpiryDate = ref('')
const formReferenceNumber = ref('')
const formNote = ref('')

const typeFilterOptions = [
  { value: '', label: 'All types' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'lease', label: 'Lease' },
  { value: 'contract', label: 'Contract' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
]

const typeFormOptions = [
  { value: 'warranty', label: 'Warranty' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'lease', label: 'Lease' },
  { value: 'contract', label: 'Contract' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'manual', label: 'Manual' },
  { value: 'other', label: 'Other' },
]

function docTypeVariant(t: DocType): 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info' {
  const map: Record<DocType, 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info'> = {
    warranty: 'brand',
    insurance: 'info',
    lease: 'success',
    contract: 'warning',
    receipt: 'default',
    manual: 'default',
    other: 'default',
  }
  return map[t]
}

function expiryStatus(doc: HouseholdDocument): 'ok' | 'expiring' | 'expired' | null {
  if (!doc.expiry_date) return null
  const now = new Date()
  const exp = new Date(doc.expiry_date)
  if (exp < now) return 'expired'
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (exp <= thirtyDays) return 'expiring'
  return 'ok'
}

const filteredItems = computed(() => {
  let result = [...documentsStore.items]
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.issuer.toLowerCase().includes(q),
    )
  }
  if (typeFilter.value) {
    result = result.filter((d) => d.doc_type === typeFilter.value)
  }
  return result.sort((a, b) => a.title.localeCompare(b.title))
})

function openCreateDrawer() {
  editingDoc.value = null
  formTitle.value = ''
  formDocType.value = 'other'
  formDescription.value = ''
  formIssuer.value = ''
  formIssueDate.value = ''
  formExpiryDate.value = ''
  formReferenceNumber.value = ''
  formNote.value = ''
  drawerOpen.value = true
}

function openEditDrawer(doc: HouseholdDocument) {
  editingDoc.value = doc
  formTitle.value = doc.title
  formDocType.value = doc.doc_type
  formDescription.value = doc.description
  formIssuer.value = doc.issuer
  formIssueDate.value = doc.issue_date ? doc.issue_date.slice(0, 10) : ''
  formExpiryDate.value = doc.expiry_date ? doc.expiry_date.slice(0, 10) : ''
  formReferenceNumber.value = doc.reference_number
  formNote.value = doc.note
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formTitle.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      title: formTitle.value.trim(),
      doc_type: formDocType.value,
      description: formDescription.value.trim(),
      issuer: formIssuer.value.trim(),
      issue_date: formIssueDate.value || null,
      expiry_date: formExpiryDate.value || null,
      reference_number: formReferenceNumber.value.trim(),
      note: formNote.value.trim(),
    }
    if (editingDoc.value) {
      await documentsStore.update(editingDoc.value.id, payload)
    } else {
      await documentsStore.create({
        ...payload,
        household_id: authStore.householdId!,
        deleted: false,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function confirmDelete(id: string) {
  deletingId.value = id
  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (deletingId.value) {
    await documentsStore.remove(deletingId.value)
  }
  confirmDeleteOpen.value = false
  deletingId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await documentsStore.fetchDocuments(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Documents" subtitle="Warranties, leases, insurance & more" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Document</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="documentsStore.error" :message="documentsStore.error" @retry="authStore.householdId && documentsStore.fetchDocuments(authStore.householdId)" />

    <!-- Expiring Soon Alerts -->
    <div v-if="documentsStore.expiringSoon.length || documentsStore.expired.length" class="alerts-section page-enter" :style="{ '--stagger': 1 }">
      <div v-for="doc in documentsStore.expired" :key="`exp-${doc.id}`" class="alert-card alert-card--error">
        <div class="alert-card__icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5" /><path d="M9 5.5V9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /><circle cx="9" cy="12.5" r="0.75" fill="currentColor" /></svg>
        </div>
        <div class="alert-card__text">
          <strong>{{ doc.title }}</strong> has expired
          <span v-if="doc.expiry_date" class="alert-card__date">{{ formatDate(doc.expiry_date) }}</span>
        </div>
        <SButton variant="subtle" size="sm" @click="openEditDrawer(doc)">Review</SButton>
      </div>
      <div v-for="doc in documentsStore.expiringSoon" :key="`soon-${doc.id}`" class="alert-card alert-card--warning">
        <div class="alert-card__icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" stroke-width="1.5" /><path d="M9 5V9L12 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </div>
        <div class="alert-card__text">
          <strong>{{ doc.title }}</strong> expiring soon
          <span v-if="doc.expiry_date" class="alert-card__date">{{ formatDate(doc.expiry_date) }}</span>
        </div>
        <SButton variant="subtle" size="sm" @click="openEditDrawer(doc)">Review</SButton>
      </div>
    </div>

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 2 }">
      <SSelect v-model="typeFilter" :options="typeFilterOptions" placeholder="Type" />
    </FilterBar>

    <ContentCard v-if="documentsStore.loading && !documentsStore.items.length" class="page-enter" :style="{ '--stagger': 3 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <ContentCard v-else-if="!filteredItems.length" class="page-enter" :style="{ '--stagger': 3 }">
      <EmptyState
        v-if="!documentsStore.items.length"
        title="No documents tracked"
        subtitle="Add warranties, leases, or insurance policies — never lose track of important papers."
        icon="empty"
        action-label="Add document"
        @action="openCreateDrawer"
      />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </ContentCard>

    <ContentCard v-else class="page-enter" :style="{ '--stagger': 3 }">
      <DataList dividers>
        <div v-for="doc in filteredItems" :key="doc.id" class="doc-row" role="listitem" @click="openEditDrawer(doc)">
          <div class="doc-row__icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 2H12L16 6V16C16 17.1 15.1 18 14 18H6C4.9 18 4 17.1 4 16V4C4 2.9 4.9 2 6 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /><path d="M12 2V6H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </div>

          <div class="doc-row__body">
            <span class="doc-row__title">{{ doc.title }}</span>
            <span v-if="doc.issuer" class="doc-row__issuer">{{ doc.issuer }}</span>
          </div>

          <div class="doc-row__meta">
            <SBadge :variant="docTypeVariant(doc.doc_type)" size="sm">{{ doc.doc_type }}</SBadge>
            <SBadge v-if="expiryStatus(doc) === 'expired'" variant="error" size="sm">Expired</SBadge>
            <SBadge v-else-if="expiryStatus(doc) === 'expiring'" variant="warning" size="sm">Expiring soon</SBadge>
          </div>

          <div class="doc-row__dates">
            <span v-if="doc.issue_date" class="doc-row__date">
              <span class="doc-row__date-label">Issued</span>
              {{ formatDate(doc.issue_date) }}
            </span>
            <span v-if="doc.expiry_date" class="doc-row__date">
              <span class="doc-row__date-label">Expires</span>
              {{ formatDate(doc.expiry_date) }}
            </span>
          </div>

          <span v-if="doc.reference_number" class="doc-row__ref">#{{ doc.reference_number }}</span>

          <div class="doc-row__actions" @click.stop>
            <SIconButton label="Delete" size="sm" @click="confirmDelete(doc.id)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M5 4V2.5H9V4M5.5 6V10.5M8.5 6V10.5M3.5 4L4 11.5H10L10.5 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </SIconButton>
          </div>
        </div>
      </DataList>
    </ContentCard>

    <FormDrawer
      :open="drawerOpen"
      :title="editingDoc ? 'Edit Document' : 'Add Document'"
      :submit-label="editingDoc ? 'Update' : 'Create'"
      :loading="drawerLoading"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    >
      <FormSection>
        <FormField><SInput v-model="formTitle" label="Title" required placeholder="e.g. Dishwasher Warranty" /></FormField>
        <FormField><SSelect v-model="formDocType" label="Type" :options="typeFormOptions" /></FormField>
        <FormField><STextarea v-model="formDescription" label="Description" :rows="2" placeholder="What this document covers…" /></FormField>
        <FormField><SInput v-model="formIssuer" label="Issuer" placeholder="e.g. Samsung, State Farm" /></FormField>
        <FormField><SInput v-model="formIssueDate" label="Issue Date" type="date" /></FormField>
        <FormField><SInput v-model="formExpiryDate" label="Expiry Date" type="date" /></FormField>
        <FormField><SInput v-model="formReferenceNumber" label="Reference Number" placeholder="Policy or serial number" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra notes…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="Delete Document"
      message="Are you sure? This document record will be removed."
      confirm-label="Delete"
      variant="danger"
      @confirm="handleDelete"
      @cancel="confirmDeleteOpen = false"
    />
  </PageContainer>
</template>

<style scoped>
.alerts-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  margin-bottom: var(--space-l);
}

.alert-card {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-m) var(--space-l);
  border-radius: var(--radius-l);
  border: 1px solid transparent;
}

.alert-card--error {
  background: var(--color-surface-error);
  border-color: var(--color-border-error);
  color: var(--color-fg-error);
}

.alert-card--warning {
  background: var(--color-surface-warning);
  border-color: var(--color-border-warning);
  color: var(--color-fg-warning);
}

.alert-card__icon {
  flex-shrink: 0;
}

.alert-card__text {
  flex: 1;
  font: var(--text-body-2);
}

.alert-card__text strong {
  font-weight: var(--font-weight-semibold);
}

.alert-card__date {
  font: var(--text-caption);
  opacity: 0.7;
  margin-left: var(--space-xs);
}

.doc-row {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  min-height: var(--height-row-min);
  padding: var(--space-xs) var(--space-l);
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
}

.doc-row:hover {
  background: var(--color-bg-tertiary);
}

.doc-row__icon {
  flex-shrink: 0;
  color: var(--color-fg-tertiary);
}

.doc-row__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.doc-row__title {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-row__issuer {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.doc-row__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.doc-row__dates {
  display: flex;
  gap: var(--space-m);
  flex-shrink: 0;
}

.doc-row__date {
  display: flex;
  flex-direction: column;
  font: var(--text-caption);
  color: var(--color-fg-secondary);
  white-space: nowrap;
}

.doc-row__date-label {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.doc-row__ref {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

.doc-row__actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.doc-row:hover .doc-row__actions {
  opacity: 1;
}

@media (max-width: 640px) {
  .doc-row {
    flex-wrap: wrap;
  }

  .doc-row__dates {
    width: 100%;
    padding-left: calc(20px + var(--space-m));
  }

  .doc-row__actions {
    opacity: 1;
  }
}
</style>
