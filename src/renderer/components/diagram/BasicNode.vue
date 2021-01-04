<template>
  <div class="basic-node" @click="onClick">
    <MessageIcon :size="34" v-if="object.what === 'message'" />
    <EventIcon :size="34" v-else-if="object.what === 'event'" />
    <JunctionIcon :size="42" v-else-if="object.what === 'junction'" />
    <VariableIcon :size="34" v-else-if="object.what === 'var'" />
    <div v-if="showName" class="name-label">
      {{ object.name }}
    </div>
  </div>
</template>

<script>
import MessageIcon from '../icons/Message';
import EventIcon from '../icons/Event';
import JunctionIcon from '../icons/Junction';
import VariableIcon from '../icons/Variable';
export default {
  components: {
    MessageIcon,
    EventIcon,
    JunctionIcon,
    VariableIcon
  },
  props: {
    object: {
      type: Object,
      required: true
    }
  },
  computed: {
    showName(){
      const w = this.object.what;
      return (w == 'message' || w == 'event' || w == 'var') && this.object.name;
    }
  },
  methods: {
    onClick(){
      this.object.select();
    }
  }
}
</script>

<style lang="less" scoped>
.basic-node{
  width: 100%;
  height: 100%;
  .junction-icon{
    margin: -4px;
  }
  .name-label{
    @width: 200px;
    width: @width;
    white-space: nowrap;
    pointer-events: none;
    position: relative;
    top: 0px;
    left: 50%;
    transform: translateX(@width / -2);
    text-align: center;
  }
}
</style>
