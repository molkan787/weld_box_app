<template>
<svg :width="size" :height="size" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.7">
    <path d="M7 15C5.03466 13.4798 4 11.7554 4 10C4 8.24463 5.03467 6.52019 7 5" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13 15C14.9653 13.4798 16 11.7554 16 10C16 8.24463 14.9653 6.52019 13 5" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 12L8 8" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 8.00001L8 12" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linecap="round" stroke-linejoin="round"/>
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
