<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import SButton from '@/components/ui/SButton.vue'
import SBadge from '@/components/ui/SBadge.vue'
import SAvatar from '@/components/ui/SAvatar.vue'
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
import { useMobileExpand } from '@/composables/useMobileExpand'
import { useContactsStore } from '@/stores/contacts.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import type { Contact } from '@/models/contact.model'

const contactsStore = useContactsStore()
const authStore = useAuthStore()
const appStore = useAppStore()
const { mobileExpandedId, handleRowClick } = useMobileExpand()

const search = ref('')
const categoryFilter = ref('')
const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingContact = ref<Contact | null>(null)
const confirmDeleteOpen = ref(false)
const deletingId = ref<string | null>(null)

const formName = ref('')
const formRole = ref('')
const formCompany = ref('')
const formPhone = ref('')
const formEmail = ref('')
const formAddress = ref('')
const formNote = ref('')
const formCategory = ref('')

const categoryOptions = [
  { value: '', label: 'All categories' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

const categoryFormOptions = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'mechanic', label: 'Mechanic' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

function formatLabel(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function categoryVariant(cat: string): 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info' {
  const map: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info'> = {
    plumber: 'brand',
    electrician: 'warning',
    landlord: 'info',
    doctor: 'success',
    mechanic: 'default',
    insurance: 'error',
  }
  return map[cat] ?? 'default'
}

const filteredItems = computed(() => {
  let result = contactsStore.sortedByName
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.role ?? '').toLowerCase().includes(q) ||
        (c.company ?? '').toLowerCase().includes(q),
    )
  }
  if (categoryFilter.value) {
    result = result.filter((c) => c.category === categoryFilter.value)
  }
  return result
})

function openCreateDrawer() {
  editingContact.value = null
  formName.value = ''
  formRole.value = ''
  formCompany.value = ''
  formPhone.value = ''
  formEmail.value = ''
  formAddress.value = ''
  formNote.value = ''
  formCategory.value = 'other'
  drawerOpen.value = true
}

