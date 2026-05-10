<script setup lang="ts">
import MoneyTabs from '@/features/money/components/MoneyTabs.vue'
</script>

<template>
  <div class="money-layout">
    <MoneyTabs />
    <router-view />
  </div>
</template>

<style scoped>
.money-layout {
  display: flex;
  flex-direction: column;
}
</style>
