<template>
  <div class="state-header" @click="onClick()">
    <span class="title">
      {{ state.name }}
      <div v-if="state.isSubTask" class="label">SUBTASK</div>
    </span>
    <StateIndicators :state="state" />
  </div>
</template>

<script>
import StateIndicators from './StateIndicators';
export default {
  components: {
    StateIndicators
  },
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  methods: {
    onClick(){
      this.state.select();
    }
  }
}
</script>

<style lang="less" scoped>
.state-header{
  width: 100%;

  .state-indicators{
    float: right;
    position: relative;
  }
  .title{
    display: inline-block;
    padding: 3px 6px;
  }
  .label{
    position: relative;
    top: -2px;
    left: 6px;
    display: inline;
    font-size: 10px;
    font-style: normal;
    font-weight: bold;
    line-height: 12px;
    padding: 4px;
    background: #18191D;
    border-radius: 29px;
    color: #FFFFFF7F;
  }
}
</style>
