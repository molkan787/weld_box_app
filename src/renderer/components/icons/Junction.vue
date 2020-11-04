<template>
  <svg class="junction-icon" :width="size" :height="size" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.7">
  <circle cx="10" cy="10" r="6.25" stroke="white" stroke-width="1.5"/>
  <circle cx="10" cy="10" r="1.25" stroke="white" stroke-width="1.5"/>
  </g>
  </svg>
</template>

<script>
export default {
  props: {
    size: {
      type: Number,
      default: 20
    }
  }
}
</script>
