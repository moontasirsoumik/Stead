<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageContainer from '@/components/layout/PageContainer.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ContentCard from '@/components/layout/ContentCard.vue'
import SButton from '@/components/ui/SButton.vue'
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
import { useMealsStore } from '@/stores/meals.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Meal, MealPlan } from '@/models/meal.model'
import type { MealType } from '@/models/enums'

const mealsStore = useMealsStore()
const authStore = useAuthStore()

const weekOffset = ref(0)
const drawerOpen = ref(false)
const drawerLoading = ref(false)
const editingMeal = ref<Meal | null>(null)
const planNoteOpen = ref(false)
const planNoteText = ref('')
const confirmDeleteOpen = ref(false)
const deletingMealId = ref<string | null>(null)

const formName = ref('')
const formMealType = ref<MealType>('breakfast')
const formDayOfWeek = ref('0')
const formRecipeNotes = ref('')
const formServings = ref('4')

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const mealTypeLabels: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const mealTypeOptions = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

const dayOptions = [
  { value: '0', label: 'Monday' },
  { value: '1', label: 'Tuesday' },
  { value: '2', label: 'Wednesday' },
  { value: '3', label: 'Thursday' },
  { value: '4', label: 'Friday' },
  { value: '5', label: 'Saturday' },
  { value: '6', label: 'Sunday' },
]

function getMonday(offset: number): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const selectedMonday = computed(() => getMonday(weekOffset.value))

const selectedMondayStr = computed(() => selectedMonday.value.toISOString().slice(0, 10))

const weekDates = computed(() => {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(selectedMonday.value)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
})

