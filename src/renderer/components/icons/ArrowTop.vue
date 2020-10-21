<template>
  <svg :width="width" :height="height" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 4L4 1L7 4" stroke="#23BB72" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>

<script>
export default {
  props: {
    width: {
      type: Number,
      default: 8
    },
    height: {
      type: Number,
      default: 5
    }
  }
}
</script>
