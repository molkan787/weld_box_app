<template>
  <div class="state">
    <StateHeader :state="state" />
    <StateCodeBlock v-if="showCodeBlocks" :state="state" />
  </div>
</template>

<script>
import StateCodeBlock from './StateCodeBlock';
import StateHeader from './StateHeader';
export default {
  components: {
    StateCodeBlock,
    StateHeader
  },
  props: {
    state: {
      type: Object,
      required: true
    }
  },
  computed: {
    showCodeBlocks(){
      const s = this.state;
      if(s.isSubTask){
        return s.props.isOpen;
      }else{
        return true;
      }
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
</style>
