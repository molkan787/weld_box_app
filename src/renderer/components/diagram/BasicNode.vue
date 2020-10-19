<template>
  <div class="basic-node" @click="onClick">
    <MessageIcon :size="34" v-if="object.what === 'message'" />
    <EventIcon :size="34" v-else />
  </div>
</template>

<script>
import MessageIcon from '../icons/Message';
import EventIcon from '../icons/Event';
export default {
  components: {
    MessageIcon,
    EventIcon
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
}
</style>
