<template>
  <div class="radio-button-group">
    <div v-for="(item, index) in items" :key="index" @click="$emit('input', item.value)"
      class="item" :class="item.value === value ? 'selected' : ''">
      {{ item.text }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      required: true,
    },
    value: {
      type: String,
    }
  }
}
</script>

<style lang="less" scoped>
.radio-button-group{
  display: flex;
  width: 100%;
  box-sizing: border-box;
  border-radius: 6px;
  background: #141519;
  color: white;
  font-size: 14px;
  font-weight: bold;
  margin-top: 4px;
  flex-direction: row;
  overflow: hidden;
  .item{
    flex-basis: 100%;
    cursor: pointer;
    padding: 8px 12px;
    text-align: center;
    user-select: none;
    &.selected{
      background-color: #3B3D44;
    }
  }
}
</style>
