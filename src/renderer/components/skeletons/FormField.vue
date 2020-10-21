<template>
  <div class="field" :class="{ disabled }">
    <label>{{ label }}</label>
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: 'Field'
    },
    disabled: {
      type: Boolean,
      default: false,
    }
  }
}
</script>