const weekLabel = computed(() => {
  const mon = selectedMonday.value
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(mon)} – ${fmt.format(sun)}`
})

const isCurrentWeek = computed(() => weekOffset.value === 0)

const activePlan = computed<MealPlan | null>(() =>
  mealsStore.plans.find((p) => p.week_start === selectedMondayStr.value) ?? null,
)

const planMeals = computed(() => {
  if (!activePlan.value) return []
  return mealsStore.getMealsForPlan(activePlan.value.id)
})

function getMeal(dayIndex: number, type: MealType): Meal | undefined {
  return planMeals.value.find((m) => m.day_of_week === dayIndex && m.meal_type === type)
}

function prevWeek() {
  weekOffset.value--
}

function nextWeek() {
  weekOffset.value++
}

function goToCurrentWeek() {
  weekOffset.value = 0
}

async function createPlan() {
  if (!authStore.householdId) return
  await mealsStore.createPlan({
    household_id: authStore.householdId,
    week_start: selectedMondayStr.value,
    note: '',
    deleted: false,
  })
}

function openAddMeal(dayIndex: number, type: MealType) {
  editingMeal.value = null
  formName.value = ''
  formMealType.value = type
  formDayOfWeek.value = String(dayIndex)
  formRecipeNotes.value = ''
  formServings.value = '4'
  drawerOpen.value = true
}

function openEditMeal(meal: Meal) {
  editingMeal.value = meal
  formName.value = meal.name
  formMealType.value = meal.meal_type
  formDayOfWeek.value = String(meal.day_of_week)
  formRecipeNotes.value = meal.recipe_notes
  formServings.value = String(meal.servings)
  drawerOpen.value = true
}

async function handleSubmit() {
  if (!formName.value.trim() || !activePlan.value) return
  drawerLoading.value = true
  try {
    const payload = {
      name: formName.value.trim(),
      meal_type: formMealType.value,
      day_of_week: Number(formDayOfWeek.value),
      recipe_notes: formRecipeNotes.value.trim(),
      servings: Number(formServings.value) || 4,
    }
    if (editingMeal.value) {
      await mealsStore.updateMeal(editingMeal.value.id, payload)
    } else {
      await mealsStore.createMeal({
        ...payload,
        meal_plan_id: activePlan.value.id,
        household_id: authStore.householdId!,
        deleted: false,
      })
    }
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function openPlanNote() {
  planNoteText.value = activePlan.value?.note ?? ''
  planNoteOpen.value = true
}

async function savePlanNote() {
  if (!activePlan.value) return
  await mealsStore.updatePlan(activePlan.value.id, { note: planNoteText.value.trim() })
  planNoteOpen.value = false
}

function confirmDeleteMeal(id: string) {
  deletingMealId.value = id
  confirmDeleteOpen.value = true
}

async function handleDeleteMeal() {
  if (deletingMealId.value) {
    await mealsStore.removeMeal(deletingMealId.value)
  }
  confirmDeleteOpen.value = false
  deletingMealId.value = null
}

onMounted(async () => {
  if (authStore.householdId) {
    await Promise.all([
      mealsStore.fetchPlans(authStore.householdId),
      mealsStore.fetchMeals(authStore.householdId),
    ])
  }
})
</script>

<template>
  <PageContainer>
    <PageHeader title="Meal Planner" subtitle="Plan your weekly meals" class="page-enter" :style="{ '--stagger': 0 }" />

    <ErrorBanner v-if="mealsStore.error" :message="mealsStore.error" @retry="authStore.householdId && mealsStore.fetchPlans(authStore.householdId)" />

    <!-- Week Navigation -->
    <div class="week-nav page-enter" :style="{ '--stagger': 1 }">
      <SIconButton label="Previous week" @click="prevWeek">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </SIconButton>
      <div class="week-nav__label">
        <span class="week-nav__title">{{ weekLabel }}</span>
        <SButton v-if="!isCurrentWeek" variant="subtle" size="sm" @click="goToCurrentWeek">This week</SButton>
      </div>
      <SIconButton label="Next week" @click="nextWeek">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </SIconButton>
    </div>

    <ContentCard v-if="mealsStore.loading && !mealsStore.plans.length" class="page-enter" :style="{ '--stagger': 2 }">
      <LoadingSkeleton :lines="8" />
    </ContentCard>

    <!-- No plan for this week -->
    <ContentCard v-else-if="!activePlan" class="page-enter" :style="{ '--stagger': 2 }">
      <EmptyState
        title="No meal plan for this week"
        subtitle="Plan your meals — know what's for dinner before the hunger hits."
        icon="empty"
        action-label="Create meal plan"
        @action="createPlan"
      />
    </ContentCard>

    <!-- Meal Calendar Grid -->
    <template v-else>
      <!-- Plan note bar -->
      <div v-if="activePlan.note || true" class="plan-note-bar page-enter" :style="{ '--stagger': 2 }">
        <span v-if="activePlan.note" class="plan-note-bar__text">{{ activePlan.note }}</span>
        <span v-else class="plan-note-bar__text plan-note-bar__text--empty">No weekly note</span>
        <SButton variant="subtle" size="sm" @click="openPlanNote">
          {{ activePlan.note ? 'Edit note' : 'Add note' }}
        </SButton>
      </div>

      <div class="meal-grid page-enter" :style="{ '--stagger': 3 }">
        <!-- Header row: day labels -->
        <div class="meal-grid__corner"></div>
        <div v-for="(date, di) in weekDates" :key="di" class="meal-grid__day-header">
          <span class="meal-grid__day-name">{{ dayLabels[di] }}</span>
          <span class="meal-grid__day-date">{{ date.getDate() }}</span>
        </div>

        <!-- Rows: one per meal type -->
        <template v-for="type in mealTypes" :key="type">
          <div class="meal-grid__type-label">{{ mealTypeLabels[type] }}</div>
          <div v-for="(_, di) in 7" :key="`${type}-${di}`" class="meal-grid__cell">
            <template v-if="getMeal(di, type)">
              <button class="meal-cell meal-cell--filled" @click="openEditMeal(getMeal(di, type)!)">
                <span class="meal-cell__name">{{ getMeal(di, type)!.name }}</span>
                <span v-if="getMeal(di, type)!.servings" class="meal-cell__servings">{{ getMeal(di, type)!.servings }}p</span>
              </button>
              <SIconButton class="meal-cell__delete" label="Remove meal" size="sm" @click.stop="confirmDeleteMeal(getMeal(di, type)!.id)">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
              </SIconButton>
            </template>
            <button v-else class="meal-cell meal-cell--empty" @click="openAddMeal(di, type)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3V11M3 7H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
            </button>
          </div>
        </template>
      </div>
    </template>

    <!-- Meal Drawer -->
    <FormDrawer
      :open="drawerOpen"
      :title="editingMeal ? 'Edit Meal' : 'Add Meal'"
      :submit-label="editingMeal ? 'Update' : 'Add'"
      :loading="drawerLoading"
      @close="drawerOpen = false"
      @submit="handleSubmit"
    >
      <FormSection>
        <FormField><SInput v-model="formName" label="Meal Name" required placeholder="e.g. Chicken Stir Fry" /></FormField>
        <FormField><SSelect v-model="formMealType" label="Meal Type" :options="mealTypeOptions" /></FormField>
        <FormField><SSelect v-model="formDayOfWeek" label="Day" :options="dayOptions" /></FormField>
        <FormField><SInput v-model="formServings" label="Servings" type="number" placeholder="4" /></FormField>
        <FormField><STextarea v-model="formRecipeNotes" label="Recipe Notes" :rows="4" placeholder="Ingredients, instructions, or a link…" /></FormField>
      </FormSection>
    </FormDrawer>

    <!-- Plan Note Dialog (reuse FormDrawer) -->
    <FormDrawer
      :open="planNoteOpen"
      title="Weekly Note"
      submit-label="Save"
      @close="planNoteOpen = false"
      @submit="savePlanNote"
    >
      <FormSection>
        <FormField><STextarea v-model="planNoteText" label="Note" :rows="3" placeholder="e.g. Theme: Italian week 🍝" /></FormField>
      </FormSection>
    </FormDrawer>

    <ConfirmDialog
      :open="confirmDeleteOpen"
      title="Remove Meal"
      message="Remove this meal from the plan?"
      confirm-label="Remove"
      variant="danger"
      @confirm="handleDeleteMeal"
      @cancel="confirmDeleteOpen = false"
    />
  </PageContainer>
</template>

<style scoped>
.week-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-l);
  margin-bottom: var(--space-l);
  padding: var(--space-m) 0;
}

.week-nav__label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
  min-width: 180px;
}

.week-nav__title {
  font: var(--text-title-3);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--tracking-tight);
}

.plan-note-bar {
  display: flex;
  align-items: center;
  gap: var(--space-m);
  padding: var(--space-s) var(--space-l);
  background: var(--color-surface-container);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-l);
  margin-bottom: var(--space-l);
}

.plan-note-bar__text {
  flex: 1;
  font: var(--text-body-2);
  color: var(--color-fg-secondary);
}

.plan-note-bar__text--empty {
  color: var(--color-fg-tertiary);
  font-style: italic;
}

/* Calendar Grid */
.meal-grid {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 1px;
  background: var(--color-border-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-l);
  overflow: hidden;
  box-shadow: var(--shadow-2), var(--shadow-card);
}

.meal-grid__corner {
  background: var(--color-surface-container);
  padding: var(--space-s);
}

.meal-grid__day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-s);
  background: var(--color-surface-container);
}

.meal-grid__day-name {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
}

.meal-grid__day-date {
  font: var(--text-body-2);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-semibold);
}

.meal-grid__type-label {
  display: flex;
  align-items: center;
  padding: var(--space-s);
  background: var(--color-surface-container);
  font: var(--text-caption);
  color: var(--color-fg-tertiary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-caps);
  writing-mode: horizontal-tb;
}

.meal-grid__cell {
  position: relative;
  background: var(--color-surface-card);
  min-height: 72px;
}

.meal-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 72px;
  padding: var(--space-xs);
  border: none;
  background: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--easing-standard);
  gap: 2px;
}

.meal-cell--filled {
  background: var(--color-surface-card);
}

.meal-cell--filled:hover {
  background: var(--color-bg-tertiary);
}

.meal-cell__name {
  font: var(--text-caption);
  color: var(--color-fg-primary);
  font-weight: var(--font-weight-medium);
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.meal-cell__servings {
  font: var(--text-label-sm);
  color: var(--color-fg-tertiary);
}

.meal-cell--empty {
  color: var(--color-fg-tertiary);
  opacity: 0.4;
  transition: opacity var(--duration-fast) var(--easing-standard), background var(--duration-fast) var(--easing-standard);
}

.meal-cell--empty:hover {
  opacity: 1;
  background: var(--color-bg-tertiary);
}

.meal-cell__delete {
  position: absolute;
  top: 2px;
  right: 2px;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--easing-standard);
}

.meal-grid__cell:hover .meal-cell__delete {
  opacity: 1;
}

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .meal-grid {
    grid-template-columns: 60px repeat(7, 1fr);
  }

  .meal-cell__name {
    font-size: 11px;
  }

  .meal-grid__day-name {
    font-size: 10px;
  }
}

@media (max-width: 540px) {
  .meal-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .meal-grid__corner {
    display: none;
  }

  .meal-grid__day-header {
    flex-direction: row;
    gap: var(--space-s);
    justify-content: center;
    padding: var(--space-xs) var(--space-s);
    font-weight: var(--font-weight-semibold);
  }

  .meal-grid__type-label {
    padding: var(--space-xs) var(--space-s);
    font-size: 11px;
  }

  .meal-grid__cell {
    min-height: 48px;
  }

  .meal-cell {
    min-height: 48px;
    flex-direction: row;
    gap: var(--space-xs);
  }

  .meal-cell__delete {
    opacity: 1;
  }
}
</style>
