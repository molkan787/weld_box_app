<template>
  <svg :width="size" :height="size" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.5 1V10" stroke="#23BB72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M1 5.5L10 5.5" stroke="#23BB72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

<script>
export default {
  props: {
    size: {
      type: Number,
      default: 11
    }
  }
}
</script>