function openEditDrawer(contact: Contact) {
  editingContact.value = contact
  formName.value = contact.name
  formRole.value = contact.role ?? ''
  formCompany.value = contact.company ?? ''
  formPhone.value = contact.phone ?? ''
  formEmail.value = contact.email ?? ''
  formAddress.value = contact.address ?? ''
  formNote.value = contact.note ?? ''
  formCategory.value = contact.category ?? 'other'
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim()) return
  drawerLoading.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      role: formRole.value.trim(),
      company: formCompany.value.trim(),
      phone: formPhone.value.trim(),
      email: formEmail.value.trim(),
      address: formAddress.value.trim(),
      note: formNote.value.trim(),
      category: formCategory.value,
    }
    if (editingContact.value) {
      await contactsStore.update(editingContact.value.id, payload)
    } else {
      await contactsStore.create({
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
  if (appStore.confirmBeforeDelete) {
    deletingId.value = id
    confirmDeleteOpen.value = true
  } else {
    contactsStore.remove(id)
  }
}

async function handleDelete() {
  if (deletingId.value) {
    await contactsStore.remove(deletingId.value)
  }
  confirmDeleteOpen.value = false
  deletingId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await contactsStore.fetchContacts(authStore.householdId)
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Contacts" subtitle="Your household's important people" class="page-enter" :style="{ '--stagger': 0 }">
      <template #actions>
        <SButton @click="openCreateDrawer">Add Contact</SButton>
      </template>
    </PageHeader>

    <ErrorBanner v-if="contactsStore.error" :message="contactsStore.error" @retry="authStore.householdId && contactsStore.fetchContacts(authStore.householdId)" />

    <FilterBar v-model:search="search" show-search class="page-enter" :style="{ '--stagger': 1 }">
      <SSelect v-model="categoryFilter" :options="categoryOptions" placeholder="Category" />
    </FilterBar>

    <div v-if="contactsStore.loading && !contactsStore.items.length" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="5" />
    </div>

    <div v-else-if="!filteredItems.length" class="empty-section page-enter" :style="{ '--stagger': 2 }">
      <EmptyState
        v-if="!contactsStore.items.length"
        title="No contacts saved yet"
        subtitle="Add your plumber, electrician, or landlord — keep important contacts in one place."
        icon="empty"
        action-label="Add contact"
        @action="openCreateDrawer"
      />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </div>

    <div v-else class="contact-table page-enter" :style="{ '--stagger': 2 }">
      <div class="contact-table__header">
        <span class="contact-table__th">Contact</span>
        <span class="contact-table__th contact-table__th--center">Category</span>
        <span class="contact-table__th">Phone</span>
        <span class="contact-table__th">Email</span>
        <span class="contact-table__th contact-table__th--right">Actions</span>
      </div>
      <div v-for="contact in filteredItems" :key="contact.id" class="contact-entry">
        <div class="contact-row" :class="{ 'contact-row--m-expanded': mobileExpandedId === contact.id }" @click="handleRowClick(contact.id, () => openEditDrawer(contact))">
          <div class="contact-row__name-col">
            <SAvatar :name="contact.name" size="sm" />
            <div class="contact-row__info">
              <span class="contact-row__name">{{ contact.name }}</span>
              <span v-if="contact.role || contact.company" class="contact-row__role">
                {{ contact.role }}<template v-if="contact.role && contact.company"> · </template>{{ contact.company }}
              </span>
            </div>
          </div>
          <div class="contact-row__chips">
            <div class="contact-row__category">
              <SBadge v-if="contact.category" :variant="categoryVariant(contact.category)" size="sm">{{ formatLabel(contact.category) }}</SBadge>
            </div>
            <div class="contact-row__phone">
              <a v-if="contact.phone" :href="`tel:${contact.phone}`" class="contact-link" @click.stop>{{ contact.phone }}</a>
            </div>
            <div class="contact-row__email">
              <a v-if="contact.email" :href="`mailto:${contact.email}`" class="contact-link" @click.stop>{{ contact.email }}</a>
            </div>
          </div>
          <div class="contact-row__actions" @click.stop>
            <SIconButton label="Delete" size="sm" @click="confirmDelete(contact.id)">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
            </SIconButton>
          </div>
          <span class="contact-row__chevron material-symbols-rounded">expand_more</span>
        </div>
        <div class="m-detail" :class="{ 'm-detail--open': mobileExpandedId === contact.id }">
          <div class="m-detail__inner">
            <div class="m-detail__body">
              <SBadge v-if="contact.category" size="sm">{{ contact.category }}</SBadge>
              <a v-if="contact.phone" :href="'tel:' + contact.phone" class="m-detail__link" @click.stop>{{ contact.phone }}</a>
              <a v-if="contact.email" :href="'mailto:' + contact.email" class="m-detail__link" @click.stop>{{ contact.email }}</a>
              <button class="m-detail__edit" @click.stop="openEditDrawer(contact)">
                <span class="material-symbols-rounded">edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <FormDrawer
      :open="drawerOpen"
      :title="editingContact ? 'Edit Contact' : 'Add Contact'"
      :submit-label="editingContact ? 'Update' : 'Create'"
      :loading="drawerLoading"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    >
      <FormSection>
        <FormField><SInput v-model="formName" label="Name" required placeholder="Full name" /></FormField>
        <FormField><SInput v-model="formRole" label="Role" placeholder="e.g. Property manager" /></FormField>
        <FormField><SInput v-model="formCompany" label="Company" placeholder="Business name" /></FormField>
        <FormField><SInput v-model="formPhone" label="Phone" type="tel" placeholder="Phone number" /></FormField>
        <FormField><SInput v-model="formEmail" label="Email" type="email" placeholder="Email address" /></FormField>
        <FormField><STextarea v-model="formAddress" label="Address" :rows="2" placeholder="Street address" /></FormField>
        <FormField><SSelect v-model="formCategory" label="Category" :options="categoryFormOptions" /></FormField>
        <FormField><STextarea v-model="formNote" label="Note" :rows="2" placeholder="Any extra notes…" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="Delete Contact"
      message="Are you sure? This contact will be removed."
      confirm-label="Delete"
      variant="danger"
      @confirm="handleDelete"
      @cancel="confirmDeleteOpen = false"
    />
  </PageContainer>
</template>

<style scoped>
.contact-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.contact-table__header {
  display: grid;
  grid-template-columns: 1fr 100px 140px 200px 48px;
  align-items: center;
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container-low);
  border-bottom: 1px solid var(--color-border-subtle);
  gap: var(--space-m);
}

.contact-table__th {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.contact-table__th--center { text-align: center; }
.contact-table__th--right { text-align: right; }

.contact-entry {
  border-bottom: 1px solid var(--color-border-subtle);
}
.contact-entry:last-child { border-bottom: none; }

.contact-row {
  display: grid;
  grid-template-columns: 1fr 100px 140px 200px 48px;
  align-items: center;
  min-height: var(--height-row-min);
  padding: 0 var(--space-l);
  gap: var(--space-m);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--easing-standard);
}

.contact-row__chevron { display: none; }
.m-detail { display: none; }
.contact-row:hover { background: var(--color-bg-tertiary); }
.contact-row:active { transform: scale(0.98); transition: transform var(--duration-fast) var(--easing-standard); }

.contact-row__name-col {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  min-width: 0;
}

.contact-row__info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.contact-row__name {
  font: var(--text-body-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-fg-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-row__role {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
}

.contact-row__category {
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-row__phone,
.contact-row__email {
  min-width: 0;
}

.contact-link {
  font: var(--text-caption);
  color: var(--color-fg-brand);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  transition: color var(--duration-fast) var(--easing-standard);
}

.contact-link:hover {
  color: var(--color-fg-primary);
}

.contact-row__actions {
  display: flex;
  justify-content: flex-end;
}

.contact-row__chips {
  display: contents;
}

@media (max-width: 640px) {
  .contact-table__header { display: none; }
  .contact-row {
    grid-template-columns: 1fr 20px;
    grid-template-rows: auto;
    padding: var(--space-s) var(--space-m);
    column-gap: var(--space-s);
  }
  .contact-row__name-col { grid-column: 1; grid-row: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .contact-row__chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-column: 2;
    grid-row: 1;
    color: var(--color-fg-disabled);
    font-size: 18px;
    transition: transform var(--duration-fast) var(--easing-out);
  }
  .contact-row--m-expanded .contact-row__chevron { transform: rotate(180deg); }
  .contact-row__chips { display: none; }
  .contact-row__actions { display: none; }

  .m-detail {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows var(--duration-normal) var(--easing-out);
  }
  .m-detail--open { grid-template-rows: 1fr; }
  .m-detail__inner { overflow: hidden; }
  .m-detail__body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2xs);
    padding: var(--space-xs) var(--space-m);
    border-top: 1px solid var(--color-border-subtle);
    background: var(--color-bg-secondary);
  }
  .m-detail__chip {
    font: var(--text-label-sm);
    color: var(--color-fg-secondary);
    background: var(--color-bg-tertiary);
    padding: 2px var(--space-s);
    border-radius: var(--radius-pill);
    white-space: nowrap;
  }
  .m-detail__edit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin-left: auto;
    border-radius: var(--radius-s);
    border: 1px solid var(--color-border-default);
    background: var(--color-bg-elevated);
    color: var(--color-fg-tertiary);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color var(--duration-fast) var(--easing-standard),
                color var(--duration-fast) var(--easing-standard);
  }
  .m-detail__edit:active { background: var(--color-bg-tertiary); color: var(--color-fg-primary); }
  .m-detail__edit .material-symbols-rounded { font-size: 15px; }
  .m-detail__link {
    font: var(--text-label-sm);
    color: var(--color-fg-brand);
    background: var(--color-bg-tertiary);
    padding: 2px var(--space-s);
    border-radius: var(--radius-pill);
    white-space: nowrap;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }
}
</style>
