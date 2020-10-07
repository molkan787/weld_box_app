<template>
  <div class="state">
    <StateIndicators :state="state" />
    <StateCodeBlock :state="state" />
  </div>
</template>

<script>
import StateCodeBlock from './StateCodeBlock';
import StateIndicators from './StateIndicators';
export default {
  components: {
    StateCodeBlock,
    StateIndicators
  },
  props: {
    state: {
      type: Object,
      required: true
    }
  }
}
</script>

<style lang="less" scoped>
.state{
  position: relative;
}
.code-block{
  top: 29px;
}
.state-indicators{
  float: right;
  position: relative;
}
</style>
