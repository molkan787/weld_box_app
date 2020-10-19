<template>
  <svg :width="size" :height="size" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g opacity="0.7">
  <path d="M3.75 7.73607C3.75 7.2626 4.0175 6.82977 4.44098 6.61803L9.44098 4.11803C9.79289 3.94208 10.2071 3.94208 10.559 4.11803L15.559 6.61803C15.9825 6.82977 16.25 7.2626 16.25 7.73607V15C16.25 15.6904 15.6904 16.25 15 16.25H5C4.30964 16.25 3.75 15.6904 3.75 15V7.73607Z" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linejoin="round"/>
  <path d="M4 8L8.8906 11.2604C9.5624 11.7083 10.4376 11.7083 11.1094 11.2604L16 8" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linejoin="round"/>
  <path d="M4 15L9.10557 12.4472C9.66863 12.1657 10.3314 12.1657 10.8944 12.4472L16 15" stroke="white" stroke-width="1.5" stroke-miterlimit="5.75877" stroke-linejoin="round"/>
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
