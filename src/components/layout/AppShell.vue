<script setup lang="ts">
import { ref, provide, readonly } from 'vue'
import AppHeader from './AppHeader.vue'
import NavRail from './NavRail.vue'
import MobileNav from './MobileNav.vue'

const navExpanded = ref(false)
const toggleNav = () => { navExpanded.value = !navExpanded.value }

provide('navExpanded', readonly(navExpanded))
provide('toggleNav', toggleNav)
</script>

<template>
  <div class="shell">
    <AppHeader class="shell__header" @toggle-nav="toggleNav" />

    <div class="shell__body">
      <NavRail
        :expanded="navExpanded"
        class="shell__nav"
        @collapse="navExpanded = false"
      />

      <main class="shell__content">
        <RouterView v-slot="{ Component, route }">
          <Transition name="route" mode="out-in">
            <component :is="Component" :key="route.matched[1]?.path ?? route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <MobileNav class="shell__mobile-nav" />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.shell__header {
  flex-shrink: 0;
  z-index: 100;
}

.shell__body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.shell__nav {
  flex-shrink: 0;
}

.shell__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding: var(--space-xl);
}

.shell__mobile-nav {
  display: none;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .shell__nav {
    display: none;
  }

  .shell__mobile-nav {
    display: flex;
  }

  .shell__content {
    padding: var(--space-l);
    padding-bottom: calc(var(--height-mobile-nav) + var(--space-l));
  }
}
</style>
