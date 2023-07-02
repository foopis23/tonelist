<script setup lang="ts">
  import { ref } from "vue";
  import { client } from "./trpc";

  const me = ref<any>(undefined);
  client.users.getMe.query().then((user) => {
    me.value = user;
  }).catch((err) => {
    console.log(err);
    me.value = null;
  });
</script>

<template>
  <div>
    <a v-if="me === null" class="button" href="/api/auth/discord">Login</a>
    <div v-else-if="me === undefined">Loading</div>
    <div v-else>
      <p>{{ me }}</p>
      <a href="/api/auth/logout">Logout</a>
    </div>
  </div>
</template>

