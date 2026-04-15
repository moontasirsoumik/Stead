<script setup lang="ts">
withDefaults(
  defineProps<{
    name?: string
    src?: string
    size?: 'sm' | 'md' | 'lg'
    color?: string
  }>(),
  {
    size: 'md',
  },
)

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function hashColor(name: string): string {
  const colors = [
    '#0F6CBD', '#107C10', '#C4314B', '#D48C00',
    '#8764B8', '#038387', '#CA5010', '#4F6BED',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
</script>

<template>
  <div
    :class="['savatar', `savatar--${size}`]"
    :style="!src && name ? { backgroundColor: color ?? hashColor(name) } : undefined"
    :aria-label="name"
    role="img"
  >
    <img v-if="src" :src="src" :alt="name ?? 'Avatar'" class="savatar__img" />
    <span v-else-if="name" class="savatar__initials">{{ getInitials(name) }}</span>
    <span v-else class="savatar__fallback" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="3" stroke="currentColor" stroke-width="1.5" />
        <path d="M2 14.5C2 11.5 4.5 9.5 8 9.5C11.5 9.5 14 11.5 14 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.savatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-circle);
  overflow: hidden;
  flex-shrink: 0;
  color: var(--color-fg-on-brand);
  font-weight: var(--font-weight-medium);
  background: var(--color-bg-tertiary);
}

.savatar--sm { width: 22px; height: 22px; font-size: 9px; }
.savatar--md { width: 26px; height: 26px; font-size: 10px; }
.savatar--lg { width: 30px; height: 30px; font-size: 11px; }

.savatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.savatar__initials {
  letter-spacing: var(--tracking-wide);
}

.savatar__fallback {
  display: flex;
  color: var(--color-fg-tertiary);
}
</style>
