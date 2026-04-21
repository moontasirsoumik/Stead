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
    '#1B5299', '#0D6B0D', '#9B2335', '#8B6914',
    '#6B4D96', '#026C6F', '#9A3D0C', '#3D56B2',
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
  color: var(--color-on-primary-container);
  font-weight: var(--font-weight-medium);
  background: var(--color-primary-container);
}

.savatar--sm { width: var(--height-control-sm); height: var(--height-control-sm); font: var(--text-label-sm); }
.savatar--md { width: var(--height-control-md); height: var(--height-control-md); font: var(--text-label-md); }
.savatar--lg { width: var(--height-control-lg); height: var(--height-control-lg); font: var(--text-label-lg); }

.savatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.savatar__initials {
  letter-spacing: var(--tracking-wide);
  color: #FFFFFF;
}

.savatar__fallback {
  display: flex;
  color: var(--color-fg-tertiary);
}
</style>
