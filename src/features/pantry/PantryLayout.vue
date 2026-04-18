<script setup lang="ts">
</script>

<template>
  <div class="pantry-layout">
    <router-view />
  </div>
</template>

<style scoped>
.pantry-layout {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
