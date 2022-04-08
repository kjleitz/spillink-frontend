<template>
  <div class="chat">
    <h1>{{ username }}</h1>

    <form action="#" @submit.prevent="submitUsername">
      <label>
        username
        <input
          v-model="form.username"
          :placeholder="username"
          type="text"
          id="username"
          name="username"
        >
      </label>
      <button type="submit">change</button>
    </form>

    <form action="#" @submit.prevent="submitMessage">
      <label>
        message
        <input
          v-model="form.message"
          type="text"
          id="message"
          name="message"
        >
      </label>
      <button type="submit">send</button>
    </form>

    <h2>messages</h2>
    <ul>
      <li v-for="message in messages" class="message">{{message}}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount, onUnmounted, reactive } from "vue";
import { disconnect, listenFor, onOpen, sendMessage } from "@/api/sockets";

const DEFAULT_USERNAME = "(nobody)";

const messages = reactive<string[]>([]);
const username = ref(DEFAULT_USERNAME);
const form = reactive({ username: "", message: "" });

onBeforeMount(() => {
  onOpen((_event) => {
    sendMessage("text", { text: "yee haw" });
  });

  listenFor("set:username", (message) => {
    console.log("Message of type 'set:username' from socket:", JSON.stringify(message, null, 2));
    username.value = message.data.username;
  });

  listenFor("text", (message) => {
    console.log("Message of type 'text' from socket:", JSON.stringify(message, null, 2));
    messages.push(`<${message.from_username}>: ${message.data.text}`);
  });
});

onUnmounted(() => {
  disconnect();
});

const submitUsername = () => {
  sendMessage("set:username", { username: form.username });
  form.username = "";
};

const submitMessage = () => {
  const text = form.message;
  sendMessage("text", { text });
  messages.push(`me: ${text}`);
  form.message = "";
};
</script>

<style lang="scss">
.chat {
  // ...
}
</style>
