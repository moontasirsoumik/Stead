<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
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
import { useContactsStore } from '@/stores/contacts.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Contact } from '@/models/contact.model'

const contactsStore = useContactsStore()
const authStore = useAuthStore()

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
        c.role.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q),
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
  formRole.value = contact.role
  formCompany.value = contact.company
  formPhone.value = contact.phone
  formEmail.value = contact.email
  formAddress.value = contact.address
  formNote.value = contact.note
  formCategory.value = contact.category
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
  deletingId.value = id
  confirmDeleteOpen.value = true
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

    <ContentCard v-if="contactsStore.loading && !contactsStore.items.length" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="5" />
    </ContentCard>

    <ContentCard v-else-if="!filteredItems.length" class="page-enter" :style="{ '--stagger': 2 }">
      <EmptyState
        v-if="!contactsStore.items.length"
        title="No contacts saved yet"
        subtitle="Add your plumber, electrician, or landlord — keep important contacts in one place."
        icon="empty"
        action-label="Add contact"
        @action="openCreateDrawer"
      />
      <EmptyState v-else title="No matches" subtitle="Try adjusting your filters or search term." icon="search" />
    </ContentCard>

    <div v-else class="contacts-grid">
      <ContentCard
        v-for="(contact, ci) in filteredItems"
        :key="contact.id"
        class="contact-card page-enter"
        :style="{ '--stagger': 2 + ci }"
      >
        <div class="contact-card__top">
          <SAvatar :name="contact.name" size="lg" />
          <div class="contact-card__actions">
            <SIconButton label="Edit" size="sm" @click="openEditDrawer(contact)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 1.5L12.5 3.5L4.5 11.5H2.5V9.5L10.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </SIconButton>
            <SIconButton label="Delete" size="sm" @click="confirmDelete(contact.id)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4H12M5 4V2.5H9V4M5.5 6V10.5M8.5 6V10.5M3.5 4L4 11.5H10L10.5 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </SIconButton>
          </div>
        </div>

        <h3 class="contact-card__name">{{ contact.name }}</h3>
        <p v-if="contact.role || contact.company" class="contact-card__role">
          {{ contact.role }}<template v-if="contact.role && contact.company"> · </template>{{ contact.company }}
        </p>

        <SBadge :variant="categoryVariant(contact.category)" size="sm" class="contact-card__badge">
          {{ contact.category }}
        </SBadge>

        <div class="contact-card__links">
          <a v-if="contact.phone" :href="`tel:${contact.phone}`" class="contact-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 2H3.5C2.95 2 2.5 2.45 2.5 3C2.5 8.25 6.75 12.5 12 12.5C12.55 12.5 13 12.05 13 11.5V9.5L10.5 8.5L9 10C7.5 9.25 5.75 7.5 5 6L6.5 4.5L5.5 2Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <span>{{ contact.phone }}</span>
          </a>
          <a v-if="contact.email" :href="`mailto:${contact.email}`" class="contact-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2" /><path d="M1.5 4.5L7 8L12.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" /></svg>
            <span>{{ contact.email }}</span>
          </a>
        </div>

        <p v-if="contact.note" class="contact-card__note">{{ contact.note }}</p>
      </ContentCard>
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
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-l);
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.contact-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-s);
}

.contact-card__actions {
  display: flex;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.contact-card:hover .contact-card__actions {
  opacity: 1;
}

.contact-card__name {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
  letter-spacing: var(--tracking-tight);
}

.contact-card__role {
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
}

.contact-card__badge {
  align-self: flex-start;
  margin-top: var(--space-2xs);
}

.contact-card__links {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-top: var(--space-s);
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font: var(--text-caption);
  color: var(--color-fg-brand);
  text-decoration: none;
  transition: color var(--duration-fast) var(--easing-standard);
}

.contact-link:hover {
  color: var(--color-fg-primary);
}

.contact-link svg {
  flex-shrink: 0;
  color: var(--color-fg-tertiary);
}

.contact-card__note {
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-border-subtle);
}

@media (max-width: 640px) {
  .contacts-grid {
    grid-template-columns: 1fr;
  }

  .contact-card__actions {
    opacity: 1;
  }
}
</style>
