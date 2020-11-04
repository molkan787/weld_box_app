<template>
  <div class="basic-node" @click="onClick">
    <MessageIcon :size="34" v-if="object.what === 'message'" />
    <EventIcon :size="34" v-else-if="object.what === 'event'" />
    <JunctionIcon :size="42" v-else-if="object.what === 'junction'" />
  </div>
</template>

<script>
import MessageIcon from '../icons/Message';
import EventIcon from '../icons/Event';
import JunctionIcon from '../icons/Junction';
export default {
  components: {
    MessageIcon,
    EventIcon,
    JunctionIcon
  },
  props: {
    object: {
      type: Object,
      required: true
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
}
</style>
