<script setup lang="ts">
import { ref } from 'vue';

const me = ref(undefined);
  fetch("/api/users/me")
    .then((res) => res.json())
    .then((data) => (me.value = data));
</script>

<template>
  <div>
    <a v-if="me === null" class="button" href="/api/auth/discord">Login</a>
    <div v-else-if="me === undefined">Loading</div>
    <div v-else> {{ me }}</div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
