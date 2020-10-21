<template>
  <svg :width="size" :height="size" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.5">
  <path d="M6 6L1 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M1 6L6 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  </svg>
</template>

<script>
export default {
  props: {
    size: {
      type: Number,
      default: 7
    }
  }
}
</script>
