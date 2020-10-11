<template>
  <div class="state">
    <StateIndicators :state="state" />
    <StateCodeBlock :state="state" />
    <button @click="state.showContent = !state.showContent">{{ state.showContent ? 'Hide content' : 'Show content' }}</button>
    <button @click="openState">Open</button>
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
  },
  methods: {
    openState(){
      this.state.open();
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
