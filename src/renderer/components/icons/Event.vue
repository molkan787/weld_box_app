<template>
  <svg :width="size" :height="size" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.7">
  <rect x="3.75" y="3.75" width="12.5" height="12.5" rx="3.25" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linejoin="round"/>
  <path d="M6 3V5" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M15 5L5 5" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 11L9.23077 12L12 9" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 3V5" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
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
