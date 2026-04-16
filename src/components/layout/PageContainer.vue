<script setup lang="ts">
withDefaults(
  defineProps<{
    narrow?: boolean
  }>(),
  {
    narrow: false,
  },
)
</script>

<template>
  <div :class="['pagecontainer', { 'pagecontainer--narrow': narrow }]">
    <slot />
  </div>
</template>

<style scoped>
.pagecontainer {
  width: 100%;
}

.pagecontainer--narrow {
  max-width: 720px;
  margin: 0 auto;
}
</style>
